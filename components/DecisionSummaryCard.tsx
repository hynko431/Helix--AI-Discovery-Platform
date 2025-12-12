import React from 'react';
import { DecisionSummary } from '../types';
import { CheckCircle, AlertTriangle, HelpCircle, FlaskConical, Gauge, Activity, ShieldCheck, AlertOctagon } from 'lucide-react';

interface Props {
  summary: DecisionSummary;
}

const DecisionSummaryCard: React.FC<Props> = ({ summary }) => {
  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-emerald-400 border-emerald-500 bg-emerald-500/10';
      case 'Medium': return 'text-yellow-400 border-yellow-500 bg-yellow-500/10';
      case 'Low': return 'text-red-400 border-red-500 bg-red-500/10';
      default: return 'text-slate-400 border-slate-500';
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-cyan-500"></div>
      
      <div className="mb-6 flex justify-between items-start">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-indigo-400" />
          Explainable Decision Rationale
        </h3>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${getConfidenceColor(summary.modelConfidence.reliability)}`}>
          <Gauge size={14} />
          {summary.modelConfidence.reliability} Confidence ({summary.modelConfidence.score}%)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Evidence & Risks */}
        <div className="space-y-6">
          {/* Primary Evidence */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" /> Supportive Evidence
            </h4>
            <ul className="space-y-2">
              {summary.primaryEvidence.map((ev, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {ev}
                </li>
              ))}
            </ul>
          </div>

          {/* Counter Evidence / Risks */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <AlertOctagon size={14} className="text-red-500" /> Known Risks & Liabilities
            </h4>
            <ul className="space-y-2">
              {summary.counterEvidence.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300 bg-red-900/10 p-2 rounded border border-red-900/30">
                  <AlertTriangle size={14} className="mt-0.5 text-red-400 flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Synthesis & Uncertainty */}
        <div className="space-y-6">
          {/* Synthesis Feasibility */}
          <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <FlaskConical size={14} className="text-amber-500" /> Synthesis Plan
            </h4>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-500">Est. Steps</span>
              <span className="text-sm font-mono font-bold text-white">{summary.synthesisFeasibility.stepCount}</span>
            </div>
            <div className="mb-3">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Key Challenges</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {summary.synthesisFeasibility.keyChallenges.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-900/20 text-amber-400 text-[10px] rounded border border-amber-900/40">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Starting Materials</span>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {summary.synthesisFeasibility.startingMaterials.join(', ')}
              </p>
            </div>
          </div>

          {/* Uncertainty Analysis */}
          <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <HelpCircle size={14} className="text-blue-400" /> Uncertainty & Unknowns
            </h4>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700/50">
              <span className="text-xs text-slate-500">Confidence Interval</span>
              <span className="text-xs font-mono text-blue-300 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/50">
                {summary.uncertaintyAnalysis.confidenceInterval}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Epistemic Gaps</span>
              <ul className="mt-1 space-y-1">
                {summary.uncertaintyAnalysis.keyUnknowns.map((u, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span> {u}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400 italic">
        <span className="font-bold not-italic text-slate-500 mr-2">Model Note:</span>
        {summary.modelConfidence.explanation}
      </div>
    </div>
  );
};

export default DecisionSummaryCard;
