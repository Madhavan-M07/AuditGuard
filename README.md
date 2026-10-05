# AuditGuard 🛡️
> Autonomous Enterprise Compliance & Contract Risk Agent

AuditGuard is an enterprise-grade agentic AI system designed to audit complex vendor agreements, contracts, and SOC 2 reports against internal compliance policies.

## 🚀 Key Architectural Features
- **Deterministic Multi-Agent System**: Built on LangGraph state machines for clause extraction, policy verification, and redlining.
- **Hybrid Retrieval Engine**: Combines BM25 keyword search with PostgreSQL `pgvector` dense embeddings and cross-encoder re-ranking.
- **Source Traceability**: Every identified risk has verifiable paragraph, line, and page citations.
- **Automated Evals in CI/CD**: Evaluated using Ragas for Faithfulness and Context Precision.
- **Observability**: Traced end-to-end with Arize Phoenix / OpenTelemetry.

## 🛠️ Tech Stack
- **AI/LLM**: Gemini 2.0 Flash / Ollama (Llama 3.2)
- **Agent Orchestrator**: LangGraph
- **Backend API**: Python 3.11, FastAPI, Pydantic v2
- **Vector DB**: PostgreSQL + pgvector
- **Cache**: Redis
- **Frontend**: Next.js (App Router), Tailwind CSS


//

eb236883-b9ed63fe
be718ba6-34a3ed72
8e75a9c9-8de5772c
be5fc97c-482af651
71f4565f-9ffdde4d
2124f603-ef0ab029