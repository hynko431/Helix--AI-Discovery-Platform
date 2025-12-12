import React, { useState, useEffect } from 'react';
import { generateActiveLearningBatch } from '../services/geminiService';
import { ALPoint } from '../types';
import { Target, Compass, Play, Zap, Info, Layers, CheckCircle, Brain, RefreshCw, BarChart2, Plus } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceArea, Cell } from 'recharts';

// Initial Seed Data
const SEED_DATA: ALPoint[] = [
  { id: 'p1', x: 20, y: 30, score: 45, uncertainty: 0.1, status: 'EXPLORED', molecule: 'Mol-A' },
  { id: 'p2', x: 25, y: 35, score: 50, uncertainty: 0.1, status: 'EXPLORED', molecule: 'Mol-B' },
  { id: 'p3', x: 80, y: 80, score: 10, uncertainty: 0.2, status: 'EXPLORED', molecule: 'Mol-C' },
  { id: 'p4', x: 50, y: 50, score: 65, uncertainty: 0.1, status: 'EXPLORED', molecule: 'Mol-D' },
  { id: 'p5', x: 60, y: 20, score: 82, uncertainty: 0.1, status: 'EXPLORED', molecule: 'Mol-E' },
];

const ActiveLearningDashboard: React.FC = () => {
  const [points, setPoints] = useState<ALPoint[]>(SEED_DATA);
  const [strategy, setStrategy] = useState<'UCB' | 'EI' | 'PI'>('UCB');
  const [explorationWeight, setExplorationWeight] = useState(5); // 1-10
  const [loading, setLoading] = useState(false);
  const [lastReasoning, setLastReasoning] = useState<string | null>(null);

  const handleRunOptimization = async () => {
    setLoading(true);
    try {
      // Filter out only explored points to send as "training data"
      const exploredPoints = points.filter(p => p.status === 'EXPLORED');
      
      const result = await generateActiveLearningBatch(exploredPoints, strategy, explorationWeight);
      
      // Update points: Keep old ones, add new ones
      // Also, visualize "Candidate" points turning into "Explored" in a real app, 
      // here we just append the new batch as RECOMMENDED
      
      // Mark previous recommended as Candidate (simulating they are now in queue)
      const updatedPoints = points.map(p => 
          p.status === 'RECOMMENDED' ? { ...p, status: 'CANDIDATE' as const } : p
      );

      setPoints([...updatedPoints, ...result.candidates]);
      setLastReasoning(result.reasoning);
    } catch (error) {
      console.error(error);
      alert("Optimization failed.");
    } finally {
      setLoading(false);
    }
  };

  const getStrategyDescription = () => {
      switch(strategy) {
          case 'UCB': return "Upper Confidence Bound: Optimistic selection in the face of uncertainty. Balances mean prediction + standard deviation.";
          case 'EI': return "Expected Improvement: Calculates the probability that a point will beat the current best, weighted by how much it beats it.";
          case 'PI': return "Probability of Improvement: Focuses purely on the chance of exceeding the current best score, regardless of margin.";
      }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Compass className="text-rose-400" />
            Adaptive Experimental Design
          </h2>
          <p className="text-slate-400 text-sm">
            Bayesian Optimization engine for automated Design-Test-Learn cycles.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Explored Space</div>
                <div className="text-white font-mono">{points.filter(p => p.status === 'EXPLORED').length} Points</div>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <button 
                onClick={handleRunOptimization}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    loading 
                    ? 'bg-slate-700 text-slate-400 cursor-wait' 
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                }`}
            >
                {loading ? <RefreshCw size={16} className="animate-spin"/> : <Zap size={16}/>}
                {loading ? 'Optimizing...' : 'Run Optimization Cycle'}
            </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Controls */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Brain size={14}/> Acquisition Strategy
                </h3>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        {(['UCB', 'EI', 'PI'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStrategy(s)}
                                className={`py-2 text-xs font-bold rounded border transition-all ${
                                    strategy === s 
                                    ? 'bg-rose-600 border-rose-500 text-white' 
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    
                    <p className="text-[10px] text-slate-400 leading-snug bg-slate-900/50 p-2 rounded border border-slate-800">
                        {getStrategyDescription()}
                    </p>

                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-400">Exploitation</span>
                            <span className="text-slate-400">Exploration</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max="10" 
                            value={explorationWeight}
                            onChange={(e) => setExplorationWeight(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                        <div className="text-center text-xs font-mono text-rose-400 mt-1">
                            {explorationWeight < 4 ? 'Conservative' : explorationWeight > 7 ? 'Aggressive' : 'Balanced'} (κ={explorationWeight})
                        </div>
                    </div>
                </div>
            </div>

            {/* Candidates List */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex-1 flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Target size={14}/> Next Batch Recommendations
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {points.filter(p => p.status === 'RECOMMENDED').map(p => (
                        <div key={p.id} className="bg-slate-900/80 border border-rose-500/30 p-3 rounded-lg relative overflow-hidden group animate-in fade-in slide-in-from-left-2">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-200 text-sm">{p.molecule}</span>
                                <span className="text-[10px] font-mono text-rose-400 bg-rose-900/20 px-1.5 py-0.5 rounded">
                                    Acq: {p.acquisitionScore?.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                                <span>Pred. Score: <span className="text-emerald-400">{p.score}</span></span>
                                <span>Uncertainty: <span className="text-yellow-400">{p.uncertainty.toFixed(2)}</span></span>
                            </div>
                        </div>
                    ))}
                    {points.filter(p => p.status === 'RECOMMENDED').length === 0 && (
                        <div className="text-center text-slate-600 mt-10 text-xs italic">
                            Run optimization to generate candidates.
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Center: Visualization */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-200 font-semibold flex items-center gap-2">
                        <Layers size={18} className="text-rose-400"/> Latent Chemical Space
                    </h3>
                    <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Explored (High Score)</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-600"></div> Explored (Low Score)</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border-2 border-rose-500"></div> Candidate</div>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-0 bg-slate-900/50 rounded-lg border border-slate-800 relative">
                    {/* Simplified Heatmap Background Simulation */}
                    <div className="absolute inset-0 opacity-10" style={{ 
                        background: 'radial-gradient(circle at 60% 20%, rgba(16, 185, 129, 0.4) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(244, 63, 94, 0.2) 0%, transparent 40%)' 
                    }}></div>

                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" dataKey="x" name="Latent Dim 1" stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                            <YAxis type="number" dataKey="y" name="Latent Dim 2" stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                            <ZAxis type="number" dataKey="uncertainty" range={[50, 400]} />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                                                <p className="font-bold text-slate-200 mb-1">{data.molecule}</p>
                                                <p className="text-slate-400">Score: <span className="text-emerald-400">{data.score}</span></p>
                                                <p className="text-slate-400">Uncertainty: <span className="text-yellow-400">{data.uncertainty}</span></p>
                                                <p className="text-slate-500 mt-1 font-mono uppercase text-[10px]">{data.status}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            
                            {/* Explored Points */}
                            <Scatter 
                                name="Explored" 
                                data={points.filter(p => p.status === 'EXPLORED')} 
                                fill="#8884d8"
                            >
                                {points.filter(p => p.status === 'EXPLORED').map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.score > 50 ? '#10b981' : '#475569'} />
                                ))}
                            </Scatter>

                            {/* Recommended/Candidate Points */}
                            <Scatter 
                                name="Candidates" 
                                data={points.filter(p => p.status === 'RECOMMENDED' || p.status === 'CANDIDATE')} 
                                fill="#f43f5e"
                                shape="star"
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                {lastReasoning && (
                    <div className="mt-4 p-3 bg-rose-900/10 border border-rose-900/30 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Info size={16} className="text-rose-400 mt-0.5 flex-shrink-0"/>
                            <div>
                                <h4 className="text-xs font-bold text-rose-300 uppercase mb-1">Model Reasoning</h4>
                                <p className="text-xs text-slate-300 leading-relaxed italic">"{lastReasoning}"</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveLearningDashboard;