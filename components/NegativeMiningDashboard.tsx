import React, { useState, useEffect } from 'react';
import { getFailedExperiments, triggerFineTuning } from '../services/geminiService';
import { FailedExperiment, ModelVersion } from '../types';
import { AlertCircle, CheckCircle, XCircle, Database, GitMerge, TrendingDown, Server, Brain, Filter, Archive, ArrowRight, Activity, RotateCcw, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

const INITIAL_MODEL_HISTORY: ModelVersion[] = [
    { version: 'v1.0.0', date: '2023-10-01', falsePositiveRate: 0.12, precision: 0.65, hardNegativesCount: 0 },
    { version: 'v1.1.0', date: '2023-10-15', falsePositiveRate: 0.09, precision: 0.72, hardNegativesCount: 45 },
    { version: 'v1.2.0', date: '2023-11-01', falsePositiveRate: 0.07, precision: 0.78, hardNegativesCount: 120 },
    { version: 'v1.3.0', date: '2023-11-20', falsePositiveRate: 0.05, precision: 0.82, hardNegativesCount: 210 },
];

const NegativeMiningDashboard: React.FC = () => {
  const [experiments, setExperiments] = useState<FailedExperiment[]>([]);
  const [modelHistory, setModelHistory] = useState<ModelVersion[]>(INITIAL_MODEL_HISTORY);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [lastImprovement, setLastImprovement] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadFailures();
  }, []);

  const loadFailures = async () => {
    setLoading(true);
    try {
      const data = await getFailedExperiments();
      setExperiments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (id: string, action: 'HARD_NEGATIVE' | 'TECHNICAL_FAILURE' | 'IGNORED') => {
      setExperiments(prev => prev.map(exp => 
          exp.id === id ? { ...exp, status: action } : exp
      ));
  };

  const startRetraining = async () => {
      const hardNegatives = experiments.filter(e => e.status === 'HARD_NEGATIVE');
      if (hardNegatives.length === 0) return;

      setTraining(true);
      try {
          const result = await triggerFineTuning(hardNegatives.length);
          
          setModelHistory(prev => [...prev, result.version]);
          setLastImprovement(result.improvement);
          
          // Clear processed experiments
          setExperiments(prev => prev.filter(e => e.status !== 'HARD_NEGATIVE'));
      } catch (e) {
          alert("Retraining failed");
      } finally {
          setTraining(false);
      }
  };

  const pendingHardNegatives = experiments.filter(e => e.status === 'HARD_NEGATIVE').length;

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <GitMerge className="text-red-400" />
            Negative Mining & Continual Learning
          </h2>
          <p className="text-slate-400 text-sm">
            Systematically capture failed experiments to reduce false positives and improve model robustness.
          </p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={loadFailures} 
                disabled={loading}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
                <RotateCcw size={14}/> Refresh Feed
            </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left Column: Triage Feed */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                    <Filter size={16} className="text-red-400"/> Failure Triage Queue
                </h3>
                <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700">
                    {experiments.filter(e => e.status === 'PENDING_REVIEW').length} Pending
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {experiments.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Archive size={48} className="mb-2 opacity-50"/>
                        <p>No failed experiments to review.</p>
                    </div>
                )}
                {experiments.filter(e => e.status === 'PENDING_REVIEW').map(exp => (
                    <div key={exp.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 animate-in fade-in slide-in-from-left-2">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-white text-sm">{exp.moleculeName}</h4>
                                <div className="text-xs text-slate-400">{exp.target} • {exp.assay}</div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{exp.failureDate}</span>
                        </div>

                        <div className="flex items-center gap-4 mb-4 bg-slate-950/50 p-2 rounded border border-slate-800">
                            <div className="flex-1 text-center border-r border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Predicted</div>
                                <div className="text-emerald-400 font-mono font-bold text-lg">{exp.predictedActivity}%</div>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Actual</div>
                                <div className="text-red-400 font-mono font-bold text-lg">{exp.actualActivity}%</div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleAction(exp.id, 'HARD_NEGATIVE')}
                                className="flex-1 py-2 bg-red-900/20 border border-red-800 hover:bg-red-900/40 text-red-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Brain size={14}/> Mark Hard Negative
                            </button>
                            <button 
                                onClick={() => handleAction(exp.id, 'TECHNICAL_FAILURE')}
                                className="flex-1 py-2 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
                            >
                                Technical Error
                            </button>
                            <button 
                                onClick={() => handleAction(exp.id, 'IGNORED')}
                                className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
                                title="Ignore"
                            >
                                <XCircle size={18}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Column: Model Evolution & Training */}
        <div className="w-[500px] flex flex-col gap-6">
            
            {/* Staging & Training Control */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Server size={16} className="text-indigo-400"/> Training Controller
                </h3>
                
                <div className="flex items-center justify-between mb-6 bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Database size={20} className="text-red-400"/>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{pendingHardNegatives}</div>
                            <div className="text-xs text-slate-400">Items in Staging</div>
                        </div>
                    </div>
                    <ArrowRight className="text-slate-600"/>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Brain size={20} className="text-indigo-400"/>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-white">GNN-v2</div>
                            <div className="text-xs text-slate-400">Current Model</div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={startRetraining}
                    disabled={training || pendingHardNegatives === 0}
                    className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                        training
                        ? 'bg-slate-700 text-slate-400 cursor-wait'
                        : pendingHardNegatives > 0
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                >
                    {training ? <><RefreshCw size={16} className="animate-spin"/> Fine-Tuning Model...</> : <><Activity size={16}/> Start Fine-Tuning Job</>}
                </button>

                {lastImprovement && (
                    <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg flex items-start gap-2">
                        <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0"/>
                        <p className="text-xs text-emerald-200 leading-relaxed">{lastImprovement}</p>
                    </div>
                )}
            </div>

            {/* Model Performance Chart */}
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col min-h-[300px]">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <TrendingDown size={16} className="text-emerald-400"/> Error Reduction Trend
                </h3>
                
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={modelHistory}>
                            <defs>
                                <linearGradient id="colorFpr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="version" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} label={{ value: 'False Positive Rate', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }}/>
                            <Area type="monotone" dataKey="falsePositiveRate" name="False Positive Rate" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFpr)" />
                            <Line type="monotone" dataKey="precision" name="Precision" stroke="#10b981" strokeWidth={2} dot={{r: 4}} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                    Continual learning reduces FPR by incorporating hard negatives.
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default NegativeMiningDashboard;