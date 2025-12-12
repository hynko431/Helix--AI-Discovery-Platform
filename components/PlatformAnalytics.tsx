import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Clock, Filter, AlertTriangle, Activity, CheckCircle, Zap, Shield, Target, Beaker, Brain, ChevronsUp, AlertOctagon } from 'lucide-react';

const ACTIVE_LEARNING_DATA = [
  { batch: 1, Random: 5, ActiveLearning: 5 },
  { batch: 2, Random: 8, ActiveLearning: 12 },
  { batch: 3, Random: 12, ActiveLearning: 25 },
  { batch: 4, Random: 15, ActiveLearning: 42 },
  { batch: 5, Random: 18, ActiveLearning: 68 },
  { batch: 6, Random: 22, ActiveLearning: 85 }, // First major hit found here for AL
  { batch: 7, Random: 26, ActiveLearning: 92 },
  { batch: 8, Random: 30, ActiveLearning: 96 },
];

const CANDIDATE_FUNNEL_DATA = [
  { name: 'Generated', value: 5000, fill: '#64748b' }, // Slate
  { name: 'In-Silico Screened', value: 1200, fill: '#3b82f6' }, // Blue
  { name: 'Retrosynthesis Feasible', value: 850, fill: '#10b981' }, // Emerald (Discarded 350 cost/synth)
  { name: 'Safety Approved', value: 600, fill: '#a855f7' }, // Purple
  { name: 'Queued for Lab', value: 150, fill: '#f59e0b' }, // Amber
];

const PROTOCOL_VELOCITY_DATA = [
  { task: 'PCR Setup', Manual: 240, AI: 25 }, // Minutes
  { task: 'Library Prep', Manual: 360, AI: 45 },
  { task: 'Compound Dilution', Manual: 120, AI: 10 },
  { task: 'Cell Culture Maintenance', Manual: 180, AI: 20 },
];

const CONTRADICTION_DATA = [
  { day: 'Mon', prevented: 5 },
  { day: 'Tue', prevented: 8 },
  { day: 'Wed', prevented: 12 }, // Spike
  { day: 'Thu', prevented: 6 },
  { day: 'Fri', prevented: 9 },
];

const PlatformAnalytics: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-1 overflow-hidden bg-slate-950">
      {/* Header */}
      <div className="mb-6 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="text-cyan-400" />
            Platform Impact & Strategic ROI
          </h2>
          <p className="text-slate-400 text-sm">
            Executive overview of discovery acceleration, operational efficiency, and risk mitigation across the Helix ecosystem.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={48} className="text-rose-400"/>
             </div>
             <div className="text-slate-400 text-xs font-bold uppercase mb-1">Hit Discovery Speed</div>
             <div className="text-3xl font-mono text-white font-bold mb-1">3.5x</div>
             <div className="text-rose-400 text-xs flex items-center gap-1">
                <Zap size={12}/> Faster time-to-hit vs baseline
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Filter size={48} className="text-emerald-400"/>
             </div>
             <div className="text-slate-400 text-xs font-bold uppercase mb-1">Synthesis Savings</div>
             <div className="text-3xl font-mono text-white font-bold mb-1">29%</div>
             <div className="text-emerald-400 text-xs flex items-center gap-1">
                <CheckCircle size={12}/> Candidates discarded (Cost/Feasibility)
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield size={48} className="text-purple-400"/>
             </div>
             <div className="text-slate-400 text-xs font-bold uppercase mb-1">Wasted Runs Prevented</div>
             <div className="text-3xl font-mono text-white font-bold mb-1">42</div>
             <div className="text-purple-400 text-xs flex items-center gap-1">
                <Brain size={12}/> Flagged by Agent Contradiction
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={48} className="text-sky-400"/>
             </div>
             <div className="text-slate-400 text-xs font-bold uppercase mb-1">System Reliability</div>
             <div className="text-3xl font-mono text-white font-bold mb-1">99.98%</div>
             <div className="text-sky-400 text-xs flex items-center gap-1">
                <Clock size={12}/> Mean Time To Recovery: 1.2m
             </div>
          </div>
        </div>

        {/* Charts Row 1: Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Active Learning Impact */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Target size={18} className="text-rose-400"/> Active Learning Efficiency
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Reduction in experiments needed to find first high-quality hit.</p>
                    </div>
                    <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700 text-xs text-slate-300">
                        Avg Experiments to Hit: <span className="text-rose-400 font-bold">~6 Batches (AI)</span> vs ~20+ (Random)
                    </div>
                </div>
                <div className="flex-1 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ACTIVE_LEARNING_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="batch" stroke="#64748b" fontSize={10} label={{ value: 'Experimental Batches', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                            <YAxis stroke="#64748b" fontSize={10} label={{ value: 'Cumulative Hits', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '12px' }}/>
                            <Line type="monotone" dataKey="Random" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" name="Random Selection" dot={false}/>
                            <Line type="monotone" dataKey="ActiveLearning" stroke="#f43f5e" strokeWidth={3} name="Active Learning (Helix)" activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Retrosynthesis Funnel */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Filter size={18} className="text-emerald-400"/> Candidate Feasibility Funnel
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">% of candidates discarded due to synthesis/cost constraints.</p>
                    </div>
                </div>
                <div className="flex-1 h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={CANDIDATE_FUNNEL_DATA} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="#64748b" fontSize={10} hide />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={120} tickLine={false} />
                            <Tooltip 
                                cursor={{fill: '#334155', opacity: 0.2}}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }}
                            />
                            <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                {CANDIDATE_FUNNEL_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Charts Row 2: Velocity & Quality */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Protocol Velocity */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 col-span-1">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400"/> Protocol Gen. Velocity
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={PROTOCOL_VELOCITY_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="task" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" height={40}/>
                            <YAxis stroke="#64748b" fontSize={10} label={{ value: 'Mins', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px' }}/>
                            <Bar dataKey="Manual" fill="#64748b" name="Manual Prep" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="AI" fill="#6366f1" name="AI Generated" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Model Quality */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 col-span-1">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-yellow-400"/> Model Calibration & Lift
                </h3>
                <div className="space-y-6">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs text-slate-500 uppercase font-bold">Calibration Error (ECE)</span>
                            <span className="text-xl font-mono text-emerald-400 font-bold">0.042</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[10%]"></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Top-decile performance (Low is better)</p>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs text-slate-500 uppercase font-bold">Hit-Rate Lift</span>
                            <span className="text-xl font-mono text-yellow-400 font-bold flex items-center gap-1">
                                <ChevronsUp size={16}/> +12.5%
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Improvement over baseline random screening</p>
                    </div>
                </div>
            </div>

            {/* Contradiction / Wasted Runs */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 col-span-1">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <AlertOctagon size={16} className="text-purple-400"/> Risk Mitigation
                </h3>
                <div className="h-32 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={CONTRADICTION_DATA}>
                            <defs>
                                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="prevented" stroke="#a855f7" fill="url(#colorPrev)" name="Runs Saved" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-xs text-slate-300 bg-purple-900/20 p-3 rounded border border-purple-900/50 leading-relaxed">
                    <span className="text-purple-400 font-bold">Insight:</span> The Multi-Agent contradiction detector prevented <strong>12 wasted runs</strong> on Wednesday due to conflicting toxicity data identified in literature.
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default PlatformAnalytics;
