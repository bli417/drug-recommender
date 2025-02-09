import collections
import sqlite3

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


# download necessary package
nltk.download('wordnet')

database_file = "pythonsqlite.db"
database_path = Path(database_file)
if not database_path.exists():
    create_db(database_file)
    check_row_count(database_file)

model_file = "trained_pharma.model"
model_path = Path(model_file)
if not model_path.exists():
    train()

# Initialize necessary global variables
app = Flask(__name__)
CORS(app)

lemmer = WordNetLemmatizer()
model = KeyedVectors.load(model_file, mmap='r')

limiter = Limiter(app, key_func=get_remote_address)


# Search drug that treats the given symptom
@app.route('/')
@limiter.limit("100 per minute")
def search():
    # Add input validation
    if not validators.length(request.args['symptom'], min=1, max=100):
        return jsonify({"error": "Invalid input"}), 400

    w = request.args['symptom']
    y = request.args['interactions']
    z = request.args['ingredient']

    word = model.most_similar([w], topn=6)
    sim_words = []
    for n in word:
        n = lemmer.lemmatize(n[0].lower()).replace("_", " ")
        if n == w:
            continue
        else:
            sim_words.append(n)
    sim_words = np.unique(sim_words)[::-1]

    try:
        connection = sqlite3.connect(database_file)
        cursor = connection.cursor()
        cursor.execute(
            "SELECT * from fda_data WHERE indications LIKE ? OR indications LIKE ? OR indications LIKE ? OR indications LIKE ? AND purpose LIKE ? OR purpose LIKE ? OR purpose LIKE ? OR purpose LIKE ? AND interactions NOT LIKE ? AND ingredient NOT LIKE ? LIMIT 5",
            (f"%{w}%", f"%{sim_words[0]}%", f"%{sim_words[1]}%", f"%{sim_words[2]}%", f"%{w}%", f"%{sim_words[0]}%", f"%{sim_words[1]}%", f"%{sim_words[2]}%", f"%{y}%", f"%{z}%"))
        data = cursor.fetchall()

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
    finally:
        cursor.close()
        connection.close()


# Find drug that have the exact name
@app.route('/multi/')
def find():
    w = request.args['generic']
    y = request.args['brand']

    try:
        connection = sqlite3.connect(database_file)
        cursor = connection.cursor()
        cursor.execute(
            "SELECT * from fda_data WHERE generic LIKE ? AND brand LIKE ? LIMIT 5",
            (f"%{w}%", f"%{y}%"))
        data = cursor.fetchall()

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
    finally:
        cursor.close()
        connection.close()


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=8081)
