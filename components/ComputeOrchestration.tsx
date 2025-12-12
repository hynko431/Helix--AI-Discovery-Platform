import React, { useState, useEffect } from 'react';
import { optimizeComputeSchedule } from '../services/geminiService';
import { ComputeNode, ComputeJob } from '../types';
import { Server, Cpu, Zap, DollarSign, Clock, Play, Pause, AlertTriangle, CheckCircle, BarChart3, Cloud, Save, RotateCcw, Activity, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const INITIAL_NODES: ComputeNode[] = [
  { id: 'node-01', name: 'g5.4xlarge-spot-1', type: 'GPU_A100', lifecycle: 'SPOT', status: 'RUNNING', utilization: 85, hourlyCost: 1.62 },
  { id: 'node-02', name: 'g5.4xlarge-spot-2', type: 'GPU_A100', lifecycle: 'SPOT', status: 'RUNNING', utilization: 92, hourlyCost: 1.62 },
  { id: 'node-03', name: 'c6i.8xlarge-od-1', type: 'CPU_HIGH_MEM', lifecycle: 'ON_DEMAND', status: 'RUNNING', utilization: 45, hourlyCost: 3.40 },
  { id: 'node-04', name: 'g4dn.xlarge-spot-1', type: 'GPU_H100', lifecycle: 'SPOT', status: 'IDLE', utilization: 5, hourlyCost: 0.58 },
  { id: 'node-05', name: 'c6i.large-od-2', type: 'CPU_GENERAL', lifecycle: 'ON_DEMAND', status: 'RUNNING', utilization: 60, hourlyCost: 0.85 },
  { id: 'node-06', name: 'g5.2xlarge-spot-3', type: 'GPU_A100', lifecycle: 'SPOT', status: 'PREEMPTED', utilization: 0, hourlyCost: 0.0 },
];

const INITIAL_JOBS: ComputeJob[] = [
  { id: 'job-101', name: 'Protein Folding (AlphaFold)', priority: 'NORMAL', status: 'RUNNING', estimatedCost: 45.50, durationHours: 12, checkpointed: true, assignedNodeId: 'node-01', strategy: 'COST_SAVER' },
  { id: 'job-102', name: 'MD Simulation (GROMACS)', priority: 'CRITICAL', status: 'RUNNING', estimatedCost: 120.00, durationHours: 24, checkpointed: true, assignedNodeId: 'node-03', strategy: 'PERFORMANCE' },
  { id: 'job-103', name: 'Docking Screen (Vina)', priority: 'LOW', status: 'QUEUED', estimatedCost: 15.20, durationHours: 4, checkpointed: false, strategy: 'COST_SAVER' },
  { id: 'job-104', name: 'Retrosynthesis Search', priority: 'NORMAL', status: 'QUEUED', estimatedCost: 8.50, durationHours: 2, checkpointed: false, strategy: 'COST_SAVER' },
];

const COST_HISTORY = [
    { time: '00:00', onDemand: 12, spot: 4 },
    { time: '04:00', onDemand: 10, spot: 3 },
    { time: '08:00', onDemand: 45, spot: 12 },
    { time: '12:00', onDemand: 55, spot: 25 },
    { time: '16:00', onDemand: 50, spot: 22 },
    { time: '20:00', onDemand: 30, spot: 15 },
    { time: 'Now', onDemand: 25, spot: 18 },
];

const ComputeOrchestration: React.FC = () => {
  const [nodes, setNodes] = useState<ComputeNode[]>(INITIAL_NODES);
  const [jobs, setJobs] = useState<ComputeJob[]>(INITIAL_JOBS);
  const [optimizing, setOptimizing] = useState(false);
  const [suggestion, setSuggestion] = useState<{ text: string, savings: number } | null>(null);
  
  // Simulate Spot Preemption & Recovery
  useEffect(() => {
      const interval = setInterval(() => {
          // 5% chance to recover preempted node or preempt a spot node
          if (Math.random() > 0.95) {
              setNodes(prev => prev.map(n => {
                  if (n.status === 'PREEMPTED') return { ...n, status: 'STARTING', utilization: 10 };
                  if (n.lifecycle === 'SPOT' && n.status === 'RUNNING' && Math.random() > 0.8) {
                      // Trigger preemption
                      return { ...n, status: 'PREEMPTED', utilization: 0 };
                  }
                  return n;
              }));
          }
      }, 3000);
      return () => clearInterval(interval);
  }, []);

  const handleOptimization = async () => {
      setOptimizing(true);
      try {
          const result = await optimizeComputeSchedule(jobs);
          setSuggestion({ text: result.suggestion, savings: result.savedCost });
          
          // Apply some mock updates based on suggestion
          if (result.newStrategy === 'COST_SAVER') {
              setJobs(prev => prev.map(j => 
                  j.priority === 'LOW' && j.status === 'QUEUED' 
                  ? { ...j, strategy: 'COST_SAVER', estimatedCost: j.estimatedCost * 0.4 } 
                  : j
              ));
          }
      } catch (e) {
          console.error(e);
      } finally {
          setOptimizing(false);
      }
  };

  const autoScale = () => {
      const newNode: ComputeNode = {
          id: `node-auto-${Date.now()}`,
          name: 'g5.xlarge-spot-auto',
          type: 'GPU_A100',
          lifecycle: 'SPOT',
          status: 'STARTING',
          utilization: 0,
          hourlyCost: 0.85
      };
      setNodes(prev => [...prev, newNode]);
      setTimeout(() => {
          setNodes(prev => prev.map(n => n.id === newNode.id ? { ...n, status: 'RUNNING', utilization: 20 } : n));
      }, 2000);
  };

  const totalHourlyCost = nodes.filter(n => n.status === 'RUNNING').reduce((sum, n) => sum + n.hourlyCost, 0);
  const savingsRate = 0.65; // Approx spot savings vs on-demand

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Cloud className="text-sky-400" />
            Elastic Compute Orchestration
          </h2>
          <p className="text-slate-400 text-sm">
            Cost-aware workload scheduling with automated Spot Instance management and checkpoint recovery.
          </p>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Current Burn Rate</div>
                <div className="text-xl font-mono text-white font-bold flex items-center justify-end gap-1">
                    ${totalHourlyCost.toFixed(2)}<span className="text-sm text-slate-500">/hr</span>
                </div>
            </div>
            <div className="h-10 w-px bg-slate-700"></div>
            <button 
                onClick={autoScale}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-sky-400 hover:text-sky-300 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
                <Activity size={16}/> Auto-Scale
            </button>
            <button 
                onClick={handleOptimization}
                disabled={optimizing}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-sky-500/20"
            >
                {optimizing ? <RotateCcw size={16} className="animate-spin"/> : <Zap size={16}/>}
                Optimize Costs
            </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Cluster Map */}
        <div className="flex-1 flex flex-col gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Server size={16} className="text-sky-400"/> Active Cluster Map
                    </h3>
                    <div className="flex gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Running</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Preempted</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Starting</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                    {nodes.map(node => (
                        <div key={node.id} className={`p-4 rounded-lg border transition-all ${
                            node.status === 'PREEMPTED' ? 'bg-red-900/10 border-red-500/50' : 
                            node.status === 'STARTING' ? 'bg-yellow-900/10 border-yellow-500/50' : 
                            'bg-slate-900 border-slate-700'
                        }`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                                    node.lifecycle === 'SPOT' 
                                    ? 'bg-purple-900/30 text-purple-400 border-purple-800' 
                                    : 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
                                }`}>
                                    {node.lifecycle.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">${node.hourlyCost.toFixed(2)}/hr</span>
                            </div>
                            
                            <h4 className="font-mono text-sm font-bold text-slate-200 mb-1">{node.name}</h4>
                            <div className="text-xs text-slate-400 mb-3">{node.type}</div>

                            {node.status === 'PREEMPTED' ? (
                                <div className="text-xs text-red-400 flex items-center gap-2 font-bold animate-pulse">
                                    <AlertTriangle size={14}/> INTERRUPTED
                                </div>
                            ) : node.status === 'STARTING' ? (
                                <div className="text-xs text-yellow-400 flex items-center gap-2 font-bold animate-pulse">
                                    <RotateCcw size={14} className="animate-spin"/> PROVISIONING
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                        <span>Load</span>
                                        <span>{node.utilization}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                node.utilization > 90 ? 'bg-red-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${node.utilization}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Cost Chart */}
            <div className="h-64 bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Wallet size={16} className="text-emerald-400"/> Spend Velocity (24h)
                </h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={COST_HISTORY}>
                            <defs>
                                <linearGradient id="colorOnDemand" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSpot" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }}/>
                            <Area type="monotone" dataKey="onDemand" name="On-Demand" stackId="1" stroke="#3b82f6" fill="url(#colorOnDemand)" />
                            <Area type="monotone" dataKey="spot" name="Spot" stackId="1" stroke="#a855f7" fill="url(#colorSpot)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Right: Job Queue & Scheduling */}
        <div className="w-96 flex flex-col gap-6">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                    <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                        <Clock size={16} className="text-orange-400"/> Workload Scheduler
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    job.status === 'RUNNING' ? 'bg-emerald-900/30 text-emerald-400' :
                                    job.status === 'QUEUED' ? 'bg-slate-800 text-slate-400' :
                                    'bg-red-900/30 text-red-400'
                                }`}>
                                    {job.status}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                                    job.priority === 'CRITICAL' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                                    'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                    {job.priority}
                                </span>
                            </div>
                            
                            <h4 className="font-bold text-white text-sm mb-1">{job.name}</h4>
                            <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                                <span>Est. {job.durationHours}h</span>
                                <span className="font-mono text-slate-300">${job.estimatedCost.toFixed(2)}</span>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                {job.checkpointed && (
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-900/10 px-1.5 py-0.5 rounded border border-emerald-900/30">
                                        <Save size={10}/> Resilient
                                    </div>
                                )}
                                {job.strategy === 'COST_SAVER' && (
                                    <div className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-900/10 px-1.5 py-0.5 rounded border border-purple-900/30">
                                        <DollarSign size={10}/> Spot-Optimized
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Advisor */}
            {suggestion && (
                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 shadow-lg">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Zap size={20}/>
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-200 text-sm mb-1">Optimization Suggestion</h4>
                            <p className="text-xs text-slate-300 leading-relaxed mb-3">"{suggestion.text}"</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/30">
                                    Est. Savings: ${suggestion.savings.toFixed(2)}/mo
                                </span>
                                <button 
                                    onClick={() => setSuggestion(null)}
                                    className="text-xs text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-2"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default ComputeOrchestration;
