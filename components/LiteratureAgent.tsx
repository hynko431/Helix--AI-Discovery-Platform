import React, { useState, useEffect, useRef } from 'react';
import { searchScientificLiterature } from '../services/geminiService';
import { SearchResult, MonitorConfig, MonitoringAlert } from '../types';
import { Search, BookOpen, ExternalLink, Globe, Radio, Bell, Plus, Trash2, FileText, Syringe, Lightbulb, Activity, Check, PauseCircle, PlayCircle, Filter } from 'lucide-react';

const INITIAL_MONITORS: MonitorConfig[] = [
  { id: 'm1', term: 'KRAS G12C Inhibitors', category: 'TARGET', status: 'ACTIVE', lastHit: '2m ago', totalHits: 142 },
  { id: 'm2', term: 'Non-Small Cell Lung Cancer', category: 'DISEASE', status: 'ACTIVE', lastHit: '5m ago', totalHits: 89 },
  { id: 'm3', term: 'Covalent Binding Kinetics', category: 'TARGET', status: 'PAUSED', lastHit: '2d ago', totalHits: 34 },
  { id: 'm4', term: 'Competitor X Pharma', category: 'COMPETITOR', status: 'ACTIVE', lastHit: '1h ago', totalHits: 12 }
];

const MOCK_ALERT_TEMPLATES = [
  { type: 'PAPER', source: 'Nature Medicine', title: 'Resistance mechanisms to covalent {term} revealed by single-cell sequencing' },
  { type: 'TRIAL', source: 'ClinicalTrials.gov', title: 'Phase 3 Study of {term} vs Docetaxel initiated' },
  { type: 'PATENT', source: 'WIPO / USPTO', title: 'Novel Macrocyclic Scaffolds for {term} Modulation' },
  { type: 'PAPER', source: 'Cell', title: 'Allosteric regulation of {term} signaling pathways' },
  { type: 'TRIAL', source: 'FDA Updates', title: 'Fast Track Designation granted for {term} candidate' },
  { type: 'PAPER', source: 'J. Med. Chem.', title: 'SAR optimization of potent {term} antagonists' }
];

const LiteratureAgent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'MONITOR'>('SEARCH');
  
  // Search State
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  // Monitor State
  const [monitors, setMonitors] = useState<MonitorConfig[]>(INITIAL_MONITORS);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [newMonitorTerm, setNewMonitorTerm] = useState('');
  const [monitoringActive, setMonitoringActive] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const data = await searchScientificLiterature(query);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Simulation of incoming alerts
  useEffect(() => {
    if (!monitoringActive) return;

    const interval = setInterval(() => {
      // 30% chance to trigger an alert per tick
      if (Math.random() > 0.7) {
        const activeMonitors = monitors.filter(m => m.status === 'ACTIVE');
        if (activeMonitors.length === 0) return;

        const randomMonitor = activeMonitors[Math.floor(Math.random() * activeMonitors.length)];
        const template = MOCK_ALERT_TEMPLATES[Math.floor(Math.random() * MOCK_ALERT_TEMPLATES.length)];
        const relevance = Math.floor(Math.random() * 40) + 60; // 60-99
        
        let impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (relevance > 90) impact = 'CRITICAL';
        else if (relevance > 80) impact = 'HIGH';
        else if (relevance > 70) impact = 'MEDIUM';

        const newAlert: MonitoringAlert = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString(),
          monitorTerm: randomMonitor.term,
          type: template.type as any,
          title: template.title.replace('{term}', randomMonitor.term.split(' ')[0]),
          source: template.source,
          relevanceScore: relevance,
          impact: impact,
          summary: 'Automated summary pending...',
          isNew: true
        };

        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
        
        // Update monitor hit count
        setMonitors(prev => prev.map(m => 
          m.id === randomMonitor.id ? { ...m, totalHits: m.totalHits + 1, lastHit: 'Just now' } : m
        ));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [monitoringActive, monitors]);

  // Remove "isNew" flag after animation
  useEffect(() => {
    if (alerts.length > 0 && alerts[0].isNew) {
      const timer = setTimeout(() => {
        setAlerts(prev => prev.map(a => ({ ...a, isNew: false })));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [alerts]);

  const addMonitor = () => {
    if (!newMonitorTerm) return;
    const newMonitor: MonitorConfig = {
      id: Math.random().toString(36).substring(7),
      term: newMonitorTerm,
      category: 'TARGET', // Default
      status: 'ACTIVE',
      lastHit: '-',
      totalHits: 0
    };
    setMonitors([...monitors, newMonitor]);
    setNewMonitorTerm('');
  };

  const toggleMonitorStatus = (id: string) => {
    setMonitors(prev => prev.map(m => 
      m.id === id ? { ...m, status: m.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : m
    ));
  };

  const deleteMonitor = (id: string) => {
    setMonitors(prev => prev.filter(m => m.id !== id));
  };

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'CRITICAL': return 'text-red-400 bg-red-900/30 border-red-700/50';
      case 'HIGH': return 'text-orange-400 bg-orange-900/30 border-orange-700/50';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
      case 'LOW': return 'text-blue-400 bg-blue-900/30 border-blue-700/50';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header & Tabs */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <BookOpen className="text-emerald-400" />
            Literature & Evidence Scout
          </h2>
          <p className="text-slate-400 text-sm">
            Real-time analysis of global research repositories using semantic search.
          </p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
          <button 
            onClick={() => setActiveTab('SEARCH')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'SEARCH' 
              ? 'bg-emerald-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search size={16} /> Deep Search
          </button>
          <button 
            onClick={() => setActiveTab('MONITOR')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'MONITOR' 
              ? 'bg-emerald-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio size={16} className={monitoringActive ? "animate-pulse" : ""} /> Live Surveillance
          </button>
        </div>
      </div>

      {/* --- TAB: DEEP SEARCH --- */}
      {activeTab === 'SEARCH' && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4">
          <form onSubmit={handleSearch} className="relative mb-8 flex-shrink-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for mechanisms, compounds, or clinical trial data..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-12 pr-32 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-xl"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <button
              type="submit"
              disabled={loading || !query}
              className="absolute right-2 top-2 bottom-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium px-4 rounded-lg transition-colors border border-slate-700"
            >
              {loading ? 'Scanning...' : 'Analyze'}
            </button>
          </form>

          {result ? (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-emerald-400" />
                  Synthesis of Findings
                </h3>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                  {result.summary.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-3">{paragraph}</p>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                  Validated Sources ({result.sources.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-slate-800 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-lg transition-all hover:bg-slate-800/80 group"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-emerald-100 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                          {source.title}
                        </h4>
                        <ExternalLink size={14} className="text-slate-500 mt-1 flex-shrink-0" />
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">
                          {source.source}
                        </span>
                        <span>Relevance: High</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50">
                <Search size={64} className="mb-4" />
                <p>Awaiting query...</p>
              </div>
            )
          )}
        </div>
      )}

      {/* --- TAB: LIVE SURVEILLANCE --- */}
      {activeTab === 'MONITOR' && (
        <div className="flex-1 flex gap-6 overflow-hidden animate-in fade-in slide-in-from-right-4">
          
          {/* Left: Monitor Manager */}
          <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                   <Activity size={18} className="text-emerald-400"/> Active Sentinels
                </h3>
                <button onClick={() => setMonitoringActive(!monitoringActive)} className="text-slate-400 hover:text-white transition-colors">
                   {monitoringActive ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                </button>
             </div>
             
             <div className="p-3 border-b border-slate-800 bg-slate-800/20">
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={newMonitorTerm}
                      onChange={(e) => setNewMonitorTerm(e.target.value)}
                      placeholder="Add keyword..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                   />
                   <button 
                      onClick={addMonitor}
                      disabled={!newMonitorTerm}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      <Plus size={16} />
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {monitors.map(monitor => (
                   <div key={monitor.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 group">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${monitor.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                            <span className="font-medium text-slate-200 text-sm">{monitor.term}</span>
                         </div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => toggleMonitorStatus(monitor.id)} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                                {monitor.status === 'ACTIVE' ? <PauseCircle size={14}/> : <PlayCircle size={14}/>}
                             </button>
                             <button onClick={() => deleteMonitor(monitor.id)} className="p-1 hover:bg-red-900/50 rounded text-red-400">
                                <Trash2 size={14}/>
                             </button>
                         </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                         <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/50">{monitor.category}</span>
                         <span>{monitor.totalHits} hits • {monitor.lastHit}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Right: Intelligence Feed */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
             <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center z-10">
                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                   <Bell size={18} className="text-emerald-400"/> Intelligence Stream
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> PubMed
                    </span>
                    <span className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> USPTO
                    </span>
                    <span className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> ClinicalTrials
                    </span>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-3 relative" ref={feedRef}>
                {alerts.length === 0 && (
                   <div className="absolute inset-0 flex items-center justify-center text-slate-600 flex-col">
                      <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                      <p>Initializing surveillance nodes...</p>
                   </div>
                )}
                
                {alerts.map(alert => (
                   <div 
                      key={alert.id} 
                      className={`
                        bg-slate-800 border rounded-lg p-4 transition-all duration-500
                        ${alert.isNew ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] translate-x-2' : 'border-slate-700/50'}
                      `}
                   >
                      <div className="flex justify-between items-start mb-1">
                         <div className="flex items-center gap-2 mb-1">
                            <span className={`p-1.5 rounded-md ${
                               alert.type === 'PAPER' ? 'bg-emerald-900/30 text-emerald-400' :
                               alert.type === 'TRIAL' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'
                            }`}>
                               {alert.type === 'PAPER' && <FileText size={14} />}
                               {alert.type === 'TRIAL' && <Syringe size={14} />}
                               {alert.type === 'PATENT' && <Lightbulb size={14} />}
                            </span>
                            <span className="text-xs font-mono text-slate-400">{alert.source}</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">{alert.timestamp}</span>
                         </div>
                         <div className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getImpactColor(alert.impact)}`}>
                            {alert.impact} Impact
                         </div>
                      </div>

                      <h4 className="text-sm font-medium text-slate-200 mb-2 leading-snug hover:text-emerald-400 cursor-pointer transition-colors">
                         {alert.title}
                      </h4>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                          <div className="flex items-center gap-2 text-xs">
                             <span className="text-slate-500">Trigger:</span>
                             <span className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">{alert.monitorTerm}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Relevance</span>
                              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                                    style={{ width: `${alert.relevanceScore}%` }}
                                  ></div>
                              </div>
                              <span className="text-xs font-mono text-emerald-400">{alert.relevanceScore}%</span>
                          </div>
                      </div>
                   </div>
                ))}
             </div>
             
             {/* Gradient overlay for scrolling effect */}
             <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiteratureAgent;