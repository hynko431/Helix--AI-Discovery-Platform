import React, { useState, useEffect } from 'react';
import { generateScreeningLibrary, runPhysicsRescoring, runGradientOptimization } from '../services/geminiService';
import { ScreeningResult, OptimizationStep } from '../types';
import { Layers, Zap, Activity, Filter, ArrowRight, Microscope, TrendingUp, CheckCircle, Database, Server, RefreshCw, BarChart3, Wind, Coins } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const DifferentiableScoring: React.FC = () => {
  const [target, setTarget] = useState('EGFR T790M');
  const [scaffold, setScaffold] = useState('Quinazoline');
  const [pipelineState, setPipelineState] = useState<'IDLE' | 'SCREENING' | 'RESCORING' | 'OPTIMIZING' | 'COMPLETED'>('IDLE');
  
  const [candidates, setCandidates] = useState<ScreeningResult[]>([]);
  const [optimizationSteps, setOptimizationSteps] = useState<OptimizationStep[]>([]);
  
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 8));

  const startPipeline = async () => {
    setPipelineState('SCREENING');
    setCandidates([]);
    setOptimizationSteps([]);
    addLog(`[ML] Generating screening library for scaffold: ${scaffold}...`);

    try {
      // Stage 1: ML Screening
      const library = await generateScreeningLibrary(scaffold, target);
      setCandidates(library);
      addLog(`[ML] Screened ${library.length} variants. Top pIC50: ${Math.max(...library.map(c => c.mlScore)).toFixed(2)}`);
      
      await new Promise(r => setTimeout(r, 1500)); // Visual delay

      // Stage 2: Physics Rescoring (Simulate selecting top 3)
      setPipelineState('RESCORING');
      const topCandidates = [...library].sort((a, b) => b.mlScore - a.mlScore).slice(0, 3);
      
      const rescoredCandidates = [...library]; // Copy full list to update

      for (const cand of topCandidates) {
        addLog(`[PHYSICS] Running MM/GBSA for ${cand.variantName}...`);
        
        // Update status to running
        const index = rescoredCandidates.findIndex(c => c.id === cand.id);
        if (index !== -1) {
            rescoredCandidates[index] = { ...rescoredCandidates[index], status: 'PHYSICS_QUEUED' };
            setCandidates([...rescoredCandidates]);
        }

        const physicsResult = await runPhysicsRescoring(cand.variantName, target);
        
        // Update with result
        if (index !== -1) {
            rescoredCandidates[index] = { 
                ...rescoredCandidates[index], 
                physicsScore: physicsResult.dG,
                energyComponents: physicsResult.components,
                status: 'PHYSICS_COMPLETED' 
            };
            setCandidates([...rescoredCandidates]);
        }
        await new Promise(r => setTimeout(r, 1000));
      }

      // Stage 3: Gradient Optimization on Best Candidate
      setPipelineState('OPTIMIZING');
      const bestCandidate = rescoredCandidates.filter(c => c.physicsScore).sort((a, b) => (a.physicsScore || 0) - (b.physicsScore || 0))[0];
      
      if (bestCandidate && bestCandidate.physicsScore) {
          addLog(`[GRADIENT] Optimizing lead: ${bestCandidate.variantName} (Start dG: ${bestCandidate.physicsScore})`);
          const trajectory = await runGradientOptimization(bestCandidate.variantName, bestCandidate.physicsScore);
          setOptimizationSteps(trajectory);
          addLog(`[GRADIENT] Optimization complete. Final dG: ${trajectory[trajectory.length-1].score}`);
      }
      
      setPipelineState('COMPLETED');

    } catch (e) {
      console.error(e);
      addLog("[ERROR] Pipeline failed.");
      setPipelineState('IDLE');
    }
  };

  const getStageColor = (active: boolean, completed: boolean) => {
      if (active) return 'text-cyan-400 border-cyan-500 bg-cyan-900/20';
      if (completed) return 'text-emerald-400 border-emerald-500 bg-emerald-900/20';
      return 'text-slate-500 border-slate-700 bg-slate-900';
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Layers className="text-violet-400" />
            End-to-End Differentiable Scoring
          </h2>
          <p className="text-slate-400 text-sm">
            Hybrid cascade combining fast ML inference with rigorous physics-based rescoring and gradient optimization.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Column: Controls & Pipeline Status */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            
            {/* Input Config */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pipeline Configuration</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Target Protein</label>
                        <input 
                           type="text" 
                           value={target}
                           onChange={(e) => setTarget(e.target.value)}
                           className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Scaffold / Ligand</label>
                        <input 
                           type="text" 
                           value={scaffold}
                           onChange={(e) => setScaffold(e.target.value)}
                           className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                        />
                    </div>
                    <button 
                        onClick={startPipeline}
                        disabled={pipelineState !== 'IDLE' && pipelineState !== 'COMPLETED'}
                        className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                            pipelineState === 'IDLE' || pipelineState === 'COMPLETED'
                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {pipelineState === 'IDLE' || pipelineState === 'COMPLETED' ? <><Zap size={16}/> Start Cascade</> : <><RefreshCw size={16} className="animate-spin"/> Processing...</>}
                    </button>
                </div>
            </div>

            {/* Pipeline Visualizer */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex-1 flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Compute Stages</h3>
                <div className="space-y-4 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-700 -z-0"></div>

                    {/* Stage 1 */}
                    <div className={`relative z-10 flex items-center gap-4 p-3 rounded-lg border transition-all ${getStageColor(pipelineState === 'SCREENING', ['RESCORING', 'OPTIMIZING', 'COMPLETED'].includes(pipelineState))}`}>
                        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center bg-slate-900 font-bold text-sm">1</div>
                        <div>
                            <div className="text-sm font-bold">ML Screening</div>
                            <div className="text-[10px] opacity-70">GNN Inference (ms)</div>
                        </div>
                        {['RESCORING', 'OPTIMIZING', 'COMPLETED'].includes(pipelineState) && <CheckCircle size={16} className="ml-auto"/>}
                    </div>

                    {/* Cost Gating Indicator */}
                    <div className="relative z-10 flex items-center justify-center py-1">
                        <div className="bg-slate-900 border border-violet-500/50 text-violet-300 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-violet-900/20">
                            <Filter size={10}/>
                            Rank Gate: Top 5% Only
                            <Coins size={10} className="text-yellow-500 ml-1"/>
                        </div>
                    </div>

                    {/* Stage 2 */}
                    <div className={`relative z-10 flex items-center gap-4 p-3 rounded-lg border transition-all ${getStageColor(pipelineState === 'RESCORING', ['OPTIMIZING', 'COMPLETED'].includes(pipelineState))}`}>
                        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center bg-slate-900 font-bold text-sm">2</div>
                        <div>
                            <div className="text-sm font-bold">Physics Rescoring</div>
                            <div className="text-[10px] opacity-70">MM/GBSA (mins)</div>
                        </div>
                         {['OPTIMIZING', 'COMPLETED'].includes(pipelineState) && <CheckCircle size={16} className="ml-auto"/>}
                    </div>

                    {/* Stage 3 */}
                    <div className={`relative z-10 flex items-center gap-4 p-3 rounded-lg border transition-all ${getStageColor(pipelineState === 'OPTIMIZING', pipelineState === 'COMPLETED')}`}>
                        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center bg-slate-900 font-bold text-sm">3</div>
                        <div>
                            <div className="text-sm font-bold">Gradient Opt.</div>
                            <div className="text-[10px] opacity-70">Local Design (iters)</div>
                        </div>
                        {pipelineState === 'COMPLETED' && <CheckCircle size={16} className="ml-auto"/>}
                    </div>
                </div>

                {/* Logs */}
                <div className="mt-6 flex-1 bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-slate-400 overflow-hidden border border-slate-800">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 truncate opacity-80 border-l-2 border-slate-700 pl-2">{log}</div>
                    ))}
                    {logs.length === 0 && <span className="opacity-30">System Ready...</span>}
                </div>
            </div>
        </div>

        {/* Center: Results Funnel & Charts */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            
            {/* Top Row: Candidates Table/Funnel */}
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-5 overflow-hidden flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Filter size={16} className="text-violet-400"/> Candidate Funnel
                    </h3>
                    <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> ML Score</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Physics dG</div>
                    </div>
                 </div>

                 {candidates.length > 0 ? (
                    <div className="overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-slate-500 border-b border-slate-700">
                                    <th className="p-2 font-medium">Variant</th>
                                    <th className="p-2 font-medium">Structure (SMILES)</th>
                                    <th className="p-2 font-medium">ML Score (pIC50)</th>
                                    <th className="p-2 font-medium">Physics dG</th>
                                    <th className="p-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {candidates.map(c => (
                                    <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                        <td className="p-2 font-medium text-white">{c.variantName}</td>
                                        <td className="p-2 font-mono text-xs text-slate-400 truncate max-w-[150px]">{c.smiles}</td>
                                        <td className="p-2 text-blue-400 font-mono">{c.mlScore.toFixed(2)}</td>
                                        <td className="p-2">
                                            {c.physicsScore ? (
                                                <span className="text-emerald-400 font-mono font-bold">{c.physicsScore.toFixed(2)}</span>
                                            ) : <span className="text-slate-600">-</span>}
                                        </td>
                                        <td className="p-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                                c.status === 'PHYSICS_COMPLETED' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                                                c.status === 'PHYSICS_QUEUED' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' :
                                                'bg-slate-700 text-slate-400 border-slate-600'
                                            }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-2">
                        <Database size={32} opacity={0.5}/>
                        <p className="text-sm">Pipeline idle. Start cascade to generate data.</p>
                    </div>
                 )}
            </div>

            {/* Bottom Row: Optimization Charts */}
            <div className="h-64 grid grid-cols-2 gap-6">
                 
                 {/* Optimization Trajectory */}
                 <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-violet-400"/> Gradient Optimization Trajectory
                    </h3>
                    {optimizationSteps.length > 0 ? (
                        <div className="flex-1 -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={optimizationSteps}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="step" stroke="#64748b" fontSize={10} tickLine={false} label={{ value: 'Step', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['auto', 'auto']} label={{ value: 'Energy (dG)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }}
                                        formatter={(val: number) => val.toFixed(2)}
                                        labelFormatter={(l) => `Step ${l}`}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 text-xs italic">
                            Awaiting lead candidate selection...
                        </div>
                    )}
                 </div>

                 {/* Energy Breakdown */}
                 <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Microscope size={16} className="text-violet-400"/> Binding Energy Components
                    </h3>
                    {candidates.find(c => c.physicsScore) ? (
                        <div className="flex-1 -ml-4">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={candidates.filter(c => c.physicsScore).slice(0, 3)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                                    <YAxis dataKey="variantName" type="category" stroke="#94a3b8" fontSize={10} width={80} tickLine={false} />
                                    <Tooltip 
                                        cursor={{fill: '#334155', opacity: 0.2}}
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="energyComponents.vdw" fill="#3b82f6" name="Van der Waals" stackId="a" barSize={15} />
                                    <Bar dataKey="energyComponents.electrostatic" fill="#ef4444" name="Electrostatic" stackId="a" barSize={15} />
                                    <Bar dataKey="energyComponents.solvation" fill="#10b981" name="Solvation" stackId="a" barSize={15} />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 text-xs italic">
                            Awaiting physics rescoring...
                        </div>
                    )}
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default DifferentiableScoring;