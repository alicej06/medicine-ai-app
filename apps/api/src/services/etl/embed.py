# turn text chunks into embeddings
# model used: 'sentence-transformers/all-MiniLM-L6-v2'
# output: 384 dim vector

from typing import List
from functools import lru_cache
import numpy as np

@lru_cache(maxsize=1)
def _model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_text(text: str) -> List[float]:
    m = _model()
    v = m.encode([text], normalize_embeddings=True)[0]  
    return v.astype(np.float32).tolist()

def embed_texts(texts: List[str]) -> List[List[float]]:
    m = _model()
    M = m.encode(texts, normalize_embeddings=True)    
    return M.astype(np.float32).tolist()