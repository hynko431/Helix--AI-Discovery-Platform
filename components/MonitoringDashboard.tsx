import React, { useState, useEffect } from 'react';
import { analyzeSystemHealth } from '../services/geminiService';
import { ServiceHealth, ActiveAlert, MetricPoint, DriftMetric } from '../types';
import { Activity, AlertTriangle, CheckCircle, Clock, Server, BarChart2, Zap, Shield, Eye, RefreshCw, Layers } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, Legend, Cell } from 'recharts';

const INITIAL_SERVICES: ServiceHealth[] = [
  { id: 'svc-1', name: 'API Gateway', status: 'HEALTHY', uptime: 99.99, latency: 45, errorRate: 0.02, region: 'us-east-1' },
  { id: 'svc-2', name: 'Workflow Engine', status: 'DEGRADED', uptime: 99.5, latency: 250, errorRate: 1.5, region: 'us-east-1' },
  { id: 'svc-3', name: 'Model Server (GNN)', status: 'HEALTHY', uptime: 99.95, latency: 120, errorRate: 0.1, region: 'us-west-2' },
  { id: 'svc-4', name: 'Data Lake (S3)', status: 'HEALTHY', uptime: 99.99, latency: 80, errorRate: 0.0, region: 'global' },
  { id: 'svc-5', name: 'Auth Service', status: 'HEALTHY', uptime: 99.99, latency: 15, errorRate: 0.01, region: 'us-east-1' },
];

const INITIAL_ALERTS: ActiveAlert[] = [
  { id: 'alt-1', serviceId: 'svc-2', severity: 'WARNING', message: 'High latency detected in job queue processing', timestamp: '10:45 AM', acknowledged: false },
  { id: 'alt-2', serviceId: 'svc-2', severity: 'INFO', message: 'Worker node auto-scaling event triggered', timestamp: '10:42 AM', acknowledged: true }
];

const INITIAL_DRIFT: DriftMetric[] = [
  { feature: 'Molecular Weight', klDivergence: 0.02, significance: 'LOW', lastTrainingValue: 450, currentValue: 455 },
  { feature: 'LogP', klDivergence: 0.15, significance: 'HIGH', lastTrainingValue: 2.5, currentValue: 3.8 }, // Drift!
  { feature: 'Toxicity Score', klDivergence: 0.05, significance: 'MEDIUM', lastTrainingValue: 0.1, currentValue: 0.12 },
];

// Mock Time Series Data
const generateMockMetrics = (points: number): MetricPoint[] => {
    const data: MetricPoint[] = [];
    const now = Date.now();
    for (let i = 0; i < points; i++) {
        const time = new Date(now - (points - i) * 60000); // 1 min intervals
        data.push({
            timestamp: time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            latency: 40 + Math.random() * 20 + (i > 40 ? 100 : 0), // Spike at end
            requests: 500 + Math.random() * 100,
            errors: Math.random() * 5 + (i > 40 ? 15 : 0) // Spike at end
        });
    }
    return data;
};

const MonitoringDashboard: React.FC = () => {
  const [services, setServices] = useState<ServiceHealth[]>(INITIAL_SERVICES);
  const [alerts, setAlerts] = useState<ActiveAlert[]>(INITIAL_ALERTS);
  const [metrics, setMetrics] = useState<MetricPoint[]>(generateMockMetrics(60));
  const [drift, setDrift] = useState<DriftMetric[]>(INITIAL_DRIFT);
  const [analysis, setAnalysis] = useState<{ rootCause: string, remediation: string, impact: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Auto-refresh simulation
  useEffect(() => {
      const interval = setInterval(() => {
          setMetrics(prev => {
              const newPoint = {
                  timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  latency: 40 + Math.random() * 20 + (Math.random() > 0.9 ? 150 : 0),
                  requests: 500 + Math.random() * 100,
                  errors: Math.random() * 5
              };
              return [...prev.slice(1), newPoint];
          });
      }, 3000);
      return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async () => {
      setIsAnalyzing(true);
      try {
          const result = await analyzeSystemHealth(alerts, metrics.slice(-10));
          setAnalysis(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'HEALTHY': return 'bg-emerald-500';
          case 'DEGRADED': return 'bg-yellow-500';
          case 'DOWN': return 'bg-red-500';
          default: return 'bg-slate-500';
      }
  };

  const getSeverityColor = (sev: string) => {
      switch(sev) {
          case 'CRITICAL': return 'text-red-400 border-red-500/50 bg-red-500/10';
          case 'WARNING': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
          case 'INFO': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
          default: return 'text-slate-400 border-slate-500/50 bg-slate-500/10';
      }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Activity className="text-emerald-400" />
            System Observability & SLA
          </h2>
          <p className="text-slate-400 text-sm">
            Real-time monitoring of service health, model performance drift, and operational reliability.
          </p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">SLA Compliance</div>
                <div className="text-xl font-mono text-emerald-400 font-bold flex items-center justify-end gap-1">
                    99.98% <CheckCircle size={16}/>
                </div>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:bg-slate-700 transition-colors">1h</button>
                <button className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold shadow">24h</button>
                <button className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:bg-slate-700 transition-colors">7d</button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Service Health & Charts */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            
            {/* Service Grid */}
            <div className="grid grid-cols-5 gap-4">
                {services.map(svc => (
                    <div 
                        key={svc.id}
                        onClick={() => setSelectedService(selectedService === svc.id ? null : svc.id)}
                        className={`bg-slate-800 border rounded-xl p-4 cursor-pointer transition-all hover:translate-y-[-2px] ${
                            selectedService === svc.id ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-slate-700 hover:border-slate-600'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <Server size={16} className="text-slate-400"/>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(svc.status)} ${svc.status !== 'HEALTHY' ? 'animate-pulse' : ''}`}></div>
                        </div>
                        <div className="font-bold text-white text-sm mb-1">{svc.name}</div>
                        <div className="flex justify-between items-end">
                            <div className="text-xs text-slate-500">{svc.region}</div>
                            <div className="text-right">
                                <div className="text-xs font-mono text-slate-300">{svc.latency}ms</div>
                                <div className={`text-[10px] ${svc.errorRate > 1 ? 'text-red-400' : 'text-emerald-400'}`}>{svc.errorRate}% Err</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Clock size={16} className="text-indigo-400"/> Latency & Throughput
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics}>
                                <defs>
                                    <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tick={false} />
                                <YAxis stroke="#64748b" fontSize={10} label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="latency" stroke="#6366f1" fill="url(#colorLat)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Layers size={16} className="text-orange-400"/> Model Drift (KL Divergence)
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={drift} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 0.5]} />
                                <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: '#334155', opacity: 0.2}}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }}
                                />
                                <Bar dataKey="klDivergence" barSize={20} radius={[0, 4, 4, 0]}>
                                    {drift.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.significance === 'HIGH' ? '#f87171' : entry.significance === 'MEDIUM' ? '#facc15' : '#34d399'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex gap-4 justify-center text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-400"></div> High Drift</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-yellow-400"></div> Medium</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-400"></div> Low</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right: Alerts & AI Analysis */}
        <div className="w-96 flex flex-col gap-6">
            
            {/* Active Alerts */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden flex-1">
                <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} className="text-yellow-400"/> Active Incidents
                    </h3>
                    <span className="bg-red-900/30 text-red-400 px-2 py-0.5 rounded text-xs font-bold border border-red-800">{alerts.filter(a => !a.acknowledged).length} New</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {alerts.map(alert => (
                        <div key={alert.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 group hover:border-slate-600 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getSeverityColor(alert.severity)}`}>
                                    {alert.severity}
                                </span>
                                <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-snug mb-2">{alert.message}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-mono bg-slate-950 px-1 rounded">{alert.serviceId}</span>
                                {!alert.acknowledged && (
                                    <button className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Acknowledge
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI SRE Analysis */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Zap size={16} className="text-indigo-400"/> Automated Root Cause
                    </h3>
                    <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isAnalyzing ? <RefreshCw size={12} className="animate-spin"/> : <Eye size={12}/>}
                        Analyze
                    </button>
                </div>

                {analysis ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                        <div className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg">
                            <div className="text-xs font-bold text-red-400 uppercase mb-1">Root Cause</div>
                            <p className="text-xs text-slate-300 leading-relaxed">{analysis.rootCause}</p>
                        </div>
                        <div className="p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-lg">
                            <div className="text-xs font-bold text-emerald-400 uppercase mb-1">Suggested Remediation</div>
                            <p className="text-xs text-slate-300 leading-relaxed">{analysis.remediation}</p>
                        </div>
                        <div className="text-xs text-slate-500 italic border-t border-slate-700 pt-2">
                            Estimated Impact: {analysis.impact}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-6 text-xs italic bg-slate-900/50 rounded-lg border border-slate-800">
                        Run analysis to correlate active alerts and metrics.
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;