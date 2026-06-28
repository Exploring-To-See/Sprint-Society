import os
import json
import numpy as np
from config import INDEX_PATH, TIERS, CORPUS_PATH


class KnowledgeRetriever:
    def __init__(self):
        self._index = None
        self._chunks = None
        self._model = None
        self._bm25 = None
        self._use_dense = False
        self._loaded = False

    def _load(self):
        if self._loaded:
            return
        self._loaded = True

        index_file = os.path.join(INDEX_PATH, "coach.index")
        chunks_file = os.path.join(INDEX_PATH, "chunks.json")

        if os.path.exists(chunks_file):
            with open(chunks_file, "r", encoding="utf-8") as f:
                self._chunks = json.load(f)
        else:
            from knowledge.embeddings import load_and_chunk_corpus
            self._chunks = load_and_chunk_corpus()
            os.makedirs(INDEX_PATH, exist_ok=True)
            with open(chunks_file, "w", encoding="utf-8") as f:
                json.dump(self._chunks, f, indent=2)

        from rank_bm25 import BM25Okapi
        tokenized = [c["content"].lower().split() for c in self._chunks]
        self._bm25 = BM25Okapi(tokenized)

        if os.path.exists(index_file):
            try:
                import faiss
                from sentence_transformers import SentenceTransformer
                self._index = faiss.read_index(index_file)
                self._model = SentenceTransformer("all-MiniLM-L6-v2")
                self._use_dense = True
            except Exception:
                self._use_dense = False
        else:
            self._use_dense = False

    def retrieve(self, query: str, tier: str = "general", top_k: int = 3, coach: str | None = None) -> list[dict]:
        """Hybrid retrieval using Reciprocal Rank Fusion (RRF) to merge dense and sparse rankings."""
        self._load()

        # Cross-cutting corpora apply to every runner, so they are always relevant.
        tier_relevant = {"general", "psychology", "mentality", "tactics", "planning", tier}
        if coach:
            tier_relevant.add(f"coach_{coach}")
        max_chunks = TIERS.get(tier, {}).get("max_rag_chunks", 3)

        # 1. Sparse BM25 Search
        bm25_scores = self._bm25.get_scores(query.lower().split())
        sparse_top_indices = np.argsort(bm25_scores)[-top_k * 4:][::-1]
        sparse_ranks = {idx: rank + 1 for rank, idx in enumerate(sparse_top_indices) if bm25_scores[idx] > 0}

        # 2. Dense Search (if enabled)
        dense_ranks = {}
        if self._use_dense and self._index is not None:
            try:
                query_embedding = self._model.encode([query], normalize_embeddings=True)
                dense_scores, dense_indices = self._index.search(
                    np.array(query_embedding).astype("float32"), top_k * 4
                )
                for rank, idx in enumerate(dense_indices[0]):
                    if idx >= 0 and idx < len(self._chunks):
                        dense_ranks[idx] = rank + 1
            except Exception:
                pass

        # 3. Reciprocal Rank Fusion (RRF)
        # Formula: RRF_Score = Sum( 1 / (60 + rank) )
        k = 60
        all_candidate_indices = set(sparse_ranks.keys()) | set(dense_ranks.keys())
        
        scored_results = []
        for idx in all_candidate_indices:
            chunk = self._chunks[idx]
            
            # Compute RRF terms
            rrf_dense = 1.0 / (k + dense_ranks[idx]) if idx in dense_ranks else 0.0
            rrf_sparse = 1.0 / (k + sparse_ranks[idx]) if idx in sparse_ranks else 0.0
            rrf_score = rrf_dense + rrf_sparse
            
            # Apply tier relevance boost (1.3 for relevant content, 0.7 otherwise)
            tier_boost = 1.3 if chunk["tier_tag"] in tier_relevant else 0.7
            combined_score = rrf_score * tier_boost
            
            scored_results.append({
                "chunk": chunk,
                "score": combined_score,
                "dense_rank": dense_ranks.get(idx, 999),
                "sparse_rank": sparse_ranks.get(idx, 999),
                "sparse_score": float(bm25_scores[idx]),
            })

        # Sort candidate chunks by RRF combined score descending
        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:max_chunks]


retriever = KnowledgeRetriever()
