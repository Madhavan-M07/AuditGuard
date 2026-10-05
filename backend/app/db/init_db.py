import asyncio
from sqlalchemy import text
from app.db.session import engine, Base
from app.db.models import Document, DocumentClause

async def init_database():
    """Initializes pgvector extension and creates all tables."""
    print("⏳ Connecting to database and creating tables...")
    async with engine.begin() as conn:
        # Ensure pgvector extension exists
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        # Create all declared tables
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created successfully in PostgreSQL (Neon)!")

if __name__ == "__main__":
    asyncio.run(init_database())
