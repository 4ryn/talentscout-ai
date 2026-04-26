from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct
)
from sentence_transformers import SentenceTransformer
from typing import List
import uuid
import logging

from utils.config import settings

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self):
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )

        print("QDRANT CONNECTED:", settings.QDRANT_URL)  # debug

        # self.encoder = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.encoder = None
        def get_encoder(self):
            if self.encoder is None:
                from sentence_transformers import SentenceTransformer
                self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
            return self.encoder
        self.collection = settings.QDRANT_COLLECTION

        self._ensure_collection()

    def _ensure_collection(self):
        try:
            collections = [c.name for c in self.client.get_collections().collections]

            if self.collection not in collections:
                print("Creating Qdrant collection...")  # debug

                self.client.create_collection(
                    collection_name=self.collection,
                    vectors_config=VectorParams(
                        size=settings.EMBEDDING_DIM,
                        distance=Distance.COSINE
                    )
                )

                logger.info(f"Created Qdrant collection: {self.collection}")
            else:
                print("Collection already exists")  # debug

        except Exception as e:
            print("QDRANT ERROR:", e)  # 🔥 IMPORTANT DEBUG
            logger.error(f"Qdrant init error: {e}")

    def embed(self, text: str) -> List[float]:
        encoder = self.get_encoder()
        return encoder.encode(text).tolist()

    def upsert_candidate(self, candidate_id: str, text: str, payload: dict) -> str:
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

    def search_candidates(self, query_text: str, top_k: int = 10) -> List[dict]:
        vector = self.embed(query_text)

        results = self.client.search(
            collection_name=self.collection,
            query_vector=vector,
            limit=top_k,
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

        dot = sum(a * b for a, b in zip(v1, v2))
        mag1 = sum(a ** 2 for a in v1) ** 0.5
        mag2 = sum(b ** 2 for b in v2) ** 0.5

        return dot / (mag1 * mag2) if mag1 and mag2 else 0.0


# ✅ This ensures initialization runs
vector_store = VectorStore()