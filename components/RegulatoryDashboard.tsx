import React, { useState } from 'react';
import { generateRegulatorySection } from '../services/geminiService';
import { RegulatoryDocument, SubmissionPackage, ElectronicSignature } from '../types';
import { Scale, FileBadge, PenTool, Lock, CheckCircle, Clock, FileText, Globe, AlertTriangle, ChevronRight, Upload, Download, RefreshCw, Shield, Key } from 'lucide-react';

const MOCK_DOCS: RegulatoryDocument[] = [
  {
    id: 'doc-001',
    title: 'Study Protocol: NX-552 GLP Tox',
    type: 'PROTOCOL',
    version: '1.0',
    status: 'PENDING_SIGNATURE',
    author: 'Dr. Sarah Chen',
    createdDate: '2023-11-20',
    contentSummary: '28-day repeated dose toxicity study in rats to assess safety profile of NX-552.',
    signatures: []
  },
  {
    id: 'doc-002',
    title: 'Non-Clinical Overview (Module 2.4)',
    type: 'SUBMISSION',
    version: '0.9',
    status: 'DRAFT',
    author: 'Regulatory AI Agent',
    createdDate: '2023-11-21',
    contentSummary: 'Integrated summary of pharmacodynamics, pharmacokinetics, and toxicology.',
    signatures: []
  },
  {
    id: 'doc-003',
    title: 'SOP-LAB-005: Instrument Calibration',
    type: 'SOP',
    version: '3.2',
    status: 'EFFECTIVE',
    author: 'QA Dept',
    createdDate: '2023-10-15',
    contentSummary: 'Standard operating procedure for daily calibration of liquid handlers.',
    signatures: [
        { id: 'sig-1', signerName: 'QA Manager', role: 'Approver', reason: 'APPROVAL', timestamp: '2023-10-16 09:00', status: 'VALID' }
    ]
  }
];

const MOCK_SUBMISSIONS: SubmissionPackage[] = [
    {
        id: 'sub-001',
        region: 'FDA',
        type: 'IND',
        title: 'IND Application for NX-552',
        readinessScore: 65,
        documents: [MOCK_DOCS[0], MOCK_DOCS[1]],
        targetDate: '2024-01-15',
        status: 'ASSEMBLING'
    }
];

const RegulatoryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ESIG' | 'SUBMISSIONS' | 'SOPS'>('ESIG');
  const [documents, setDocuments] = useState<RegulatoryDocument[]>(MOCK_DOCS);
  const [submissions, setSubmissions] = useState<SubmissionPackage[]>(MOCK_SUBMISSIONS);
  
  // Signing Flow State
  const [signingDoc, setSigningDoc] = useState<RegulatoryDocument | null>(null);
  const [signReason, setSignReason] = useState<'AUTHORSHIP' | 'APPROVAL' | 'REVIEW'>('APPROVAL');
  const [password, setPassword] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  // Drafting State
  const [draftingDoc, setDraftingDoc] = useState<RegulatoryDocument | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  const handleSignClick = (doc: RegulatoryDocument) => {
      setSigningDoc(doc);
      setPassword('');
      setSignReason('APPROVAL');
  };

  const executeSignature = () => {
      if (!signingDoc || !password) return;
      setIsSigning(true);
      
      // Simulate re-authentication delay
      setTimeout(() => {
          const newSig: ElectronicSignature = {
              id: Math.random().toString(36).substr(2, 9),
              signerName: 'Dr. Current User', // In real app, from auth context
              role: 'Study Director',
              reason: signReason,
              timestamp: new Date().toISOString(),
              status: 'VALID'
          };

          const updatedDoc = {
              ...signingDoc,
              status: 'SIGNED' as const,
              signatures: [...signingDoc.signatures, newSig]
          };

          setDocuments(prev => prev.map(d => d.id === signingDoc.id ? updatedDoc : d));
          setSigningDoc(null);
          setIsSigning(false);
      }, 1500);
  };

  const handleGenerateDraft = async (doc: RegulatoryDocument) => {
      setDraftingDoc(doc);
      setIsDrafting(true);
      try {
          const text = await generateRegulatorySection(doc.title, doc.contentSummary);
          // In a real app, we'd save this text to the doc content. 
          // Here we just alert it or update summary for demo.
          alert(`Generated Draft Content:\n\n${text.substring(0, 200)}...`);
      } catch (e) {
          console.error(e);
      } finally {
          setIsDrafting(false);
          setDraftingDoc(null);
      }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Scale className="text-emerald-400" />
            Regulatory Affairs & Compliance
          </h2>
          <p className="text-slate-400 text-sm">
            21 CFR Part 11 compliant workspace for eSignatures, GLP documentation, and submission assembly.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 mx-2">
          <button onClick={() => setActiveTab('ESIG')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'ESIG' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-white'}`}>
              eSignatures & Approvals
          </button>
          <button onClick={() => setActiveTab('SUBMISSIONS')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'SUBMISSIONS' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-white'}`}>
              Submission Packages
          </button>
          <button onClick={() => setActiveTab('SOPS')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'SOPS' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-white'}`}>
              SOP Library
          </button>
      </div>

      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl mx-2 overflow-hidden flex flex-col relative">
          
          {/* TAB: eSignatures */}
          {activeTab === 'ESIG' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <PenTool size={20} className="text-emerald-400"/> Pending Signatures
                      </h3>
                      <div className="text-xs text-slate-400 bg-slate-900/50 px-3 py-1 rounded border border-slate-800">
                          User: Dr. Current User (Study Director)
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3">
                      {documents.filter(d => d.status === 'PENDING_SIGNATURE').length === 0 && (
                          <div className="text-center text-slate-500 mt-10">
                              <CheckCircle size={48} className="mx-auto mb-4 opacity-20"/>
                              <p>All documents signed.</p>
                          </div>
                      )}
                      
                      {documents.filter(d => d.status === 'PENDING_SIGNATURE').map(doc => (
                          <div key={doc.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{doc.type}</span>
                                      <h4 className="font-bold text-white text-sm">{doc.title}</h4>
                                      <span className="text-xs text-slate-500">v{doc.version}</span>
                                  </div>
                                  <p className="text-xs text-slate-400">{doc.contentSummary}</p>
                                  <div className="text-[10px] text-slate-500 mt-2">Created: {doc.createdDate} by {doc.author}</div>
                              </div>
                              <button 
                                  onClick={() => handleSignClick(doc)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
                              >
                                  <PenTool size={14}/> Sign Document
                              </button>
                          </div>
                      ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-700">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recently Signed</h3>
                      <div className="space-y-2">
                          {documents.filter(d => d.status === 'SIGNED' || d.status === 'EFFECTIVE').map(doc => (
                              <div key={doc.id} className="flex justify-between items-center p-3 rounded bg-slate-900/30 border border-slate-800">
                                  <div className="flex items-center gap-3">
                                      <FileBadge size={16} className="text-slate-500"/>
                                      <span className="text-sm text-slate-300">{doc.title}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs">
                                      <span className="text-emerald-400 font-mono flex items-center gap-1"><Lock size={10}/> Signed</span>
                                      <span className="text-slate-500">{doc.signatures[doc.signatures.length-1]?.timestamp.split('T')[0]}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: Submissions */}
          {activeTab === 'SUBMISSIONS' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {submissions.map(sub => (
                          <div key={sub.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-bold bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-800">{sub.region}</span>
                                          <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{sub.type}</span>
                                      </div>
                                      <h3 className="font-bold text-white text-lg leading-tight">{sub.title}</h3>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-2xl font-bold text-white">{sub.readinessScore}%</div>
                                      <div className="text-[10px] text-slate-500 uppercase">Readiness</div>
                                  </div>
                              </div>

                              <div className="flex-1 space-y-3 mb-6">
                                  {sub.documents.map(doc => (
                                      <div key={doc.id} className="flex justify-between items-center text-sm p-2 bg-slate-950/50 rounded border border-slate-800">
                                          <div className="flex items-center gap-2 truncate">
                                              {doc.status === 'SIGNED' ? <CheckCircle size={14} className="text-emerald-500"/> : <Clock size={14} className="text-yellow-500"/>}
                                              <span className="text-slate-300 truncate">{doc.title}</span>
                                          </div>
                                          <button 
                                              onClick={() => handleGenerateDraft(doc)}
                                              disabled={doc.status === 'SIGNED' || isDrafting}
                                              className="text-xs text-indigo-400 hover:text-indigo-300"
                                          >
                                              {isDrafting && draftingDoc?.id === doc.id ? 'Drafting...' : 'AI Draft'}
                                          </button>
                                      </div>
                                  ))}
                              </div>

                              <div className="mt-auto">
                                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{width: `${sub.readinessScore}%`}}></div>
                                  </div>
                                  <div className="flex justify-between text-xs text-slate-500">
                                      <span>Target: {sub.targetDate}</span>
                                      <span className="flex items-center gap-1"><Globe size={12}/> eCTD v4.0</span>
                                  </div>
                                  <button className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                      <Upload size={14}/> Export eCTD Package
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB: SOPs */}
          {activeTab === 'SOPS' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                              <tr>
                                  <th className="p-4">SOP ID</th>
                                  <th className="p-4">Title</th>
                                  <th className="p-4">Version</th>
                                  <th className="p-4">Status</th>
                                  <th className="p-4">Effective Date</th>
                                  <th className="p-4 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                              {documents.filter(d => d.type === 'SOP').map(doc => (
                                  <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                                      <td className="p-4 font-mono text-slate-500 text-xs">{doc.id}</td>
                                      <td className="p-4 font-bold text-white">{doc.title}</td>
                                      <td className="p-4 text-slate-400">v{doc.version}</td>
                                      <td className="p-4">
                                          <span className="px-2 py-1 bg-emerald-900/20 text-emerald-400 border border-emerald-800 rounded text-xs font-bold uppercase">
                                              {doc.status}
                                          </span>
                                      </td>
                                      <td className="p-4 text-slate-400">{doc.createdDate}</td>
                                      <td className="p-4 text-right">
                                          <button className="text-slate-400 hover:text-white transition-colors">
                                              <Download size={16}/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* SIGNATURE MODAL */}
          {signingDoc && (
              <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                      <div className="text-center mb-6">
                          <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-800">
                              <Lock size={24} className="text-emerald-400"/>
                          </div>
                          <h3 className="text-xl font-bold text-white">Digital Signature Required</h3>
                          <p className="text-sm text-slate-400 mt-1">21 CFR Part 11 Compliance Check</p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 text-sm text-slate-300">
                          <p className="mb-2"><span className="text-slate-500 uppercase text-xs font-bold block mb-1">Document</span> {signingDoc.title} (v{signingDoc.version})</p>
                          <p className="mb-2"><span className="text-slate-500 uppercase text-xs font-bold block mb-1">Signer</span> Dr. Current User</p>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Meaning of Signature</label>
                              <select 
                                  value={signReason} 
                                  onChange={(e) => setSignReason(e.target.value as any)}
                                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-emerald-500 outline-none"
                              >
                                  <option value="APPROVAL">I approve this document</option>
                                  <option value="REVIEW">I have reviewed this document</option>
                                  <option value="AUTHORSHIP">I am the author of this document</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Re-enter Password</label>
                              <div className="relative">
                                  <Key size={14} className="absolute left-3 top-3 text-slate-500"/>
                                  <input 
                                      type="password" 
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                      className="w-full bg-slate-800 border border-slate-600 rounded p-2 pl-9 text-white focus:border-emerald-500 outline-none"
                                      placeholder="••••••••"
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-3 mt-8">
                          <button 
                              onClick={() => setSigningDoc(null)}
                              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-sm transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={executeSignature}
                              disabled={isSigning || !password}
                              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                  isSigning 
                                  ? 'bg-emerald-800 text-emerald-200 cursor-wait' 
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                              }`}
                          >
                              {isSigning ? <RefreshCw size={16} className="animate-spin"/> : <PenTool size={16}/>}
                              Sign Electronically
                          </button>
                      </div>
                      
                      <div className="mt-4 text-[10px] text-slate-500 text-center">
                          By signing, you agree that this electronic signature is the legally binding equivalent of a traditional handwritten signature.
                      </div>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default RegulatoryDashboard;
