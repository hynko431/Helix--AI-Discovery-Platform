import React, { useState, useEffect } from 'react';
import { MLModel, ABExperiment } from '../types';
import { analyzeExperimentResults } from '../services/geminiService';
import { Box, GitBranch, Activity, Play, CheckCircle, AlertTriangle, ArrowRight, Shield, Server, BarChart2, Split, Clock, RefreshCw, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const INITIAL_MODELS: MLModel[] = [
  { id: 'mod-001', name: 'AlphaFold-Multimer', version: 'v2.3.1', framework: 'JAX', status: 'PRODUCTION', metrics: { accuracy: 0.92, latency: 450, f1Score: 0.91 }, lastUpdated: '2023-10-15', author: 'DeepMind' },
  { id: 'mod-002', name: 'GNN-Affinity-Predictor', version: 'v4.0.0-beta', framework: 'PyTorch', status: 'STAGING', metrics: { accuracy: 0.89, latency: 120, f1Score: 0.88 }, lastUpdated: '2023-11-20', author: 'Team Helix' },
  { id: 'mod-003', name: 'ToxPred-Ensemble', version: 'v1.5.2', framework: 'Scikit-Learn', status: 'PRODUCTION', metrics: { accuracy: 0.95, latency: 15, f1Score: 0.94 }, lastUpdated: '2023-09-01', author: 'Safety Team' },
  { id: 'mod-004', name: 'Retrosynthesis-Transformer', version: 'v2.1', framework: 'TensorFlow', status: 'TRAINING', metrics: { accuracy: 0.76, latency: 800, f1Score: 0.75 }, lastUpdated: '2023-11-21', author: 'ChemInformatics' },
];

const INITIAL_EXPERIMENT: ABExperiment = {
  id: 'exp-101',
  name: 'Affinity Model Upgrade (v3 vs v4)',
  modelA: 'mod-005', // v3 (hypothetical)
  modelB: 'mod-002', // v4
  trafficSplit: 20,
  status: 'RUNNING',
  startDate: '2023-11-18 09:00',
  results: {
    modelA_conversion: 0.65,
    modelB_conversion: 0.68,
    p_value: 0.04,
    confidence: 0.96
  }
};

// Mock chart data for live monitoring
const LIVE_DATA = Array.from({ length: 20 }, (_, i) => ({
  time: `T+${i*5}m`,
  ModelA: 60 + Math.random() * 10,
  ModelB: 62 + Math.random() * 12,
}));

const ModelRegistry: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'EXPERIMENTS'>('REGISTRY');
  const [models, setModels] = useState<MLModel[]>(INITIAL_MODELS);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [experiment, setExperiment] = useState<ABExperiment>(INITIAL_EXPERIMENT);
  const [analysis, setAnalysis] = useState<{ recommendation: string, reasoning: string, projectedImpact: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handlePromote = (modelId: string) => {
      setModels(prev => prev.map(m => {
          if (m.id === modelId) return { ...m, status: 'PRODUCTION' };
          // If promoting a model, demote others of same name if needed logic here
          return m;
      }));
  };

  const handleRunAnalysis = async () => {
      setAnalyzing(true);
      try {
          const result = await analyzeExperimentResults(experiment);
          setAnalysis(result);
      } catch (e) {
          console.error(e);
      } finally {
          setAnalyzing(false);
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'PRODUCTION': return 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
          case 'STAGING': return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
          case 'TRAINING': return 'bg-blue-900/30 text-blue-400 border-blue-800';
          default: return 'bg-slate-800 text-slate-400 border-slate-700';
      }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Server className="text-indigo-400" />
            Model Registry & Governance
          </h2>
          <p className="text-slate-400 text-sm">
            Centralized version control and safe A/B deployment orchestration for AI assets.
          </p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button 
                onClick={() => setActiveTab('REGISTRY')}
                className={`px-4 py-2 text-xs font-bold rounded transition-all flex items-center gap-2 ${
                    activeTab === 'REGISTRY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
                <Box size={14}/> Registry
            </button>
            <button 
                onClick={() => setActiveTab('EXPERIMENTS')}
                className={`px-4 py-2 text-xs font-bold rounded transition-all flex items-center gap-2 ${
                    activeTab === 'EXPERIMENTS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
                <Split size={14}/> A/B Experiments
            </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
          
          {/* REGISTRY TAB */}
          {activeTab === 'REGISTRY' && (
              <div className="flex flex-1 overflow-hidden">
                  {/* List */}
                  <div className="w-1/3 border-r border-slate-700 overflow-y-auto p-4 space-y-3">
                      {models.map(model => (
                          <div 
                            key={model.id}
                            onClick={() => setSelectedModel(model)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                selectedModel?.id === model.id 
                                ? 'bg-indigo-900/20 border-indigo-500/50' 
                                : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${getStatusColor(model.status)}`}>
                                      {model.status}
                                  </span>
                                  <span className="text-xs text-slate-500 font-mono">{model.version}</span>
                              </div>
                              <h4 className="font-bold text-white mb-1">{model.name}</h4>
                              <div className="flex justify-between text-xs text-slate-400">
                                  <span>{model.framework}</span>
                                  <span>Updated: {model.lastUpdated}</span>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-6 overflow-y-auto">
                      {selectedModel ? (
                          <div className="animate-in fade-in slide-in-from-right-4">
                              <div className="flex justify-between items-start mb-6">
                                  <div>
                                      <h3 className="text-2xl font-bold text-white mb-1">{selectedModel.name}</h3>
                                      <div className="flex items-center gap-3 text-sm text-slate-400">
                                          <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{selectedModel.id}</span>
                                          <span>Author: {selectedModel.author}</span>
                                      </div>
                                  </div>
                                  {selectedModel.status === 'STAGING' && (
                                      <button 
                                        onClick={() => handlePromote(selectedModel.id)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
                                      >
                                          <CheckCircle size={16}/> Promote to Prod
                                      </button>
                                  )}
                              </div>

                              <div className="grid grid-cols-3 gap-4 mb-8">
                                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-center">
                                      <div className="text-slate-500 text-xs uppercase font-bold mb-1">Accuracy</div>
                                      <div className="text-2xl font-mono text-emerald-400">{(selectedModel.metrics.accuracy * 100).toFixed(1)}%</div>
                                  </div>
                                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-center">
                                      <div className="text-slate-500 text-xs uppercase font-bold mb-1">Latency (p95)</div>
                                      <div className="text-2xl font-mono text-yellow-400">{selectedModel.metrics.latency}ms</div>
                                  </div>
                                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-center">
                                      <div className="text-slate-500 text-xs uppercase font-bold mb-1">F1 Score</div>
                                      <div className="text-2xl font-mono text-blue-400">{selectedModel.metrics.f1Score.toFixed(3)}</div>
                                  </div>
                              </div>

                              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 mb-6">
                                  <h4 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                                      <Activity size={16} className="text-indigo-400"/> Deployment Health
                                  </h4>
                                  <div className="h-48 flex items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-lg">
                                      Performance Chart Placeholder (History)
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="h-full flex items-center justify-center text-slate-500">
                              <p>Select a model to view details</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* EXPERIMENTS TAB */}
          {activeTab === 'EXPERIMENTS' && (
              <div className="flex flex-1 overflow-hidden">
                  <div className="flex-1 p-6 overflow-y-auto">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                  <Split className="text-yellow-400"/> Active Experiment: {experiment.name}
                              </h3>
                              <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                  <Clock size={12}/> Started: {experiment.startDate}
                              </p>
                          </div>
                          <div className="flex gap-2">
                              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
                                  <span className="text-xs text-slate-500 uppercase font-bold">Status</span>
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                      <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                                      RUNNING
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 mb-8">
                          {/* Traffic Split */}
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 col-span-1">
                              <h4 className="text-sm font-bold text-slate-300 mb-4">Traffic Distribution</h4>
                              <div className="flex justify-between text-xs mb-2">
                                  <span className="text-blue-400 font-bold">Champion ({100 - experiment.trafficSplit}%)</span>
                                  <span className="text-yellow-400 font-bold">Challenger ({experiment.trafficSplit}%)</span>
                              </div>
                              <div className="h-4 w-full bg-blue-900/30 rounded-full overflow-hidden flex">
                                  <div className="h-full bg-blue-500" style={{width: `${100 - experiment.trafficSplit}%`}}></div>
                                  <div className="h-full bg-yellow-500" style={{width: `${experiment.trafficSplit}%`}}></div>
                              </div>
                              <div className="mt-6">
                                  <label className="text-xs text-slate-500 mb-1 block">Adjust Rollout</label>
                                  <input 
                                    type="range" min="0" max="50" value={experiment.trafficSplit} 
                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                    onChange={(e) => setExperiment({...experiment, trafficSplit: parseInt(e.target.value)})}
                                  />
                              </div>
                          </div>

                          {/* Live Metrics */}
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 col-span-2 flex flex-col">
                              <h4 className="text-sm font-bold text-slate-300 mb-2">Live Performance Comparison (Accuracy)</h4>
                              <div className="flex-1 min-h-0">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={LIVE_DATA}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                          <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                                          <YAxis domain={[50, 80]} stroke="#64748b" fontSize={10} tickLine={false} />
                                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }} />
                                          <Legend wrapperStyle={{ fontSize: '12px' }}/>
                                          <Line type="monotone" dataKey="ModelA" name="Champion (v3)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                          <Line type="monotone" dataKey="ModelB" name="Challenger (v4)" stroke="#eab308" strokeWidth={2} dot={false} />
                                      </LineChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                      </div>

                      {/* Analysis Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                              <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                  <BarChart2 size={16} className="text-emerald-400"/> Statistical Significance
                              </h4>
                              <div className="space-y-4">
                                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
                                      <span className="text-sm text-slate-400">P-Value</span>
                                      <span className={`font-mono font-bold ${experiment.results.p_value < 0.05 ? 'text-emerald-400' : 'text-red-400'}`}>
                                          {experiment.results.p_value}
                                      </span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
                                      <span className="text-sm text-slate-400">Lift (Conversion)</span>
                                      <span className="font-mono font-bold text-emerald-400">
                                          +{(experiment.results.modelB_conversion - experiment.results.modelA_conversion * 100).toFixed(1)}%
                                      </span>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-5">
                              <div className="flex justify-between items-start mb-4">
                                  <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                                      <Shield size={16}/> AI Decision Support
                                  </h4>
                                  <button 
                                    onClick={handleRunAnalysis}
                                    disabled={analyzing}
                                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-all"
                                  >
                                      {analyzing ? <RefreshCw size={12} className="animate-spin"/> : <Play size={12}/>}
                                      Analyze
                                  </button>
                              </div>
                              
                              {analysis ? (
                                  <div className="animate-in fade-in slide-in-from-bottom-2">
                                      <div className={`text-lg font-bold mb-2 ${
                                          analysis.recommendation === 'PROMOTE_CHALLENGER' ? 'text-emerald-400' : 'text-yellow-400'
                                      }`}>
                                          {analysis.recommendation.replace('_', ' ')}
                                      </div>
                                      <p className="text-sm text-slate-300 leading-relaxed mb-3">
                                          {analysis.reasoning}
                                      </p>
                                      <div className="text-xs text-indigo-300 bg-indigo-900/30 p-2 rounded border border-indigo-500/30">
                                          <strong>Impact:</strong> {analysis.projectedImpact}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-center text-slate-500 py-6 text-sm italic">
                                      Run AI analysis to get rollout recommendation.
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default ModelRegistry;