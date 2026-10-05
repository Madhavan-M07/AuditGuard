from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class ComplianceStatus(str, Enum):
    COMPLIANT = "COMPLIANT"
    VIOLATION = "VIOLATION"
    WARNING = "WARNING"
    NOT_FOUND = "NOT_FOUND"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ClauseFinding(BaseModel):
    """An individual policy finding with exact page citations and suggested redline."""
    policy_rule: str = Field(description="The compliance or security policy being checked.")
    status: ComplianceStatus
    risk_level: RiskLevel
    page_number: Optional[int] = Field(None, description="Exact page citation from the contract.")
    cited_clause: str = Field(description="The exact snippet of text from the contract.")
    analysis: str = Field(description="Explanation of why this violates or complies with policy.")
    recommended_redline: Optional[str] = Field(None, description="Suggested safer wording to fix the risk.")

class AuditReport(BaseModel):
    """Final enterprise audit report returned to the legal/compliance team."""
    document_id: str
    overall_risk_score: int = Field(..., ge=0, le=100, description="0 (Zero risk) to 100 (Severe risk)")
    summary: str
    findings: List[ClauseFinding]
