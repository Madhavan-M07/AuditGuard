from fastapi import APIRouter, UploadFile, File, HTTPException
from app.rag.parser import ingest_pdf_content

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Uploads a contract PDF, extracts clauses, and saves vector embeddings to PostgreSQL."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported currently.")
    
    try:
        content = await file.read()
        doc_id = await ingest_pdf_content(filename=file.filename, pdf_bytes=content)
        return {
            "status": "success",
            "document_id": doc_id,
            "filename": file.filename,
            "message": "Contract successfully parsed and indexed in pgvector."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
