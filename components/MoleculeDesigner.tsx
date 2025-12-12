import React, { useState } from 'react';
import { generateMoleculeCandidate } from '../services/geminiService';
import { MoleculeCandidate } from '../types';
import { Atom, Activity, Zap, ShieldAlert, Scale, FlaskConical, Database, FileCheck } from 'lucide-react';
import DecisionSummaryCard from './DecisionSummaryCard';

const MoleculeDesigner: React.FC = () => {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<MoleculeCandidate | null>(null);

  const handleDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setLoading(true);
    try {
      const result = await generateMoleculeCandidate(target);
      setCandidate(result);
    } catch (error) {
      alert("Failed to generate candidate. Please check API key configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto p-1">
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
          <Atom className="text-cyan-400" />
          Generative Molecular Design
        </h2>
        <p className="text-slate-400 mb-6">
          Input a biological target or disease state. The AI will synthesize a novel chemical entity optimized for binding affinity and bioavailability.
        </p>
        
        <form onSubmit={handleDesign} className="flex gap-4">
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. KRAS G12C inhibitor, Alzheimer's Beta-Amyloid aggregation..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
          />
          <button
            type="button" // Prevent enter key if needed, or change to submit
            onClick={handleDesign}
            disabled={loading || !target}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              loading || !target
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Zap size={18} />
                Generate Candidate
              </>
            )}
          </button>
        </form>
      </div>

      {candidate && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{candidate.name}</h3>
                  <p className="text-cyan-400 font-mono text-sm mt-1">Target: {candidate.target}</p>
                </div>
                <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                  NOVEL ENTITY
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-xs text-slate-300 break-all border border-slate-700/50 mb-6">
                <span className="text-slate-500 select-none mr-2">SMILES:</span>
                {candidate.smiles}
              </div>

              <div className="space-y-4">
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <Activity size={16} /> Mechanism of Action
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {candidate.mechanism}
                  </p>
                </div>
                
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-200 mb-2">AI Rationale</h4>
                  <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-cyan-500 pl-3">
                    "{candidate.rationale}"
                  </p>
                </div>
              </div>
            </div>

            {/* Structured Decision Card */}
            {candidate.decisionSummary && (
                <DecisionSummaryCard summary={candidate.decisionSummary} />
            )}
          </div>

          {/* Stats Column */}
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h4 className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-4">Properties</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="text-slate-300 text-sm flex items-center gap-2">
                    <Scale size={16} className="text-indigo-400"/> Mol. Weight
                  </span>
                  <span className="font-mono text-white">{candidate.molecularWeight} Da</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="text-slate-300 text-sm flex items-center gap-2">
                    <FlaskConical size={16} className="text-orange-400"/> LogP
                  </span>
                  <span className="font-mono text-white">{candidate.logP}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                       <ShieldAlert size={12} /> Predicted Toxicity
                    </span>
                    <span className={`font-bold ${candidate.toxicityScore > 0.5 ? 'text-red-400' : 'text-green-400'}`}>
                      {candidate.toxicityScore}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${candidate.toxicityScore > 0.5 ? 'bg-red-500' : 'bg-green-500'}`} 
                      style={{ width: `${candidate.toxicityScore * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Synthesis Difficulty</span>
                    <span className="text-white font-bold">{candidate.synthesisDifficulty}/10</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${candidate.synthesisDifficulty * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Provenance Box */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
               <h4 className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-4 flex items-center gap-2">
                  <Database size={14}/> Data Quality
               </h4>
               <div className="space-y-3">
                  <div className="flex items-start gap-2 text-xs text-slate-300">
                     <FileCheck size={14} className="text-emerald-400 mt-0.5"/>
                     <div>
                        <span className="font-bold text-white">Provenance Chain</span>
                        <div className="text-slate-500">Training Set: ChEMBL v33 (Curated)</div>
                     </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-300">
                     <ShieldAlert size={14} className="text-blue-400 mt-0.5"/>
                     <div>
                        <span className="font-bold text-white">Negative Mining</span>
                        <div className="text-slate-500">Includes 450+ failed assays</div>
                     </div>
                  </div>
               </div>
            </div>

            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20">
              Queue for Synthesis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoleculeDesigner;