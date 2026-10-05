from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# 1. Async Engine with connection pre-ping (handles cloud disconnects gracefully)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True
)

# 2. Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 3. Base class for all ORM models
Base = declarative_base()

# 4. FastAPI Dependency for database injection
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
