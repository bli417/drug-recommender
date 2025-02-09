import re
import sqlite3

import gensim
import nltk
from gensim.models import Phrases
from gensim.models.phrases import Phraser
from nltk.corpus import stopwords
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import FAISS
from transformers import pipeline

def train():
    window_size = 10
    min_count = 1

    data = []

    nltk.download('stopwords')
    try:
        print("Start training recommendation model")
        connection = sqlite3.connect("pythonsqlite.db")
        cursor = connection.execute("SELECT indications from fda_data")
        for row in cursor:
            for n in row:
                new_data = re.split(",", n)
                new_data = [w for w in new_data if w not in stopwords.words('english')]
                data.append(new_data)

        # Paired common words
        phrases = Phrases(sentences=data, min_count=25, threshold=50)
        bigram = Phraser(phrases)
        for index, sentence in enumerate(data):
            data[index] = bigram[sentence]

        # Use Llama embeddings for training
        model_id = "meta-llama/Meta-Llama-3-8B"
        pipeline = transformers.pipeline("text-generation", model=model_id, model_kwargs={"torch_dtype": torch.bfloat16}, device_map="auto")
        embeddings = OpenAIEmbeddings(model="text-embedding-ada-002", llm=pipeline)
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
        docs = []
        for sentence in data:
            docs.extend(text_splitter.split_text(" ".join(sentence)))
        vectorstore = FAISS.from_texts(docs, embeddings)
        print(vectorstore)
        # ... (rest of the code remains unchanged) ...
    finally:
        cursor.close()
        connection.close()