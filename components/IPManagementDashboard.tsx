import React, { useState } from 'react';
import { conductIPAnalysis } from '../services/geminiService';
import { IPAnalysisReport } from '../types';
import { Shield, Search, FileText, Scale, AlertTriangle, CheckCircle, ExternalLink, Calendar, BookOpen, PenTool, RefreshCw } from 'lucide-react';

const IPManagementDashboard: React.FC = () => {
  const [moleculeName, setMoleculeName] = useState('NX-552');
  const [smiles, setSmiles] = useState('CC(C)C1=CC=C(C=C1)C(C)C(=O)O');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IPAnalysisReport | null>(null);

  const handleAnalyze = async () => {
    if (!moleculeName || !smiles) return;
    setLoading(true);
    setReport(null);
    try {
      const result = await conductIPAnalysis(moleculeName, smiles);
      setReport(result);
    } catch (e) {
      console.error(e);
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const getFTOColor = (level: string) => {
      switch(level) {
          case 'HIGH': return 'text-emerald-400 bg-emerald-900/30 border-emerald-800';
          case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/30 border-yellow-800';
          case 'LOW': return 'text-orange-400 bg-orange-900/30 border-orange-800';
          case 'BLOCKED': return 'text-red-400 bg-red-900/30 border-red-800';
          default: return 'text-slate-400 bg-slate-900';
      }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Scale className="text-purple-400" />
            IP Management & Prior Art
          </h2>
          <p className="text-slate-400 text-sm">
            Advisory system for novelty assessment, FTO analysis, and automated claim drafting.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Input & Key Metrics */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Candidate Input</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Candidate Name</label>
                        <input 
                           type="text" 
                           value={moleculeName}
                           onChange={(e) => setMoleculeName(e.target.value)}
                           className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Structure (SMILES)</label>
                        <textarea 
                           value={smiles}
                           onChange={(e) => setSmiles(e.target.value)}
                           className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 h-24 resize-none"
                        />
                    </div>
                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || !moleculeName}
                        className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                            loading
                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                        }`}
                    >
                        {loading ? <RefreshCw size={16} className="animate-spin"/> : <Search size={16} />}
                        Run FTO Search
                    </button>
                </div>
            </div>

            {report && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex-1 flex flex-col animate-in fade-in slide-in-from-left-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Novelty Assessment</h3>
                    
                    <div className="mb-6 text-center">
                       <div className="text-xs text-slate-500 mb-1">Novelty Score</div>
                       <div className={`text-4xl font-mono font-bold ${
                           report.noveltyScore > 80 ? 'text-emerald-400' : 
                           report.noveltyScore > 50 ? 'text-yellow-400' : 'text-red-400'
                       }`}>
                           {report.noveltyScore}/100
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                           <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Freedom to Operate</div>
                           <div className={`text-sm font-bold px-2 py-1 rounded w-fit border ${getFTOColor(report.freedomToOperate)}`}>
                               {report.freedomToOperate}
                           </div>
                       </div>
                       
                       <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                           <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Closest Prior Art</div>
                           <div className="text-xs text-white truncate">{report.keyPatents[0]?.number || "None Found"}</div>
                           <div className="text-[10px] text-slate-400 truncate">{report.keyPatents[0]?.assignee}</div>
                       </div>
                    </div>

                    <div className="mt-auto pt-4 text-[10px] text-slate-500 text-center italic border-t border-slate-700">
                        This report is generated by AI and does not constitute legal advice. Consult a patent attorney.
                    </div>
                </div>
            )}
        </div>

        {/* Center: Prior Art & Analysis */}
        {report ? (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-in fade-in">
                
                {/* Top Row: Risk & Patents */}
                <div className="flex-1 flex gap-6 min-h-0">
                    {/* Risk Analysis */}
                    <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-6 overflow-y-auto">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-purple-400"/> Legal Risk Analysis
                        </h3>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                            <p className="whitespace-pre-wrap leading-relaxed">{report.riskAnalysis}</p>
                        </div>
                    </div>

                    {/* Patent List */}
                    <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <BookOpen size={20} className="text-blue-400"/> Relevant Prior Art
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {report.keyPatents.map((patent) => (
                                <div key={patent.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-blue-400 font-bold">{patent.number}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                patent.status === 'GRANTED' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}>{patent.status}</span>
                                        </div>
                                        <div className="text-xs text-slate-500">{patent.filingDate}</div>
                                    </div>
                                    <h4 className="font-bold text-slate-200 text-sm mb-1">{patent.title}</h4>
                                    <div className="text-xs text-slate-400 mb-3">{patent.assignee}</div>
                                    
                                    <div className="bg-slate-950/50 p-2 rounded border border-slate-800 text-xs text-slate-300 italic">
                                        "{patent.similarityAnalysis}"
                                    </div>
                                    
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{width: `${patent.relevanceScore}%`}}></div>
                                        </div>
                                        <span className="text-[10px] font-mono text-purple-400">{patent.relevanceScore}% Relevance</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Claims */}
                <div className="h-64 bg-slate-800 border border-slate-700 rounded-xl p-6 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <PenTool size={20} className="text-emerald-400"/> Generated Claims Draft
                        </h3>
                        <button className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                            <FileText size={14}/> Export Doc
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-slate-900 rounded-lg border border-slate-700 p-4 font-serif text-slate-300 leading-relaxed text-sm">
                        <ol className="list-decimal list-inside space-y-4">
                            {report.generatedClaims.map((claim, idx) => (
                                <li key={idx} className="pl-2">
                                    {claim}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-slate-800/20 border border-slate-800/50 rounded-xl m-1 border-dashed">
                <Scale size={64} className="mb-4 opacity-20"/>
                <p>Enter a molecule to begin IP analysis</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default IPManagementDashboard;
