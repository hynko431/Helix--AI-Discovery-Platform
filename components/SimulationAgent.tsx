import React, { useState } from 'react';
import { runCounterfactualSimulation } from '../services/geminiService';
import { SimulationVariable, SimulationOutcome } from '../types';
import { Split, ArrowRight, Activity, Thermometer, Dna, FlaskConical, PlayCircle, AlertTriangle, ShieldCheck, TrendingDown, TrendingUp, Minus, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ErrorBar } from 'recharts';

const DEFAULT_VARIABLES: SimulationVariable[] = [
  { id: 'v1', category: 'ENVIRONMENT', name: 'pH Level', baseline: '7.4 (Physiological)', counterfactual: '5.5 (Tumor Microenvironment)' },
  { id: 'v2', category: 'GENETIC', name: 'Target Mutation', baseline: 'Wild Type', counterfactual: 'G12D Resistant Mutant' },
  { id: 'v3', category: 'MOLECULAR', name: 'Metabolic Stability', baseline: 'Normal CYP450 Activity', counterfactual: 'High CYP3A4 Induction' },
  { id: 'v4', category: 'ENVIRONMENT', name: 'Oxygenation', baseline: 'Normoxia', counterfactual: 'Hypoxia (HIF-1a High)' }
];

const SimulationAgent: React.FC = () => {
  const [molecule, setMolecule] = useState('AMG-510');
  const [target, setTarget] = useState('KRAS G12C');
  const [selectedVariables, setSelectedVariables] = useState<Set<string>>(new Set(['v1', 'v2']));
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationOutcome[]>([]);

  const toggleVariable = (id: string) => {
    const newSet = new Set(selectedVariables);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedVariables(newSet);
  };

  const handleRunSimulation = async () => {
    if (!molecule || !target || selectedVariables.size === 0) return;
    setIsSimulating(true);
    setResults([]);

    const variablesToRun = DEFAULT_VARIABLES.filter(v => selectedVariables.has(v.id));
    const newResults: SimulationOutcome[] = [];

    // Run sequentially for better UI feedback (could be parallel)
    for (const variable of variablesToRun) {
      try {
        const result = await runCounterfactualSimulation(molecule, target, variable);
        newResults.push(result);
        setResults([...newResults]); // Incremental update
      } catch (e) {
        console.error(e);
      }
    }
    setIsSimulating(false);
  };

  // Prepare chart data
  const chartData = results.map(r => ({
    name: r.variableName,
    Baseline: r.baselineScore,
    Counterfactual: r.counterfactualScore,
    // For error bars calculation in recharts
    baselineError: [r.baselineScore - 5, r.baselineScore + 5], // Mock error range for baseline
    counterfactualError: r.confidenceInterval
  }));

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      <div className="mb-6 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Split className="text-orange-400" />
            Counterfactual Simulation Agent
          </h2>
          <p className="text-slate-400 text-sm">
            Run "What-If" scenarios to test candidate sensitivity to environmental and genetic perturbations.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel: Configuration */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto pr-2">
          
          {/* Base Configuration */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FlaskConical size={16} className="text-cyan-400" /> Base Entity
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Candidate Molecule</label>
                <input 
                  type="text" 
                  value={molecule}
                  onChange={(e) => setMolecule(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Biological Target</label>
                <input 
                  type="text" 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Variables Selection */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex-1">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={16} className="text-orange-400" /> Perturbations
            </h3>
            <p className="text-xs text-slate-500 mb-4">Select variables to simulate counterfactuals.</p>
            
            <div className="space-y-3">
              {DEFAULT_VARIABLES.map(v => (
                <div 
                  key={v.id}
                  onClick={() => toggleVariable(v.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedVariables.has(v.id) 
                    ? 'bg-slate-700 border-orange-500/50 shadow-md' 
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-200 text-sm">{v.name}</span>
                    {selectedVariables.has(v.id) && <CheckCircle size={14} className="text-orange-500" />}
                  </div>
                  <div className="text-[10px] text-slate-400 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 mt-2">
                    <span className="text-slate-500">Base:</span>
                    <span className="font-mono">{v.baseline}</span>
                    <span className="text-orange-400/80 font-bold">If:</span>
                    <span className="text-orange-100/80 font-mono">{v.counterfactual}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating || !molecule || !target || selectedVariables.size === 0}
              className={`w-full mt-6 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                isSimulating 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              }`}
            >
              {isSimulating ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Simulating...
                 </>
              ) : (
                 <>
                   <PlayCircle size={18} /> Run Analysis
                 </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* Chart Area */}
          <div className="h-80 bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col">
            <h3 className="text-slate-200 font-semibold mb-4 text-sm">Sensitivity Analysis: Efficacy Impact</h3>
            {results.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={true} />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} label={{ value: 'Predicted Efficacy Score', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#334155', opacity: 0.2}}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Baseline" fill="#94a3b8" barSize={12} radius={[0, 4, 4, 0]} name="Baseline Condition" />
                  <Bar dataKey="Counterfactual" fill="#f97316" barSize={12} radius={[0, 4, 4, 0]} name="Counterfactual Condition">
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-600 border border-dashed border-slate-700 rounded-lg">
                <p>Run a simulation to view sensitivity data</p>
              </div>
            )}
          </div>

          {/* Impact Cards */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {results.map((outcome, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-200 flex items-center gap-2">
                       {outcome.variableName} Impact
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                       outcome.riskLevel === 'HIGH' ? 'bg-red-900/30 text-red-400 border-red-800' :
                       outcome.riskLevel === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' :
                       'bg-emerald-900/30 text-emerald-400 border-emerald-800'
                    }`}>
                       {outcome.riskLevel} Risk
                    </span>
                 </div>

                 <div className="flex gap-4 mb-4">
                    <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-center min-w-[80px]">
                       <div className="text-[10px] text-slate-500 uppercase font-bold">Delta</div>
                       <div className={`text-xl font-mono font-bold flex items-center justify-center ${outcome.delta < 0 ? 'text-red-400' : outcome.delta > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {outcome.delta > 0 ? <TrendingUp size={16} className="mr-1"/> : outcome.delta < 0 ? <TrendingDown size={16} className="mr-1"/> : <Minus size={16} className="mr-1"/>}
                          {Math.abs(outcome.delta).toFixed(1)}
                       </div>
                    </div>
                    <div className="flex-1">
                       <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-orange-500/50 pl-3 italic">
                          "{outcome.impactAnalysis}"
                       </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck size={14} className="text-slate-600"/>
                    <span>Confidence Interval: [{outcome.confidenceInterval[0]}, {outcome.confidenceInterval[1]}]</span>
                 </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SimulationAgent;