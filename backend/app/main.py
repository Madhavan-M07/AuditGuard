from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.api.documents import router as documents_router
from app.api.audit import router as audit_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.include_router(documents_router)
app.include_router(audit_router)



# CORS: Allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Production health check: verifies both API and Database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "project": settings.PROJECT_NAME,
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database_error": str(e)
        }
