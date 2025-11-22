# apps/api/src/services/clients/openfda_client.py

import os
import time
from typing import Any, Dict, Optional

import httpx


class OpenFDAClient:
    """
    Simple wrapper around the openFDA Drug Labeling API.
    Docs: https://api.fda.gov/drug/label.json
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: int = 10,
    ) -> None:
        # First try explicitly passed arguments,
        # then environment variables,
        # then safe defaults.
        self.base_url = base_url or os.getenv("OPENFDA_BASE_URL", "https://api.fda.gov")
        self.api_key = api_key or os.getenv("OPENFDA_API_KEY", None)
        self._client = httpx.Client(base_url=self.base_url, timeout=timeout)

    def _params(self, extra: Dict[str, Any] | None = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if extra:
            params.update(extra)
        if self.api_key:
            params["api_key"] = self.api_key
        return params

    def search_labels(self, query: str, limit: int = 100, skip: int = 0) -> Dict[str, Any]:
        params = self._params({"search": query, "limit": limit, "skip": skip})

        resp = self._client.get("/drug/label.json", params=params)

        if resp.status_code == 429:
            time.sleep(2)
            resp = self._client.get("/drug/label.json", params=params)

        resp.raise_for_status()
        return resp.json()

    def get_label_by_id(self, spl_id: str) -> Dict[str, Any]:
        params = self._params({"search": f"id:{spl_id}"})
        resp = self._client.get("/drug/label.json", params=params)
        resp.raise_for_status()
        return resp.json()
