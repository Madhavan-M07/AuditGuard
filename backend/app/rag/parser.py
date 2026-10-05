import io
import uuid
from typing import List
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Document, DocumentClause
from app.rag.embeddings import get_embeddings_batch
from app.db.session import AsyncSessionLocal

async def ingest_pdf_content(filename: str, pdf_bytes: bytes) -> str:
    """Parses PDF pages, embeds clauses, and saves to PostgreSQL."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    
    async with AsyncSessionLocal() as session:
        # 1. Create Document record
        doc = Document(filename=filename, file_type="pdf", status="processing")
        session.add(doc)
        await session.flush() # Generates doc.id

        clauses_to_insert = []
        raw_chunks = []
        metadata_list = []

        # 2. Extract text page-by-page (preserves page citations)
        for page_idx, page in enumerate(reader.pages):
            page_num = page_idx + 1
            text = page.extract_text() or ""
            
            # Split page into meaningful paragraphs/clauses
            paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
            
            for para in paragraphs:
                raw_chunks.append(para)
                metadata_list.append(page_num)

        if not raw_chunks:
            doc.status = "empty"
            await session.commit()
            return str(doc.id)

        # 3. Batch generate 384-d embeddings
# 3. Batch generate 384-d embeddings in memory-safe chunks (keeps RAM < 150MB)
        embeddings = []
        BATCH_SIZE = 10
        for i in range(0, len(raw_chunks), BATCH_SIZE):
            batch = raw_chunks[i : i + BATCH_SIZE]
            embeddings.extend(get_embeddings_batch(batch))

        # 4. Create DocumentClause records
        for text, page_num, emb in zip(raw_chunks, metadata_list, embeddings):
            clause = DocumentClause(
                document_id=doc.id,
                page_number=page_num,
                content=text,
                embedding=emb
            )
            clauses_to_insert.append(clause)

        session.add_all(clauses_to_insert)
        doc.status = "indexed"
        await session.commit()
        
        return str(doc.id)

if __name__ == "__main__":
    import asyncio
    print("✅ Parser module ready for PDF ingestion.")
