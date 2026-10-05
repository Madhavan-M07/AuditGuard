from typing import List
from fastembed import TextEmbedding

# Load the CPU-optimized embedding model (cached after first run)
_embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

def get_embedding(text: str) -> List[float]:
    """Generates a 384-dimensional vector embedding for a single text."""
    embeddings = list(_embedding_model.embed([text]))
    return embeddings[0].tolist()

def get_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generates embeddings in batch for high performance."""
    embeddings = list(_embedding_model.embed(texts))
    return [e.tolist() for e in embeddings]
if __name__ == "__main__":
    sample_text = "This contract shall be governed by Delaware law."
    print(f"Generating embedding for: '{sample_text}'")
    vector = get_embedding(sample_text)
    print(f"✅ Success! Vector dimensions: {len(vector)}")
