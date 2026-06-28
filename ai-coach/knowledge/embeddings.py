import os
import json
import numpy as np
from config import CORPUS_PATH, INDEX_PATH


def _meta_for(rel_path: str):
    """Derive (tier_tag, file_key) from a corpus-relative path.

    Recurses subfolders so the whole corpus is indexed:
      pace.md                          -> tier_tag 'pace'
      personas/scientist/daniels.md    -> tier_tag 'coach_scientist'  (boosts for that persona)
      coaching/persona_nutrition.md    -> tier_tag 'coaching'
    file_key is a collision-free id base (slashes -> underscores).
    """
    rel = rel_path.replace(os.sep, "/")
    parts = rel.split("/")
    if parts[0] == "personas" and len(parts) >= 3:
        tier_tag = f"coach_{parts[1]}"
    elif len(parts) >= 2:
        tier_tag = parts[0]
    else:
        tier_tag = parts[0][:-3] if parts[0].endswith(".md") else parts[0]
    file_key = rel[:-3].replace("/", "_").replace(" ", "_") if rel.endswith(".md") else rel
    return tier_tag, file_key


def load_and_chunk_corpus() -> list[dict]:
    """Load ALL corpus .md files (recursively, including subfolders) and chunk by
    ## headers, splitting large sections with overlap. Every file is represented."""
    chunks = []
    md_files = []
    for root, _dirs, files in os.walk(CORPUS_PATH):
        for filename in files:
            if filename.endswith(".md"):
                md_files.append(os.path.join(root, filename))
    md_files.sort()

    for filepath in md_files:
        rel = os.path.relpath(filepath, CORPUS_PATH)
        tier_tag, file_key = _meta_for(rel)
        source = rel.replace(os.sep, "/")

        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        sections = content.split("\n## ")
        for i, section in enumerate(sections):
            if i == 0:
                lines = section.strip().split("\n")
                title = lines[0].replace("# ", "").strip()
                body = "\n".join(lines[1:]).strip()
            else:
                lines = section.strip().split("\n")
                title = lines[0].strip()
                body = "\n".join(lines[1:]).strip()

            if len(body) < 50:
                continue

            # Split large sections into subsections
            subsections = body.split("\n### ")
            if len(subsections) > 1:
                for j, sub in enumerate(subsections):
                    if j == 0 and len(sub.strip()) < 50:
                        continue
                    sub_lines = sub.strip().split("\n")
                    sub_title = sub_lines[0].strip() if j > 0 else title
                    sub_body = "\n".join(sub_lines[1:]).strip() if j > 0 else sub.strip()
                    
                    if len(sub_body) < 30:
                        continue

                    # If the sub_body is very large, chunk it with overlap
                    _add_chunks(chunks, sub_body, f"{title} > {sub_title}", tier_tag, source, f"{file_key}_{i}_{j}")
            else:
                _add_chunks(chunks, body, title, tier_tag, source, f"{file_key}_{i}")

    return chunks


def _add_chunks(chunks_list: list, text: str, title: str, tier_tag: str, filename: str, base_id: str, chunk_size: int = 800, overlap: int = 150):
    """Splits text into overlapping chunks if it exceeds chunk_size, otherwise adds it directly."""
    if len(text) <= chunk_size:
        chunks_list.append({
            "id": base_id,
            "title": title,
            "content": text,
            "tier_tag": tier_tag,
            "source": filename,
        })
        return

    # Sliding window chunking
    start = 0
    sub_idx = 0
    while start < len(text):
        end = start + chunk_size
        chunk_text = text[start:end].strip()
        
        if len(chunk_text) >= 50:
            chunks_list.append({
                "id": f"{base_id}_c{sub_idx}",
                "title": f"{title} (Part {sub_idx + 1})" if sub_idx > 0 else title,
                "content": chunk_text,
                "tier_tag": tier_tag,
                "source": filename,
            })
            sub_idx += 1
            
        start += (chunk_size - overlap)


def build_index():
    """Build FAISS index from corpus chunks."""
    try:
        from sentence_transformers import SentenceTransformer
        import faiss
    except ImportError:
        print("Please install: pip install sentence-transformers faiss-cpu")
        return

    print("Loading corpus...")
    chunks = load_and_chunk_corpus()
    print(f"Found {len(chunks)} chunks")

    print("Loading embedding model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    texts = [f"{c['title']}\n{c['content']}" for c in chunks]
    print("Encoding chunks...")
    embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(np.array(embeddings).astype("float32"))

    os.makedirs(INDEX_PATH, exist_ok=True)
    faiss.write_index(index, os.path.join(INDEX_PATH, "coach.index"))

    with open(os.path.join(INDEX_PATH, "chunks.json"), "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2)

    print(f"Index built: {len(chunks)} chunks, dimension={dimension}")
    print(f"Saved to: {INDEX_PATH}")


if __name__ == "__main__":
    build_index()
