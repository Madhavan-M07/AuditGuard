"use client";

import React, { useState, useRef } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Upload,
  Play,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Layers,
  Cpu,
  Search,
  AlertTriangle,
  Filter,
  FileCheck,
  Sparkles
} from "lucide-react";

interface Finding {
  policy_rule: string;
  status: "COMPLIANT" | "VIOLATION" | "WARNING" | "NOT_FOUND";
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  page_number: number | null;
  cited_clause: string;
  analysis: string;
  recommended_redline: string | null;
}

interface AuditReport {
  document_id: string;
  overall_risk_score: number;
  summary: string;
  findings: Finding[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const POLICY_PRESETS = {
  enterprise:
    "All customer data and secondary backup snapshots must be encrypted at rest.\n" +
    "Vendor must notify customer of any security breach within 72 hours.\n" +
    "Vendor cumulative liability cap must be at least $1,000,000 USD.",
  gdpr:
    "Vendor must delete or return all customer personal data within 30 days of contract termination.\n" +
    "Subprocessors cannot be engaged without prior 30-day written customer consent.\n" +
    "Vendor must conduct annual independent SOC 2 Type II audits.",
  sla:
    "Service level availability guarantee must be at least 99.9% uptime excluding scheduled maintenance.\n" +
    "Downtime exceeding 4 hours per calendar month entitles customer to service credits.\n" +
    "Data sovereignty: All customer data must reside strictly within US or EU geographic regions.",
};

const SAMPLE_BENCHMARK_REPORT: AuditReport = {
  document_id: "doc_sample_benchmark_001",
  overall_risk_score: 85,
  summary:
    "Critical enterprise risk detected across 3 core compliance policies: unencrypted secondary backup snapshots, delayed 45-day incident notification, and a catastrophic $100 total liability cap.",
  findings: [
    {
      policy_rule: "Vendor cumulative liability cap must be at least $1,000,000 USD.",
      status: "VIOLATION",
      risk_level: "CRITICAL",
      page_number: 2,
      cited_clause:
        "IN NO EVENT SHALL EITHER PARTY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED ONE HUNDRED DOLLARS ($100.00).",
      analysis:
        "The vendor's liability is capped at a nominal $100.00, exposing the customer to unmitigated financial risk in the event of a catastrophic data loss or breach. Enterprise policy mandates a minimum $1,000,000 liability ceiling.",
      recommended_redline:
        "IN NO EVENT SHALL EITHER PARTY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED ONE MILLION DOLLARS ($1,000,000.00) OR THE TOTAL FEES PAID IN THE PRIOR 12 MONTHS, WHICHEVER IS GREATER.",
    },
    {
      policy_rule: "Vendor must notify customer of any security breach within 72 hours.",
      status: "VIOLATION",
      risk_level: "HIGH",
      page_number: 1,
      cited_clause:
        "Vendor will make commercially reasonable efforts to notify Customer within forty-five (45) business days following confirmation of any confirmed security incident.",
      analysis:
        "A 45-business-day notification window severely breaches the required 72-hour enterprise standard, violating GDPR Article 33 and SOC 2 incident reporting mandates.",
      recommended_redline:
        "Vendor shall notify Customer in writing within seventy-two (72) hours of becoming aware of or reasonably suspecting any security breach affecting Customer data.",
    },
    {
      policy_rule: "All customer data and secondary backup snapshots must be encrypted at rest.",
      status: "VIOLATION",
      risk_level: "HIGH",
      page_number: 1,
      cited_clause:
        "Primary production databases are encrypted using standard algorithms. Secondary offsite backup snapshots and archived logs are stored in raw unencrypted storage tiers for operational recovery efficiency.",
      analysis:
        "Leaving secondary backups and archive logs unencrypted represents a severe vulnerability and breaches enterprise SOC 2 and ISO 27001 data protection controls.",
      recommended_redline:
        "Vendor shall ensure all Customer data, including primary production databases, secondary offsite backup snapshots, and archived logs, is encrypted at rest using industry-standard AES-256 encryption.",
    },
  ],
};

export default function AuditDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [policies, setPolicies] = useState<string>(POLICY_PRESETS.enterprise);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(true);

  const resultsRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleUpload = async (customFile?: File) => {
    const targetFile = customFile || file;
    if (!targetFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", targetFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setDocumentId(data.document_id);
      } else {
        alert(data.detail || "Failed to upload document");
      }
    } catch {
      alert("Network error connecting to backend API. Please verify the backend service is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSampleContract = async () => {
    try {
      setIsUploading(true);
      const res = await fetch("/sample_vendor_contract.pdf");
      const blob = await res.blob();
      const sampleFile = new File([blob], "sample_vendor_contract.pdf", {
        type: "application/pdf",
      });
      setFile(sampleFile);
      await handleUpload(sampleFile);
      setIsPreviewMode(false);
      workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      alert("Error loading sample contract file.");
      setIsUploading(false);
    }
  };

  const handleRunAudit = async () => {
    if (!documentId) {
      alert("Please upload a contract PDF or click 'Load Benchmark Contract' first.");
      return;
    }

    setIsAuditing(true);
    const policyList = policies.split("\n").filter((p) => p.trim().length > 0);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/audit/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, policies: policyList }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data);
        setIsPreviewMode(false);
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        alert(data.detail || "Audit execution failed");
      }
    } catch {
      alert("Network error calling audit agent API. Please check your backend connection.");
    } finally {
      setIsAuditing(false);
    }
  };

  const copyRedline = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAllRedlines = (findingsToCopy: Finding[]) => {
    const allText = findingsToCopy
      .filter((f) => !!f.recommended_redline)
      .map((f, i) => `// [Redline ${i + 1}] Rule: ${f.policy_rule} (Page ${f.page_number || "N/A"})\n${f.recommended_redline}`)
      .join("\n\n");
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportJSON = (currentReport: AuditReport) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentReport, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit_report_${currentReport.document_id.slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const activeReport = report || (isPreviewMode ? SAMPLE_BENCHMARK_REPORT : null);

  const displayedFindings = activeReport
    ? activeReport.findings.filter((f) => {
        if (filterStatus === "ALL") return true;
        if (filterStatus === "VIOLATION") return f.status === "VIOLATION";
        if (filterStatus === "COMPLIANT") return f.status === "COMPLIANT";
        return true;
      })
    : [];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Enterprise Institutional Header */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-900 border border-slate-700/80 rounded-lg shadow-inner">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white uppercase">AuditGuard</span>
                <span className="text-[10px] font-mono tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                  v1.2 · Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous Contract Compliance &amp; Redline Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="#concept"
              className="text-slate-400 hover:text-slate-200 transition font-medium hidden md:inline-block"
            >
              Architecture &amp; Methodology
            </a>
            <a
              href="#workspace"
              className="text-slate-400 hover:text-slate-200 transition font-medium hidden md:inline-block"
            >
              Audit Workbench
            </a>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px] text-slate-300">pgvector + LangGraph Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Concept & Methodology Section */}
      <section id="concept" className="max-w-7xl mx-auto px-6 pt-10 pb-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-3">
            <span>Enterprise Compliance Operations</span>
            <span>·</span>
            <span>Deterministic RAG</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            Autonomous Contract Auditing &amp; Clause Verification
          </h1>

          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Enterprise legal, procurement, and security teams spend hundreds of hours manually verifying vendor
            Master Services Agreements (MSAs) against internal security standards. AuditGuard ingests agreements,
            performs deterministic vector search with <strong className="text-slate-200">pgvector</strong> to isolate governing clauses,
            and deploys <strong className="text-slate-200">LangGraph multi-model reasoning</strong> to score contractual risk and draft enforceable redlines.
          </p>
        </div>

        {/* 3 Technical Methodology Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase">Phase 01</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Page-Aware Vector Indexing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              PDFs are segmented into semantic paragraphs while preserving exact physical page metadata. Chunks are embedded with FastEmbed (384-d) and stored in Neon PostgreSQL with pgvector.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase">Phase 02</span>
              <Search className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Deterministic Clause Retrieval</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              For each compliance requirement, pgvector performs cosine distance searches (<code className="text-cyan-300 font-mono text-[11px]">&lt;=&gt;</code>) to isolate relevant contractual language with zero hallucination.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase">Phase 03</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Multi-Model Agent Reasoning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              LangGraph cascades through Gemini 3.5 &amp; Gemma models to evaluate compliance status, assess risk severity (0–100), and generate contract redlines ready for negotiations.
            </p>
          </div>
        </div>

        {/* Benchmark Contract Quick-Action Strip */}
        <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950/60 border border-indigo-500/20 rounded-lg text-indigo-400 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Pre-Loaded Benchmark Agreement Available</div>
              <div className="text-[11px] text-slate-400">
                Test with our deliberate 3-flaw enterprise test suite (unencrypted backups, 45-day notice, $100 liability cap).
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <a
              href="/sample_vendor_contract.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
            <button
              onClick={handleLoadSampleContract}
              disabled={isUploading || isAuditing}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isUploading ? "Indexing..." : "Load & Index Sample"}
            </button>
          </div>
        </div>
      </section>

      {/* Main Workbench Layout */}
      <section ref={workspaceRef} id="workspace" className="max-w-7xl mx-auto px-6 pb-20 pt-4">
        <div className="flex items-center justify-between mb-5 border-t border-slate-800 pt-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Audit Workbench</h2>
            <p className="text-xs text-slate-400">Configure target agreement and evaluate compliance rules</p>
          </div>
          {documentId && (
            <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded">
              <span className="text-slate-400">Active Document:</span>
              <span className="text-indigo-400 font-semibold">{documentId.slice(0, 16)}...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Fixed / Sticky Controls */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* Step 1: Document Ingestion Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  1. Target Contract
                </span>
                {documentId && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                    INDEXED
                  </span>
                )}
              </div>

              <div className="border border-dashed border-slate-700 hover:border-slate-500 transition rounded-lg p-4 text-center bg-slate-950/50">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                    setDocumentId("");
                    setIsPreviewMode(false);
                  }}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                  <FileText className="w-7 h-7 text-slate-400 mb-1.5" />
                  <span className="text-xs font-medium text-slate-200">
                    {file ? file.name : "Select or drop contract PDF"}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Supports multi-page contracts up to 50MB</span>
                </label>
              </div>

              <button
                onClick={() => handleUpload()}
                disabled={!file || isUploading || !!documentId}
                className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 text-xs"
              >
                {isUploading
                  ? "Parsing & Generating Vector Chunks..."
                  : documentId
                  ? "✓ Ingested in pgvector"
                  : "Ingest Contract to Database"}
              </button>
            </div>

            {/* Step 2: Policy Configuration Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  2. Compliance Policy Rules
                </span>
              </div>

              {/* Policy Preset Selectors */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Framework Presets:</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPolicies(POLICY_PRESETS.enterprise)}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 transition border border-slate-700 text-center truncate font-medium"
                  >
                    Enterprise SLA
                  </button>
                  <button
                    onClick={() => setPolicies(POLICY_PRESETS.gdpr)}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 transition border border-slate-700 text-center truncate font-medium"
                  >
                    GDPR / Privacy
                  </button>
                  <button
                    onClick={() => setPolicies(POLICY_PRESETS.sla)}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 transition border border-slate-700 text-center truncate font-medium"
                  >
                    Cloud &amp; SLA
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase mb-1.5">
                  Rules to Audit (One rule per line):
                </div>
                <textarea
                  rows={4}
                  value={policies}
                  onChange={(e) => setPolicies(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>

              <button
                onClick={handleRunAudit}
                disabled={isAuditing || !documentId}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-950"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                {isAuditing ? "LangGraph Agent Evaluating..." : "Run Compliance Audit"}
              </button>

              {!documentId && (
                <p className="text-[11px] text-amber-400/90 text-center flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Ingest a PDF or click &quot;Load &amp; Index Sample&quot; to execute.</span>
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Independent Scrollable Results Panel */}
          <div ref={resultsRef} className="lg:col-span-7">
            {activeReport ? (
              <div className="space-y-4">
                {/* Executive Risk Dossier Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Executive Risk Assessment
                        </span>
                        {isPreviewMode && (
                          <span className="text-[10px] font-mono bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded">
                            Benchmark Preview
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{activeReport.summary}</p>
                    </div>

                    <div
                      className={`px-4 py-3 rounded-xl border text-center shrink-0 ${
                        activeReport.overall_risk_score > 50
                          ? "bg-rose-950/30 border-rose-500/30 text-rose-400"
                          : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      <div className="text-3xl font-black font-mono leading-none">{activeReport.overall_risk_score}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mt-1">
                        {activeReport.overall_risk_score > 50 ? "High Risk" : "Acceptable"}
                      </div>
                    </div>
                  </div>

                  {/* Filter and Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      <button
                        onClick={() => setFilterStatus("ALL")}
                        className={`px-2.5 py-1 text-[11px] rounded font-medium transition ${
                          filterStatus === "ALL"
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        All ({activeReport.findings.length})
                      </button>
                      <button
                        onClick={() => setFilterStatus("VIOLATION")}
                        className={`px-2.5 py-1 text-[11px] rounded font-medium transition ${
                          filterStatus === "VIOLATION"
                            ? "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Violations (
                        {activeReport.findings.filter((f) => f.status === "VIOLATION").length})
                      </button>
                      <button
                        onClick={() => setFilterStatus("COMPLIANT")}
                        className={`px-2.5 py-1 text-[11px] rounded font-medium transition ${
                          filterStatus === "COMPLIANT"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Compliant (
                        {activeReport.findings.filter((f) => f.status === "COMPLIANT").length})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyAllRedlines(activeReport.findings)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded font-medium transition flex items-center gap-1 border border-slate-700"
                      >
                        {copiedAll ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedAll ? "Copied All" : "Copy All Redlines"}
                      </button>
                      <button
                        onClick={() => handleExportJSON(activeReport)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded font-medium transition flex items-center gap-1 border border-slate-700"
                      >
                        <Download className="w-3 h-3" />
                        Export JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Findings Feed */}
                <div className="max-h-[680px] overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {displayedFindings.map((f, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                            f.status === "VIOLATION"
                              ? "bg-rose-950/40 text-rose-400 border-rose-800/40"
                              : f.status === "WARNING"
                              ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                              : "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                          }`}
                        >
                          {f.risk_level} {f.status}
                        </span>
                        {f.page_number && (
                          <span className="text-[11px] font-mono bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                            Page Citation: p. {f.page_number}
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-slate-100 text-xs">
                        {f.policy_rule}
                      </div>

                      {/* Contractual Clause Snippet */}
                      <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg text-xs text-slate-400 font-serif italic leading-relaxed">
                        &quot;{f.cited_clause}&quot;
                      </div>

                      {/* Legal Reasoning */}
                      <p className="text-xs text-slate-300 leading-relaxed">{f.analysis}</p>

                      {/* Proposed Redline */}
                      {f.recommended_redline && (
                        <div className="bg-amber-950/20 border border-amber-500/20 p-3.5 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
                            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                              Recommended Contract Redline:
                            </span>
                            <button
                              onClick={() => copyRedline(f.recommended_redline!, idx)}
                              className="flex items-center gap-1 hover:text-white transition text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                            >
                              {copiedIdx === idx ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              {copiedIdx === idx ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <p className="text-xs font-mono text-amber-200/90 leading-relaxed bg-black/40 p-2.5 rounded border border-amber-900/30">
                            {f.recommended_redline}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Clean Empty State */
              <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl h-[450px] flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-3">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <ShieldCheck className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-300 text-sm">Audit Dossier Ready</div>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Select a contract PDF on the left or click &quot;Load &amp; Index Sample&quot; to review the full clause-by-clause compliance breakdown.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-center text-[11px] font-mono text-slate-500">
        AuditGuard · Built with Next.js 15, FastAPI, LangGraph, PostgreSQL + pgvector, and FastEmbed.
      </footer>
    </div>
  );
}
