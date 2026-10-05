import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.db.session import Base

class Document(Base):
    """Tracks uploaded enterprise contracts and compliance files."""
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # e.g. "pdf", "docx"
    status = Column(String(50), default="uploaded") # uploaded, processing, indexed, error
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentClause(Base):
    """Stores individual contract clauses with exact citations and vector embeddings."""
    __tablename__ = "document_clauses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Traceability & Citation metadata (Critical for enterprise audit)
    page_number = Column(Integer, nullable=False)
    section_header = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)

    # 384-dimensional vector embedding (bge-small-en-v1.5)
    embedding = Column(Vector(384), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
