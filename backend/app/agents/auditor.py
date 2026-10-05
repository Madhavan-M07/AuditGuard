import json
from typing import List, Dict, Any, TypedDict
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings
from app.rag.retriever import search_clauses
from app.schemas.audit import AuditReport, ClauseFinding, ComplianceStatus, RiskLevel

# 1. Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GEMINI_API_KEY.strip(),
    temperature=0.1,
    max_retries=3
)

# 2. Define the Agent's Shared State
class AgentState(TypedDict):
    document_id: str
    policies: List[str]
    findings: List[Dict[str, Any]]
    final_report: Dict[str, Any]

# 3. Node 1: Evidence Retrieval & LLM Audit
async def audit_clauses_node(state: AgentState) -> Dict[str, Any]:
    findings = []
    
    for policy in state["policies"]:
        # Retrieve top matching clauses from pgvector
        evidence = await search_clauses(query=policy, document_id=state["document_id"], top_k=2)
        context = "\n---\n".join([f"Page {e['page_number']}: {e['content']}" for e in evidence])
        
        prompt = f"""
You are an expert Enterprise Compliance Auditor. Audit this contract against the following policy:

POLICY TO CHECK:
"{policy}"

RETRIEVED CONTRACT EVIDENCE:
{context if context else "No matching clause found in document."}

Respond in STRICT JSON format with these exact keys:
{{
  "policy_rule": "{policy}",
  "status": "COMPLIANT" | "VIOLATION" | "WARNING" | "NOT_FOUND",
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "page_number": <integer page number of cited evidence or null>,
  "cited_clause": "<exact quotation from contract or 'None'>",
  "analysis": "<detailed rationale of compliance or violation>",
  "recommended_redline": "<suggested lawyer revision to fix the risk or null>"
}}
Only output the JSON object.
"""
        response = await llm.ainvoke([
            SystemMessage(content="You are a strict legal auditor. Output valid JSON only."),
            HumanMessage(content=prompt)
        ])
        
        # Clean response and parse JSON
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        try:
            finding_data = json.loads(clean_text)
            findings.append(finding_data)
        except Exception:
            findings.append({
                "policy_rule": policy,
                "status": "WARNING",
                "risk_level": "MEDIUM",
                "page_number": None,
                "cited_clause": "Parse error",
                "analysis": clean_text,
                "recommended_redline": None
            })
            
    return {"findings": findings}

# 4. Node 2: Risk Scoring & Report Synthesis
async def synthesize_report_node(state: AgentState) -> Dict[str, Any]:
    findings = state["findings"]
    
    # Calculate deterministic risk score
    score = 0
    for f in findings:
        if f["risk_level"] == "CRITICAL":
            score += 35
        elif f["risk_level"] == "HIGH":
            score += 25
        elif f["risk_level"] == "MEDIUM":
            score += 10
    score = min(score, 100)
    
    summary = f"Audit complete. Evaluated {len(findings)} policies. Overall Risk Score: {score}/100."
    
    report = {
        "document_id": state["document_id"],
        "overall_risk_score": score,
        "summary": summary,
        "findings": findings
    }
    return {"final_report": report}

# 5. Build LangGraph Workflow
workflow = StateGraph(AgentState)
workflow.add_node("audit_clauses", audit_clauses_node)
workflow.add_node("synthesize_report", synthesize_report_node)

workflow.set_entry_point("audit_clauses")
workflow.add_edge("audit_clauses", "synthesize_report")
workflow.add_edge("synthesize_report", END)

audit_agent = workflow.compile()

if __name__ == "__main__":
    import asyncio
    
    async def run_test_audit():
        print("🤖 Running LangGraph Audit Agent...")
        sample_policies = [
            "Candidate must have demonstrated experience in AI or Machine Learning.",
            "Candidate must have proficiency with Python and backend frameworks."
        ]
        # Uses the document we uploaded earlier
        state_input = {
            "document_id": "", # Will auto-select latest document
            "policies": sample_policies,
            "findings": [],
            "final_report": {}
        }
        result = await audit_agent.ainvoke(state_input)
        print("\n📊 --- FINAL AUDIT REPORT ---")
        print(json.dumps(result["final_report"], indent=2))

    asyncio.run(run_test_audit())
