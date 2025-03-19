import json
import sqlite3
from unidecode import unidecode
from tokenizer import tokenize, TOK
from pathlib import Path

# Set up data directory
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

def create_db(name="pythonsqlite.db"):
    print("Please download dataset from openFDA(https://open.fda.gov/apis/drug/label/download/) first before running this method")
    """ create the database """
    filenames = ["drug-label-0001-of-0007.json", "drug-label-0002-of-0007.json", "drug-label-0003-of-0007.json",
                 "drug-label-0004-of-0007.json", "drug-label-0005-of-0007.json", "drug-label-0006-of-0007.json",
                 "drug-label-0007-of-0007.json"]
    try:
        connect = sqlite3.connect(DATA_DIR / name)
        cursor = connect.cursor()
        cursor.execute('''DROP TABLE IF EXISTS fda_data''')
        cursor.execute('''
        	CREATE TABLE fda_data(purpose TEXT, dosage TEXT,
        		indications TEXT, interactions TEXT, description TEXT, reactions TEXT, ingredient TEXT, risks TEXT, warnings TEXT, generic TEXT, brand TEXT)
        		''')
        connect.commit()
        for file in filenames:
            print(file)
            with open(DATA_DIR / file, 'r', encoding='utf-8') as fp:
                obj = json.load(fp)
                print("number of results = ", len(obj['results']))

                for result in obj['results']:
                    if 'product_type' not in result['openfda'] or result['openfda']['product_type'][
                        0] == 'HUMAN PRESCRIPTION DRUG':
                        continue
                    purpose = ''
                    if 'purpose' in result:
                        purpose = result['purpose']
                        p = []
                        for eachP in purpose:
                            anP = unidecode(eachP)
                            p.append(anP)
                        purpose = str(p[0]).strip('[]')
                        purpose = purpose.lower().replace("purpose", "").replace("indications", "").replace(":",
                                                                                                            "").replace(
                            "'", "").replace("*", "").strip()
                    dosage = ''
                    if 'dosage' in result:
                        dosage = result['dosage']
                        d = []
                        for eachD in dosage:
                            anD = unidecode(eachD)
                            d.append(anD)
                        dosage = str(d[0]).strip('[]')
                        dosage = dosage.lower().replace(":", "").replace("'", "").replace("*", "").strip()
                    indications_tokens = ''
                    if 'indications_and_usage' in result:
                        ind = []
                        indications = result['indications_and_usage']
                        for eaInd in indications:
                            anInd = unidecode(eaInd)
                            ind.append(anInd)
                        for token in tokenize(str(ind).strip('[]').lower()):
                            if TOK.descr[token.kind] == 'WORD':
                                if (token.txt != 'and') and (token.txt != 'is') and (token.txt != 'to') and (
                                        token.txt != 'of') and (token.txt != 'the'):
                                    indications_tokens += ',' + token.txt
                    interactions_tokens = ''
                    if 'drug_interactions' in result:
                        ind = []
                        interactions = result['drug_interactions']
                        for eaInd in interactions:
                            anInd = unidecode(eaInd)
                            ind.append(anInd)
                        for token in tokenize(str(ind).strip('[]').lower()):
                            if TOK.descr[token.kind] == 'WORD':
                                if (token.txt != 'and') and (token.txt != 'is') and (token.txt != 'to') and (
                                        token.txt != 'of') and (token.txt != 'the'):
                                    interactions_tokens += ',' + token.txt
                    description = ''
                    if 'description' in result:
                        description = result['description']
                        d = []
                        for eachD in description:
                            anD = unidecode(eachD)
                            d.append(anD)
                        description = str(d[0]).strip('[]')
                        description = description.lower().replace(":", "").replace("'", "").replace("*", "").strip()
                    reactions = ''
                    if 'adverse_reactions' in result:
                        reactions = result['adverse_reactions']
                        r = []
                        for eachR in reactions:
                            anR = unidecode(eachR)
                            r.append(anR)
                        reactions = str(r[0]).strip('[]')
                        reactions = reactions.lower().replace(":", "").replace("'", "").replace("*", "").strip()
                    ingredient = ''
                    if 'ingredient' in result:
                        ingredient = result['ingredient']
                        i = []
                        for eachI in ingredient:
                            anI = unidecode(eachI)
                            i.append(anI)
                        ingredient = str(i[0]).strip('[]')
                        ingredient = ingredient.lower().replace(":", "").replace("'", "").replace("*", "").strip()
                    risks = ''
                    if 'risks' in result:
                        r = []
                        for eachR in reactions:
                            anR = unidecode(eachR)
                            r.append(anR)
                        risks = str(r[0]).strip('[]')
                        risks = risks.lower().replace(":", "").replace("'", "").replace("*", "").strip()
                    warnings = ''
                    if 'warnings' in result:
                        warnings = result['warnings']
                        w = []
                        for eachW in warnings:
                            anW = unidecode(eachW)
                            w.append(anW)
                        warnings = str(w[0]).strip('[]')
                        warnings = warnings.lower().replace(":", "").replace("'", "").replace("*", "").replace(
                            "warnings:",
                            "").replace(
                            "warnings", "").replace("warning", "").strip()
                    generic = ''
                    brand = ''
                    if 'openfda' in result:
                        openfda = result['openfda']
                        if 'generic_name' in openfda:
                            generic = result['openfda']['generic_name']
                            generic = generic[0].strip('[]')
                            generic = generic.lower().replace(":", "").replace("'", "").replace("*", "").strip()
                        if 'brand_name' in openfda:
                            brand = result['openfda']['brand_name']
                            brand = brand[0].strip('[]')
                            brand = brand.lower().replace(":", "").replace("'", "").replace("*", "").strip()
                    cursor.execute(
                        'INSERT INTO fda_data(purpose, dosage, indications, interactions, description, reactions, ingredient, risks, warnings, generic, brand) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
                        (
                            purpose, dosage, indications_tokens[1:], interactions_tokens, description, reactions,
                            ingredient,
                            risks,
                            warnings, generic, brand))
                    connect.commit()
    finally:
        cursor.close()
        connect.close()


def check_row_count(db_file="pythonsqlite.db"):
    """ Check the total row count of the database """
    try:
        conn = sqlite3.connect(DATA_DIR / db_file)
        print(sqlite3.version)
        cursor = conn.execute("SELECT count(*) from fda_data")
        for row in cursor:
            print(row[0])
    finally:
        conn.close()
