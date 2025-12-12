import React, { useState } from 'react';
import { runRobustnessAnalysis } from '../services/geminiService';
import { RobustnessReport } from '../types';
import { Shield, Activity, Dna, AlertOctagon, RefreshCw, Box, Move3d, Layers } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const RobustnessAnalysis: React.FC = () => {
  const [molecule, setMolecule] = useState('Osimertinib');
  const [target, setTarget] = useState('EGFR');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<RobustnessReport | null>(null);

  const handleRunAnalysis = async () => {
    if (!molecule || !target) return;
    setLoading(true);
    setReport(null);
    try {
      const result = await runRobustnessAnalysis(molecule, target);
      setReport(result);
    } catch (error) {
      console.error(error);
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const wtData = report?.ensemble.filter(m => m.type === 'WT') || [];
  const mutantData = report?.ensemble.filter(m => m.type === 'MUTANT') || [];

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Shield className="text-pink-400" />
            Structure Ensemble & Robustness
          </h2>
          <p className="text-slate-400 text-sm">
            Stress-test candidates against conformational ensembles and resistance mutations using AlphaFold-Multimer proxies.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Control Panel */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
           <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Configuration</h3>
              <div className="space-y-4">
                  <div>
                      <label className="text-xs text-slate-400 block mb-1">Drug Candidate</label>
                      <input 
                         type="text" 
                         value={molecule}
                         onChange={(e) => setMolecule(e.target.value)}
                         className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                      />
                  </div>
                  <div>
                      <label className="text-xs text-slate-400 block mb-1">Target Protein</label>
                      <input 
                         type="text" 
                         value={target}
                         onChange={(e) => setTarget(e.target.value)}
                         className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                      />
                  </div>
                  <button 
                      onClick={handleRunAnalysis}
                      disabled={loading || !molecule || !target}
                      className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                          loading
                          ? 'bg-slate-700 text-slate-400 cursor-wait'
                          : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                      }`}
                  >
                      {loading ? (
                         <>
                           <RefreshCw size={16} className="animate-spin"/> Generating Ensemble...
                         </>
                      ) : (
                         <>
                           <Move3d size={16} /> Run Analysis
                         </>
                      )}
                  </button>
              </div>
           </div>

           {report && (
               <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex-1 flex flex-col animate-in fade-in slide-in-from-left-4">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Resilience Metrics</h3>
                   
                   <div className="mb-6 text-center">
                       <div className="text-xs text-slate-500 mb-1">Robustness Score</div>
                       <div className={`text-4xl font-mono font-bold ${
                           report.overallRobustness > 80 ? 'text-emerald-400' : 
                           report.overallRobustness > 50 ? 'text-yellow-400' : 'text-red-400'
                       }`}>
                           {report.overallRobustness}/100
                       </div>
                   </div>

                   <div className="space-y-4">
                       <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                           <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                               <Activity size={12}/> Binding Variance
                           </div>
                           <div className="text-white font-mono">{report.bindingVariance.toFixed(2)} kcal/mol²</div>
                           <div className="text-[10px] text-slate-500 mt-1">Lower is better</div>
                       </div>
                       
                       {report.criticalMutations.length > 0 ? (
                           <div className="p-3 bg-red-900/20 rounded-lg border border-red-900/50">
                               <div className="text-[10px] text-red-400 uppercase font-bold mb-2 flex items-center gap-1">
                                   <AlertOctagon size={12}/> Critical Vulnerabilities
                               </div>
                               <div className="flex flex-wrap gap-1">
                                   {report.criticalMutations.map(m => (
                                       <span key={m} className="px-2 py-0.5 bg-red-900/40 text-red-300 rounded text-xs font-mono border border-red-800">
                                           {m}
                                       </span>
                                   ))}
                               </div>
                           </div>
                       ) : (
                           <div className="p-3 bg-emerald-900/20 rounded-lg border border-emerald-900/50 text-center">
                               <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                                   <Shield size={12}/> No Resistance Detected
                               </div>
                           </div>
                       )}
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-slate-700">
                       <p className="text-xs text-slate-400 leading-relaxed italic">
                           "{report.analysis}"
                       </p>
                   </div>
               </div>
           )}
        </div>

        {/* Right Visualization Panel */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            {/* Chart */}
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-200 font-semibold flex items-center gap-2">
                        <Layers size={18} className="text-pink-400"/> Conformational Landscape
                    </h3>
                    {report && <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">Ensemble Size: {report.ensemble.length} Structures</span>}
                </div>

                <div className="flex-1 w-full min-h-0">
                    {report ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis 
                                    type="number" 
                                    dataKey="rmsd" 
                                    name="RMSD" 
                                    stroke="#64748b" 
                                    fontSize={12} 
                                    tickLine={false}
                                    label={{ value: 'Structural Deviation (RMSD Å)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }} 
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="bindingEnergy" 
                                    name="Binding Energy" 
                                    stroke="#64748b" 
                                    fontSize={12} 
                                    tickLine={false}
                                    label={{ value: 'Binding Energy (dG)', angle: -90, position: 'left', fill: '#64748b', fontSize: 12 }} 
                                    reversed={true} // Negative dG is better (higher on chart)
                                />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                                                    <p className="font-bold text-slate-200 mb-1">{data.name}</p>
                                                    <p className="text-slate-400">Mutation: <span className="text-white">{data.mutation}</span></p>
                                                    <p className="text-slate-400">Conformation: <span className="text-white">{data.conformation}</span></p>
                                                    <div className="mt-2 pt-2 border-t border-slate-800">
                                                        <p className="text-emerald-400 font-mono">dG: {data.bindingEnergy} kcal/mol</p>
                                                        <p className="text-blue-400 font-mono">RMSD: {data.rmsd} Å</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}/>
                                <ReferenceLine y={-9} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Weak Binding Cutoff', fill: '#ef4444', fontSize: 10, position: 'insideBottomRight' }} />
                                <Scatter name="Wild Type (WT)" data={wtData} fill="#10b981" shape="circle" />
                                <Scatter name="Resistance Mutants" data={mutantData} fill="#f43f5e" shape="triangle" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
                            <Box size={48} className="mb-4 opacity-50"/>
                            <p className="text-sm">Run analysis to visualize ensemble binding landscape.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Ensemble List */}
            {report && (
                <div className="h-48 bg-slate-800 border border-slate-700 rounded-xl p-5 overflow-hidden flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ensemble Members</h3>
                    <div className="flex-1 overflow-y-auto pr-2">
                        <table className="w-full text-left text-xs">
                            <thead className="text-slate-500 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                                <tr>
                                    <th className="pb-2 font-medium">Variant</th>
                                    <th className="pb-2 font-medium">Conformation</th>
                                    <th className="pb-2 font-medium">Mutation</th>
                                    <th className="pb-2 font-medium">RMSD</th>
                                    <th className="pb-2 font-medium">Binding (dG)</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {report.ensemble.map((member, i) => (
                                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
                                        <td className="py-2 font-medium text-white">{member.name}</td>
                                        <td className="py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                                                member.conformation === 'Active' ? 'bg-emerald-900/30 border-emerald-800 text-emerald-400' :
                                                member.conformation === 'Inactive' ? 'bg-slate-700 border-slate-600 text-slate-400' :
                                                'bg-purple-900/30 border-purple-800 text-purple-400'
                                            }`}>
                                                {member.conformation}
                                            </span>
                                        </td>
                                        <td className="py-2 font-mono">{member.mutation}</td>
                                        <td className="py-2 font-mono">{member.rmsd} Å</td>
                                        <td className={`py-2 font-mono font-bold ${member.bindingEnergy > -9 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {member.bindingEnergy}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RobustnessAnalysis;
