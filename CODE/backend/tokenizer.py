import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('punkt')
    nltk.download('wordnet')

# Initialize lemmatizer
lemmer = WordNetLemmatizer()

def tokenize(text):
    """
    Tokenize and lemmatize the input text
    """
    # Tokenize the text
    tokens = word_tokenize(text.lower())
    
    # Lemmatize each token
    lemmatized_tokens = [lemmer.lemmatize(token) for token in tokens]
    
    return lemmatized_tokens

# Define token types
TOK = {
    'WORD': 'WORD',
    'NUMBER': 'NUMBER',
    'PUNCTUATION': 'PUNCTUATION'
} 