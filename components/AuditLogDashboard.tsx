import React, { useState, useEffect } from 'react';
import { generateComplianceReport } from '../services/geminiService';
import { AuditLogEntry, AuditActionType } from '../types';
import { FileText, Shield, AlertTriangle, CheckCircle, Search, Filter, Lock, Unlock, Hash, Eye, RefreshCw, FileCheck, Terminal, User } from 'lucide-react';

// Mock initial ledger data
const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: '0x8f2a...1b4d',
    blockId: 1042,
    previousHash: '0x3c9e...5f2a',
    timestamp: '2023-11-20 09:15:22',
    actor: { id: 'u1', name: 'System', role: 'Orchestrator' },
    action: AuditActionType.SYSTEM_ALERT,
    entityId: 'sys-boot',
    entityType: 'SYSTEM',
    summary: 'Daily integrity check passed.',
    detailsJSON: '{"check": "SHA-256", "status": "OK", "nodes": 14}',
    signature: 'sig_rsa_4096_...ae32',
    integrityStatus: 'VALID'
  },
  {
    id: '0x1b4d...9a2c',
    blockId: 1043,
    previousHash: '0x8f2a...1b4d',
    timestamp: '2023-11-20 10:05:00',
    actor: { id: 'u2', name: 'Dr. Sarah Chen', role: 'Scientist' },
    action: AuditActionType.DECISION_APPROVED,
    entityId: 'cand-NX552',
    entityType: 'MOLECULE',
    summary: 'Approved candidate NX-552 for synthesis.',
    detailsJSON: '{"candidateId": "NX-552", "rationale": "High potency confirmed", "toxicity": 0.12}',
    signature: 'sig_rsa_4096_...ff91',
    integrityStatus: 'VALID'
  },
  {
    id: '0x9a2c...4d1f',
    blockId: 1044,
    previousHash: '0x1b4d...9a2c',
    timestamp: '2023-11-20 11:30:45',
    actor: { id: 'u3', name: 'AutoLab Node-1', role: 'Robot' },
    action: AuditActionType.AGENT_RUN_COMPLETED,
    entityId: 'run-8821',
    entityType: 'PROTOCOL',
    summary: 'Completed liquid handling protocol.',
    detailsJSON: '{"protocol": "PCR_Setup", "duration": 450, "errors": 0}',
    signature: 'sig_ecdsa_...77b2',
    integrityStatus: 'VALID'
  },
  {
    id: '0x4d1f...e2a9',
    blockId: 1045,
    previousHash: '0x9a2c...4d1f',
    timestamp: '2023-11-20 13:15:10',
    actor: { id: 'u4', name: 'Dr. Marcus Webb', role: 'Admin' },
    action: AuditActionType.HUMAN_OVERRIDE,
    entityId: 'mod-GNN-v2',
    entityType: 'MODEL',
    summary: 'Overridden safety warning on model deployment.',
    detailsJSON: '{"model": "GNN-v2", "warning": "High uncertainty in OOD regions", "overrideReason": "Urgent patch required"}',
    signature: 'sig_rsa_4096_...00a1',
    integrityStatus: 'VALID'
  },
];

const AuditLogDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [filterText, setFilterText] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'SECURE' | 'COMPROMISED'>('SECURE');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [complianceReport, setComplianceReport] = useState<{status: string, summary: string, anomalies: string[]} | null>(null);

  const filteredLogs = logs.filter(log => 
    log.summary.toLowerCase().includes(filterText.toLowerCase()) ||
    log.actor.name.toLowerCase().includes(filterText.toLowerCase()) ||
    log.action.toLowerCase().includes(filterText.toLowerCase()) ||
    log.id.toLowerCase().includes(filterText.toLowerCase())
  );

  const verifyLedger = () => {
    setVerifying(true);
    // Simulate cryptographic verification delay
    setTimeout(() => {
        setVerifying(false);
        setVerificationResult('SECURE');
    }, 1500);
  };

  const handleGenerateReport = async () => {
      setGeneratingReport(true);
      try {
          const report = await generateComplianceReport(logs);
          setComplianceReport(report);
      } catch (e) {
          console.error(e);
      } finally {
          setGeneratingReport(false);
      }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <FileCheck className="text-emerald-400" />
            Immutable Provenance Ledger
          </h2>
          <p className="text-slate-400 text-sm">
            Cryptographically verifiable audit trail of all system decisions and actions.
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={verifyLedger}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
            >
                {verifying ? <RefreshCw size={14} className="animate-spin"/> : <Shield size={14} className={verificationResult === 'SECURE' ? 'text-emerald-400' : 'text-red-400'}/>}
                Verify Integrity
            </button>
            <button 
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
                {generatingReport ? <RefreshCw size={14} className="animate-spin"/> : <FileText size={14}/>}
                Audit Report
            </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Ledger Feed */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search hash, actor, or action..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <div className={`w-2 h-2 rounded-full ${verificationResult === 'SECURE' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                    CHAIN STATUS: {verifying ? 'VERIFYING...' : verificationResult}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredLogs.map((log, index) => (
                    <div 
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                            selectedLog?.id === log.id 
                            ? 'bg-emerald-900/10 border-emerald-500/50' 
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                                <div className="text-[10px] font-mono text-slate-500 mb-1">Block #{log.blockId}</div>
                                <div className={`w-8 h-8 rounded bg-slate-800 border flex items-center justify-center ${selectedLog?.id === log.id ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400'}`}>
                                    <Hash size={14}/>
                                </div>
                                {index < filteredLogs.length - 1 && <div className="h-4 w-px bg-slate-800 my-1"></div>}
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                        log.action === AuditActionType.HUMAN_OVERRIDE ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                                        log.action === AuditActionType.DECISION_APPROVED ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50' :
                                        'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-slate-500">{log.timestamp}</span>
                                </div>
                                <div className="text-sm font-medium text-slate-200">{log.summary}</div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <User size={10}/> {log.actor.name}
                                    <span className="text-slate-700">|</span>
                                    <span className="font-mono text-[10px]">ID: {log.id}</span>
                                </div>
                            </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-2 bg-slate-800 rounded text-slate-400 hover:text-white">
                                <Eye size={14}/>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right: Details & Verification */}
        <div className="w-96 flex flex-col gap-6">
            
            {/* Selection Details */}
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                    <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                        <Terminal size={14} className="text-emerald-400"/> Block Details
                    </h3>
                </div>
                
                {selectedLog ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Cryptographic Proof</label>
                            <div className="bg-slate-950 rounded p-3 font-mono text-[10px] text-slate-300 border border-slate-800 space-y-2 break-all">
                                <div>
                                    <span className="text-emerald-500">HASH:</span> {selectedLog.id}
                                </div>
                                <div>
                                    <span className="text-slate-500">PREV:</span> {selectedLog.previousHash}
                                </div>
                                <div>
                                    <span className="text-indigo-400">SIGN:</span> {selectedLog.signature}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Payload Content</label>
                            <div className="bg-slate-950 rounded p-3 font-mono text-xs text-emerald-100/80 border border-slate-800 overflow-x-auto">
                                <pre>{JSON.stringify(JSON.parse(selectedLog.detailsJSON), null, 2)}</pre>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Actor Metadata</label>
                            <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded border border-slate-800">
                                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                                    <User size={16}/>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-200">{selectedLog.actor.name}</div>
                                    <div className="text-[10px] text-slate-500">{selectedLog.actor.role} • {selectedLog.actor.id}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-700 flex justify-center">
                            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/10 px-3 py-1.5 rounded border border-emerald-900/30">
                                <Lock size={12}/> Block Sealed & Timestamped
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 flex-col">
                        <Hash size={48} className="mb-2 opacity-20"/>
                        <p className="text-xs">Select a block to inspect payload</p>
                    </div>
                )}
            </div>

            {/* Compliance Report */}
            {complianceReport && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                        <span>AI Compliance Analysis</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${
                            complianceReport.status === 'COMPLIANT' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                            complianceReport.status === 'WARNING' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' :
                            'bg-red-900/30 text-red-400 border-red-800'
                        }`}>{complianceReport.status}</span>
                    </h3>
                    
                    <p className="text-xs text-slate-300 mb-4 italic leading-relaxed">
                        "{complianceReport.summary}"
                    </p>

                    {complianceReport.anomalies.length > 0 && (
                        <div className="mb-4">
                            <div className="text-[10px] text-red-400 font-bold mb-1 flex items-center gap-1">
                                <AlertTriangle size={10}/> Detected Anomalies
                            </div>
                            <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-1">
                                {complianceReport.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                        </div>
                    )}
                    
                    <button onClick={() => setComplianceReport(null)} className="w-full text-xs text-slate-500 hover:text-white transition-colors">
                        Dismiss Report
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default AuditLogDashboard;
