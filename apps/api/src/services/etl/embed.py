# turn text chunks into embeddings
# model used: 'sentence-transformers/all-MiniLM-L6-v2'
# output: 384 dim vector

from typing import List
import numpy as np 
from sentence_transformers import SentenceTransformer 

_model = None
def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    return _model

def embed_texts(texts: List[str]) ->np.ndarray:
    model = get_model()
    vecs = model.encode(texts, convert_to_numpy=True, normalize_embeddings = True)
    return vecs.astype("float32")