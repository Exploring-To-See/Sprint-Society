"""Build the FAISS index from the knowledge corpus. Run once after setting up."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from knowledge.embeddings import build_index

if __name__ == "__main__":
    build_index()
