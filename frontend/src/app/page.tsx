"use client";

import React, { useState } from "react";
import {
  ShieldAlert, ShieldCheck, FileText, Upload, Play, AlertCircle,
  CheckCircle2, ArrowRight, Copy, Check
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

export default function AuditDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [policies, setPolicies] = useState<string>(
    "All customer data and secondary backup snapshots must be encrypted at rest.\n" +
    "Vendor must notify customer of any security breach within 72 hours.\n" +
    "Vendor cumulative liability cap must be at least $1,000,000 USD."
  );

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

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
    } catch (err) {
      alert("Error connecting to backend API at localhost:8000");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunAudit = async () => {
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
      } else {
        alert(data.detail || "Audit execution failed");
      }
    } catch (err) {
      alert("Error calling audit agent API");
    } finally {
      setIsAuditing(false);
    }
  };

  const copyRedline = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AuditGuard 🛡️</h1>
            <p className="text-sm text-slate-400">Autonomous Enterprise Compliance & Contract Risk Agent</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>FastAPI + pgvector Live</span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Policies */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Upload Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-indigo-400" />
              1. Upload Contract PDF
            </h2>
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-colors rounded-xl p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-10 h-10 text-slate-500 mb-2" />
                <span className="text-sm font-medium text-slate-300">
                  {file ? file.name : "Click to select sample_vendor_contract.pdf"}
                </span>
                <span className="text-xs text-slate-500 mt-1">PDF format up to 50MB</span>
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              {isUploading ? "Extracting & Embedding Chunks..." : "Upload to PostgreSQL"}
            </button>

            {documentId && (
              <div className="mt-3 text-xs bg-slate-800/60 text-slate-400 p-2.5 rounded-lg flex items-center justify-between">
                <span>Indexed in pgvector:</span>
                <span className="font-mono text-indigo-400">{documentId.slice(0, 18)}...</span>
              </div>
            )}
          </div>

          {/* 2. Policies Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              2. Compliance Policies (One per line)
            </h2>
            <textarea
              rows={4}
              value={policies}
              onChange={(e) => setPolicies(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-950"
            >
              <Play className="w-4 h-4 fill-white" />
              {isAuditing ? "LangGraph Agent Auditing..." : "Execute AuditGuard Agent"}
            </button>
          </div>
        </div>

        {/* Right Column: Audit Findings & Redlines */}
        <div className="lg:col-span-7 space-y-6">
          {report ? (
            <>
              {/* Executive Risk Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Executive Risk Score</span>
                  <p className="text-sm text-slate-300 mt-1">{report.summary}</p>
                </div>
                <div className={`px-6 py-4 rounded-2xl border text-center ${report.overall_risk_score > 50
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  }`}>
                  <span className="text-3xl font-black">{report.overall_risk_score}</span>
                  <span className="text-xs block font-semibold">/ 100</span>
                </div>
              </div>

              {/* Findings List */}
              <div className="space-y-4">
                {report.findings.map((f, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${f.status === "VIOLATION"
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}>
                        {f.risk_level} {f.status}
                      </span>
                      {f.page_number && (
                        <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md">
                          Citation: Page {f.page_number}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-200 text-sm">{f.policy_rule}</h3>

                    {/* Cited Clause */}
                    <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl text-xs text-slate-400 italic">
                      "{f.cited_clause}"
                    </div>

                    {/* Rationale */}
                    <p className="text-xs text-slate-300 leading-relaxed">{f.analysis}</p>

                    {/* Redline Box */}
                    {f.recommended_redline && (
                      <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
                          <span>⚖️ Recommended Legal Redline:</span>
                          <button
                            onClick={() => copyRedline(f.recommended_redline!, idx)}
                            className="flex items-center gap-1 hover:text-white transition"
                          >
                            {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedIdx === idx ? "Copied" : "Copy Redline"}
                          </button>
                        </div>
                        <p className="text-xs font-mono text-amber-200/90 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-amber-900/30">
                          {f.recommended_redline}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl h-96 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <ShieldCheck className="w-12 h-12 mb-3 text-slate-600" />
              <p className="font-medium text-slate-400">Ready for Audit</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Upload a contract on the left and click "Execute AuditGuard Agent" to see automated risk detection with citations and redlines.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
