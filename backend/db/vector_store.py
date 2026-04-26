from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct
)
from typing import List
import uuid
import logging
import hashlib

from utils.config import settings

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self):
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )
        print("QDRANT CONNECTED:", settings.QDRANT_URL)
        self.collection = settings.QDRANT_COLLECTION
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if self.collection not in collections:
                print("Creating Qdrant collection...")
                self.client.create_collection(
                    collection_name=self.collection,
                    vectors_config=VectorParams(
                        size=1,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection}")
            else:
                print("Collection already exists")
        except Exception as e:
            print("QDRANT ERROR:", e)
            logger.error(f"Qdrant init error: {e}")

    def embed(self, text: str) -> List[float]:
        # Lightweight hash embedding — no sentence-transformers, Render-safe
        hash_val = int(hashlib.md5(text.lower().strip().encode()).hexdigest(), 16)
        normalised = ((hash_val % 1000) / 500.0) - 1.0
        return [normalised]

    def count_candidates(self) -> int:
        try:
            info = self.client.get_collection(self.collection)
            count = info.points_count or 0
            print(f"Qdrant total indexed candidates: {count}")
            return count
        except Exception as e:
            logger.error(f"count_candidates error: {e}")
            return 0

    def upsert_candidate(self, candidate_id: str, text: str, payload: dict) -> str:
        self._ensure_collection()
        vector = self.embed(text)
        point_id = str(uuid.uuid4())
        self.client.upsert(
            collection_name=self.collection,
            points=[
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={**payload, "candidate_id": candidate_id}
                )
            ]
        )
        return point_id

    def search_candidates(self, query_text: str) -> List[dict]:
        """Always fetches ALL indexed candidates — no top_k cap."""
        self._ensure_collection()
        vector = self.embed(query_text)
        total  = max(self.count_candidates(), 1)

        print(f"Qdrant search: fetching ALL {total} candidates")

        results = self.client.search(
            collection_name=self.collection,
            query_vector=vector,
            limit=total,
            with_payload=True
        )

        return [
            {
                "candidate_id": r.payload.get("candidate_id"),
                "score": r.score,
                "payload": r.payload
            }
            for r in results
        ]

    def delete_all(self):
        try:
            self.client.delete_collection(self.collection)
            self._ensure_collection()
            logger.info("Qdrant collection reset")
        except Exception as e:
            logger.error(f"Qdrant reset error: {e}")

    def get_similarity(self, text1: str, text2: str) -> float:
        v1 = self.embed(text1)
        v2 = self.embed(text2)
        dot  = sum(a * b for a, b in zip(v1, v2))
        mag1 = sum(a ** 2 for a in v1) ** 0.5
        mag2 = sum(b ** 2 for b in v2) ** 0.5
        return dot / (mag1 * mag2) if mag1 and mag2 else 0.0


# singleton
vector_store = VectorStore()