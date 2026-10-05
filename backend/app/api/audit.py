from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.auditor import audit_agent

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Agent"])

class AuditRequest(BaseModel):
    document_id: Optional[str] = ""
    policies: List[str]

@router.post("/run")
async def run_audit(request: AuditRequest):
    """Triggers the LangGraph agent to audit a document against policies."""
    if not request.policies:
        raise HTTPException(status_code=400, detail="Must provide at least one compliance policy.")

    state_input = {
        "document_id": request.document_id,
        "policies": request.policies,
        "findings": [],
        "final_report": {}
    }

    try:
        result = await audit_agent.ainvoke(state_input)
        return result["final_report"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent audit failed: {str(e)}")
