import collections
import sqlite3
import os
import sys

import nltk
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from gensim.models import KeyedVectors
from nltk.stem.wordnet import WordNetLemmatizer
from pathlib import Path
from database_generation import create_db, check_row_count
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import validators

# Set up data directory
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

def train():
    """
    Basic training function that creates a dummy model if the real one doesn't exist.
    In production, this should be replaced with actual model training logic.
    """
    print("Training model...")
    # Create a dummy model for testing
    model = KeyedVectors(vector_size=100)
    model.save(str(DATA_DIR / "trained_pharma.model"))  # Convert Path to string
    print("Model training completed.")

# download necessary package
try:
    nltk.download('wordnet')
except Exception as e:
    print(f"Error downloading NLTK data: {e}")
    sys.exit(1)

database_file = DATA_DIR / "pythonsqlite.db"
database_path = Path(database_file)
if not database_path.exists():
    try:
        create_db(str(database_file))
        check_row_count(str(database_file))
    except Exception as e:
        print(f"Error creating database: {e}")
        sys.exit(1)

model_file = DATA_DIR / "trained_pharma.model"
model_path = Path(model_file)
if not model_path.exists():
    train()

# Initialize necessary global variables
app = Flask(__name__)
CORS(app)

try:
    lemmer = WordNetLemmatizer()
    model = KeyedVectors.load(str(model_file), mmap='r')
except Exception as e:
    print(f"Error loading model: {e}")
    sys.exit(1)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Search drug that treats the given symptom
@app.route('/api/')
@limiter.limit("100 per minute")
def search():
    try:
        symptom = request.args.get('symptom')
        interactions = request.args.get('interactions', '')
        ingredient = request.args.get('ingredient', '')

        if not symptom or not validators.length(symptom, min=1, max=100):
            return jsonify({"error": "Invalid input"}), 400

        word = model.most_similar([symptom], topn=6)
        sim_words = []
        for n in word:
            word_candidate = lemmer.lemmatize(n[0].lower()).replace("_", " ")
            if word_candidate == symptom:
                continue
            sim_words.append(word_candidate)

        # Ensure there are enough similar words before using them
        sim_words = np.unique(sim_words)[::-1]
        if len(sim_words) < 3:
            return jsonify({"error": "Not enough similar words found"}), 400

        connection = sqlite3.connect(database_file)
        cursor = connection.cursor()
        cursor.execute(
            "SELECT * from fda_data WHERE indications LIKE ? OR indications LIKE ? OR indications LIKE ? OR indications LIKE ? AND purpose LIKE ? OR purpose LIKE ? OR purpose LIKE ? OR purpose LIKE ? AND interactions NOT LIKE ? AND ingredient NOT LIKE ? LIMIT 5",
            (f"%{symptom}%", f"%{sim_words[0]}%", f"%{sim_words[1]}%", f"%{sim_words[2]}%", f"%{symptom}%", f"%{sim_words[0]}%", f"%{sim_words[1]}%", f"%{sim_words[2]}%", f"%{interactions}%", f"%{ingredient}%"))
        data = cursor.fetchall()

        if not data:
            return jsonify({"error": "No matching drugs found"}), 404

        d = collections.OrderedDict()
        d['genericName'] = data[0][9]
        d['brandName'] = data[0][10]
        d['purpose'] = data[0][0]
        d['warnings'] = data[0][8]

        d['similar'] = []
        for row in data[1:]:
            if row[9] == "" and row[10] == "":
                continue
            else:
                similar_dic = {
                    "genericName": row[9],
                    "brandName": row[10]
                }
                if similar_dic not in d['similar'] and (row[9] != d['genericName'] and row[10] != d['brandName']):
                    d['similar'].append(similar_dic)

        d['interactions'] = []
        return jsonify(d)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# Find drug that have the exact name
@app.route('/api/multi/')
def find():
    try:
        w = request.args.get('generic')
        y = request.args.get('brand')

        if not w or not y:
            return jsonify({"error": "Missing required parameters"}), 400

        connection = sqlite3.connect(database_file)
        cursor = connection.cursor()
        cursor.execute(
            "SELECT * from fda_data WHERE generic LIKE ? AND brand LIKE ? LIMIT 5",
            (f"%{w}%", f"%{y}%"))
        data = cursor.fetchall()

        if not data:
            return jsonify({"error": "No matching drugs found"}), 404

        d = collections.OrderedDict()
        d['genericName'] = data[0][9]
        d['brandName'] = data[0][10]
        d['purpose'] = data[0][0]
        d['warnings'] = data[0][8]

        cursor.execute("SELECT * from fda_data WHERE purpose LIKE ? LIMIT 5",
                      (d['purpose'],))

        sim_data = cursor.fetchall()

        d['similar'] = []
        for row in sim_data[1:]:
            if row[9] == "" and row[10] == "":
                continue
            else:
                similar_dic = {
                    "genericName": row[9],
                    "brandName": row[10]
                }

                if similar_dic not in d['similar'] and row[10] != d['brandName']:
                    d['similar'].append(similar_dic)

        d['interactions'] = []
        return jsonify(d)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

if __name__ == '__main__':
    # Ensure to disable debug mode on production
    app.run(host="0.0.0.0", debug=False, port=8081)
