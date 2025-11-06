from typing import Any, Optional, Dict, Tuple
from time import time

_TTL = 60 * 60  
_STORE: Dict[str, Tuple[float, Any]] = {}

def get_cached(key: str) -> Optional[Any]:
    now = time()
    hit = _STORE.get(key)
    if not hit: return None
    ts, val = hit
    if now - ts > _TTL:
        _STORE.pop(key, None)
        return None
    return val

def set_cached(key: str, value: Any) -> None:
    _STORE[key] = (time(), value)
