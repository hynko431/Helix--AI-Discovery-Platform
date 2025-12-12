import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Database, Cpu, Activity, CheckCircle, Clock, Wifi, TrendingUp, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';

const data = [
  { name: '00:00', synth: 40, screen: 24 },
  { name: '04:00', synth: 30, screen: 13 },
  { name: '08:00', synth: 85, screen: 68 },
  { name: '12:00', synth: 95, screen: 89 },
  { name: '16:00', synth: 80, screen: 70 },
  { name: '20:00', synth: 55, screen: 40 },
  { name: '23:59', synth: 45, screen: 30 },
];

const historyData = [
  { day: 'Mon', synthesisRate: 780, successRate: 88 },
  { day: 'Tue', synthesisRate: 810, successRate: 92 },
  { day: 'Wed', synthesisRate: 842, successRate: 95 },
  { day: 'Thu', synthesisRate: 790, successRate: 85 },
  { day: 'Fri', synthesisRate: 860, successRate: 91 },
  { day: 'Sat', synthesisRate: 900, successRate: 96 },
  { day: 'Sun', synthesisRate: 880, successRate: 94 },
];

interface Job {
  id: string;
  name: string;
  status: 'Running' | 'Queued' | 'Completed';
  progress: number;
  startTime: string;
  estimatedCompletion: string;
  parameters: Record<string, string>;
}

const initialJobs: Job[] = [
  { 
    id: 'JOB-9921', 
    name: 'Peptide Synthesis Batch A', 
    status: 'Running', 
    progress: 78,
    startTime: '08:30:00',
    estimatedCompletion: '14:45:00',
    parameters: { 'Sequence': 'ALK-7', 'Temp': '25°C', 'Cycles': '40' }
  },
  { 
    id: 'JOB-9922', 
    name: 'Solubility Screening', 
    status: 'Queued', 
    progress: 0,
    startTime: 'Pending',
    estimatedCompletion: 'TBD',
    parameters: { 'Solvent': 'DMSO', 'Conc': '10mM', 'Plate': '384-well' }
  },
  { 
    id: 'JOB-9923', 
    name: 'Crystal Structure Analysis', 
    status: 'Completed', 
    progress: 100,
    startTime: '02:15:00',
    estimatedCompletion: '06:30:00',
    parameters: { 'Protein': 'KRAS', 'Method': 'X-ray', 'Res': '1.8Å' }
  },
  { 
    id: 'JOB-9924', 
    name: 'Toxicity Assay (Liver)', 
    status: 'Running', 
    progress: 34,
    startTime: '09:00:00',
    estimatedCompletion: '18:00:00',
    parameters: { 'Cell Line': 'HepG2', 'Duration': '24h', 'Marker': 'ATP' }
  },
  { 
    id: 'JOB-9925', 
    name: 'Ligand Binding Affinity', 
    status: 'Queued', 
    progress: 0,
    startTime: 'Pending',
    estimatedCompletion: 'TBD',
    parameters: { 'Target': '5-HT2A', 'Temp': '37°C', 'Method': 'SPR' }
  },
  { 
    id: 'JOB-9926', 
    name: 'CRISPR Target Validation', 
    status: 'Queued', 
    progress: 0,
    startTime: 'Pending',
    estimatedCompletion: 'TBD',
    parameters: { 'Guide': 'sgRNA-4', 'Cas9': 'WT', 'Vector': 'pLenti' }
  },
];

const LabControl: React.FC = () => {
  const [activeJobs, setActiveJobs] = useState<Job[]>(initialJobs);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Real-time job simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveJobs(currentJobs => {
        return currentJobs.map(job => {
          if (job.status === 'Running') {
            // Random progress increment between 0.5% and 2.5%
            const increment = Math.random() * 2 + 0.5;
            const newProgress = Math.min(job.progress + increment, 100);
            
            return {
              ...job,
              progress: newProgress,
              status: newProgress >= 100 ? 'Completed' : 'Running',
              estimatedCompletion: newProgress >= 100 ? new Date().toLocaleTimeString('en-US', { hour12: false }) : job.estimatedCompletion
            };
          } else if (job.status === 'Queued') {
            // Check running jobs count
            const runningCount = currentJobs.filter(j => j.status === 'Running').length;
            // 10% chance to start if fewer than 3 concurrent jobs
            if (runningCount < 3 && Math.random() > 0.9) {
              return { 
                ...job, 
                status: 'Running',
                startTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
                estimatedCompletion: 'Calculating...'
              };
            }
          }
          return job;
        });
      });
    }, 800); // Updates every 800ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col space-y-6 p-1 overflow-y-auto">
      <div className="flex justify-between items-end mb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Cpu className="text-purple-400" />
              Automated Lab Operations
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-medium tracking-wide">AI LINK ESTABLISHED</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            Live telemetry from London Robotics Facility (Node 1)
          </p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-mono border border-green-800">
            <Wifi size={12} />
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* KPI Cards */}
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/50 cursor-pointer group">
          <div className="text-slate-400 text-xs font-bold uppercase mb-2 group-hover:text-purple-300 transition-colors">Synthesis Throughput</div>
          <div className="text-3xl font-mono text-white">842 <span className="text-sm text-slate-500">/day</span></div>
          <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
            <Activity size={12}/> +12% vs avg
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50 cursor-pointer group">
          <div className="text-slate-400 text-xs font-bold uppercase mb-2 group-hover:text-cyan-300 transition-colors">Compounds Screened</div>
          <div className="text-3xl font-mono text-white">2.2M</div>
          <div className="text-slate-500 text-xs mt-1">Lifetime total</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20 hover:border-yellow-500/50 cursor-pointer group">
          <div className="text-slate-400 text-xs font-bold uppercase mb-2 group-hover:text-yellow-300 transition-colors">Active Robots</div>
          <div className="text-3xl font-mono text-white">12<span className="text-slate-600 text-xl">/14</span></div>
          <div className="text-yellow-500 text-xs mt-1">2 Maintenance</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500/50 cursor-pointer group">
          <div className="text-slate-400 text-xs font-bold uppercase mb-2 group-hover:text-indigo-300 transition-colors">Data Generated</div>
          <div className="text-3xl font-mono text-white">45.2 <span className="text-sm text-slate-500">TB</span></div>
          <div className="text-purple-400 text-xs mt-1">Auto-indexing</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col">
          <h3 className="text-slate-200 font-semibold mb-6 flex items-center gap-2">
            <Database size={18} className="text-slate-400"/>
            Production Metrics (24h)
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSynth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorScreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="synth" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSynth)" name="Synthesis" />
                <Area type="monotone" dataKey="screen" stroke="#06b6d4" fillOpacity={1} fill="url(#colorScreen)" name="Screening" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Queue */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-200 font-semibold">Job Queue</h3>
            <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">{activeJobs.filter(j => j.status === 'Running').length} Running</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {activeJobs.map((job) => (
              <div 
                key={job.id} 
                onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 ${
                    expandedJobId === job.id 
                    ? 'bg-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-900/20' 
                    : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-slate-500">{job.id}</span>
                  <div className="flex items-center gap-2">
                    {job.status === 'Completed' ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : job.status === 'Running' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-blue-400 font-mono">{job.progress.toFixed(0)}%</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <Clock size={14} className="text-slate-500" />
                    )}
                    {expandedJobId === job.id ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                  </div>
                </div>
                <div className="text-slate-200 text-sm font-medium mb-2">{job.name}</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      job.status === 'Completed' ? 'bg-green-500' : 
                      job.status === 'Running' ? 'bg-blue-500' : 'bg-slate-600'
                    }`} 
                    style={{ width: `${job.progress}%` }}
                  />
                </div>

                {expandedJobId === job.id && (
                    <div className="mt-4 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Start Time</div>
                            <div className="text-xs font-mono text-slate-300">{job.startTime}</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Est. End</div>
                            <div className="text-xs font-mono text-slate-300">{job.estimatedCompletion}</div>
                        </div>
                        <div className="col-span-2">
                             <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Parameters</div>
                             <div className="flex flex-wrap gap-2">
                                 {Object.entries(job.parameters).map(([k, v]) => (
                                     <span key={k} className="px-2 py-1 rounded bg-slate-950/50 border border-slate-700/50 text-[10px] text-cyan-400 font-mono">
                                        {k}: <span className="text-slate-300">{v}</span>
                                     </span>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 border border-slate-600 text-slate-300 rounded hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2">
            <PlayCircle size={14} />
            Queue New Batch
          </button>
        </div>
      </div>

      {/* Historical Performance Trends */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-slate-200 font-semibold mb-6 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-400"/>
          Historical Performance Trends (7 Days)
        </h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} label={{ value: 'Synthesis (units)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} label={{ value: 'Success (%)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
              <Line yAxisId="left" type="monotone" dataKey="synthesisRate" name="Synthesis Rate" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="successRate" name="Screening Success %" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LabControl;