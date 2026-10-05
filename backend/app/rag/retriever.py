import uuid
from typing import List, Dict, Any
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import Document, DocumentClause
from app.rag.embeddings import get_embedding

async def search_clauses(query: str, document_id: str = None, top_k: int = 3) -> List[Dict[str, Any]]:
    """Performs pgvector cosine similarity search to find matching contract clauses."""
    query_vector = get_embedding(query)
    
    async with AsyncSessionLocal() as session:
        # If no document_id provided, search across the latest document
        if not document_id:
            latest_doc = (await session.execute(select(Document).order_by(Document.created_at.desc()).limit(1))).scalar_one_or_none()
            if not latest_doc:
                return []
            doc_uuid = latest_doc.id
        else:
            doc_uuid = uuid.UUID(document_id)

        # pgvector cosine distance: smaller distance = higher semantic similarity
        stmt = (
            select(
                DocumentClause,
                DocumentClause.embedding.cosine_distance(query_vector).label("distance")
            )
            .filter(DocumentClause.document_id == doc_uuid)
            .order_by("distance")
            .limit(top_k)
        )
        
        result = await session.execute(stmt)
        rows = result.all()
        
        matches = []
        for clause, distance in rows:
            similarity = 1.0 - float(distance) # Convert distance to 0.0 - 1.0 score
            matches.append({
                "page_number": clause.page_number,
                "similarity_score": round(similarity, 3),
                "content": clause.content
            })
            
        return matches

if __name__ == "__main__":
    import asyncio
    
    async def test_retriever():
        query = "experience with software development or AI"
        print(f"🔍 Searching for: '{query}'...")
        results = await search_clauses(query=query, top_k=2)
        for idx, r in enumerate(results, 1):
            print(f"\n--- Match #{idx} (Page {r['page_number']}, Score: {r['similarity_score']}) ---")
            print(r['content'][:200] + "...")

    asyncio.run(test_retriever())
