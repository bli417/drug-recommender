# Data Directory

This directory contains the required files for the drug recommender application:

1. `pythonsqlite.db` - The SQLite database containing FDA drug information
2. `trained_pharma.model` - The trained word2vec model for drug recommendations

## Dataset Setup

To generate the database from scratch:

1. Download the FDA drug label dataset from [openFDA](https://open.fda.gov/apis/drug/label/download/)
2. Place the following JSON files in this directory:
   - drug-label-0001-of-0007.json
   - drug-label-0002-of-0007.json
   - drug-label-0003-of-0007.json
   - drug-label-0004-of-0007.json
   - drug-label-0005-of-0007.json
   - drug-label-0006-of-0007.json
   - drug-label-0007-of-0007.json
3. Run the database generation script:
   ```bash
   python database_generation.py
   ```

## Pre-built Files

If you don't want to generate the database from scratch, you can use the pre-built files:

- `pythonsqlite.db` (54MB)
- `trained_pharma.model` (45MB)

These files are available in the repository and can be used directly. 