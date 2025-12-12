import React, { useState, useEffect, useRef } from 'react';
import { Database, Shield, Lock, Server, Activity, FileKey, Globe, RefreshCw, CheckCircle, AlertOctagon, EyeOff, Key } from 'lucide-react';

interface Connector {
  id: string;
  name: string;
  type: 'INTERNAL_ELN' | 'CRO_PORTAL' | 'PATIENT_REGISTRY' | 'PUBLIC_DB';
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  privacyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  protocol: 'Federated' | 'Direct' | 'Tokenized';
  lastSync: string;
  privacyBudgetUsed: number; // Percentage for differential privacy
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'SUCCESS' | 'BLOCKED' | 'WARNING';
  details: string;
}

const INITIAL_CONNECTORS: Connector[] = [
  {
    id: 'conn-001',
    name: 'Merck-Internal-ELN-04',
    type: 'INTERNAL_ELN',
    status: 'CONNECTED',
    privacyLevel: 'MEDIUM',
    protocol: 'Direct',
    lastSync: 'Just now',
    privacyBudgetUsed: 12
  },
  {
    id: 'conn-002',
    name: 'WuXi AppTec Portal (CRO)',
    type: 'CRO_PORTAL',
    status: 'CONNECTED',
    privacyLevel: 'HIGH',
    protocol: 'Federated',
    lastSync: '5 mins ago',
    privacyBudgetUsed: 45
  },
  {
    id: 'conn-003',
    name: 'Global Oncology Registry',
    type: 'PATIENT_REGISTRY',
    status: 'SYNCING',
    privacyLevel: 'HIGH',
    protocol: 'Tokenized',
    lastSync: 'Syncing...',
    privacyBudgetUsed: 88
  },
  {
    id: 'conn-004',
    name: 'ChEMBL Public Node',
    type: 'PUBLIC_DB',
    status: 'DISCONNECTED',
    privacyLevel: 'LOW',
    protocol: 'Direct',
    lastSync: '2 days ago',
    privacyBudgetUsed: 0
  }
];

const DataConnectors: React.FC = () => {
  const [connectors, setConnectors] = useState<Connector[]>(INITIAL_CONNECTORS);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Simulate real-time audit logs
  useEffect(() => {
    const actions = [
      { action: 'Policy Check', details: 'Verifying IAM roles for User-8821' },
      { action: 'Token Exchange', details: 'Refreshing ephemeral keys with CRO Node' },
      { action: 'Federated Query', details: 'Aggregating toxicity data (n=4050)' },
      { action: 'Diff. Privacy', details: 'Adding Laplacian noise to result set' },
      { action: 'Data Masking', details: 'Redacting PII from patient cohort A' }
    ];

    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const newLog: AuditLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString(),
        action: randomAction.action,
        status: Math.random() > 0.9 ? 'WARNING' : 'SUCCESS',
        details: randomAction.details
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const toggleConnection = (id: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: c.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED',
          lastSync: c.status === 'CONNECTED' ? c.lastSync : 'Connecting...'
        };
      }
      return c;
    }));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'CONNECTED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'SYNCING': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'DISCONNECTED': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 p-1 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Shield className="text-indigo-400" />
            Federated Data & Privacy
          </h2>
          <p className="text-slate-400 text-sm">
            Secure, zero-trust connectors to internal ELNs, CRO portals, and private cohorts.
          </p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20 font-medium text-sm">
                <Database size={16} />
                Add Connector
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Column: Connectors Grid */}
        <div className="lg:col-span-2 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-4">
                {connectors.map(connector => (
                    <div key={connector.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center justify-between group hover:border-slate-600 transition-all">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg border ${
                                connector.type === 'INTERNAL_ELN' ? 'bg-cyan-900/30 border-cyan-700/50 text-cyan-400' :
                                connector.type === 'CRO_PORTAL' ? 'bg-purple-900/30 border-purple-700/50 text-purple-400' :
                                connector.type === 'PATIENT_REGISTRY' ? 'bg-rose-900/30 border-rose-700/50 text-rose-400' :
                                'bg-slate-700/30 border-slate-600 text-slate-400'
                            }`}>
                                {connector.type === 'INTERNAL_ELN' && <Server size={24} />}
                                {connector.type === 'CRO_PORTAL' && <Globe size={24} />}
                                {connector.type === 'PATIENT_REGISTRY' && <EyeOff size={24} />}
                                {connector.type === 'PUBLIC_DB' && <Database size={24} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-white text-lg">{connector.name}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase tracking-wider ${getStatusColor(connector.status)}`}>
                                        {connector.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Lock size={12} className="text-slate-500" />
                                        {connector.protocol}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Activity size={12} className="text-slate-500" />
                                        Sync: {connector.lastSync}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <button 
                                onClick={() => toggleConnection(connector.id)}
                                className={`p-2 rounded-lg border transition-all ${
                                    connector.status === 'CONNECTED' || connector.status === 'SYNCING'
                                    ? 'bg-slate-800 border-slate-700 text-red-400 hover:bg-red-950/30 hover:border-red-900/50'
                                    : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
                                }`}
                            >
                                <RefreshCw size={18} className={connector.status === 'SYNCING' ? 'animate-spin' : ''} />
                            </button>
                            
                            {/* Privacy Budget Indicator */}
                            {connector.status !== 'DISCONNECTED' && (
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Privacy Budget</div>
                                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                connector.privacyBudgetUsed > 80 ? 'bg-red-500' :
                                                connector.privacyBudgetUsed > 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${connector.privacyBudgetUsed}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Info Card */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 border-dashed">
                    <div className="flex gap-4">
                        <div className="p-2 bg-indigo-500/10 rounded-lg h-fit">
                            <FileKey className="text-indigo-400" size={20} />
                        </div>
                        <div>
                            <h4 className="text-indigo-300 font-medium mb-1">Zero-Copy Federated Access</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Helix utilizes a federated query engine. Raw data remains resident on source systems (ELNs, CROs). 
                                Only aggregated, differential-privacy compliant insights are transmitted to this dashboard. 
                                No PII or IP-sensitive raw data is cached.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Security & Audit */}
        <div className="flex flex-col gap-6">
            {/* Security Stats */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                    <Key size={18} className="text-emerald-400" />
                    Security Posture
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <span className="text-slate-400 text-sm">Policy Enforced</span>
                        <span className="text-emerald-400 font-mono text-sm">Strict (L4)</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <span className="text-slate-400 text-sm">Encryption</span>
                        <span className="text-white font-mono text-sm">AES-256-GCM</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <span className="text-slate-400 text-sm">Token Rotation</span>
                        <span className="text-white font-mono text-sm">Every 15m</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Audit Compliance</span>
                        <span className="text-white font-mono text-sm">GxP / HIPAA</span>
                    </div>
                </div>
            </div>

            {/* Live Audit Log */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                <div className="p-3 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={14} className="text-indigo-400" /> Live Audit Stream
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono" ref={logContainerRef}>
                    {logs.map(log => (
                        <div key={log.id} className="text-xs p-2 rounded bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-500">{log.timestamp}</span>
                                <span className={
                                    log.status === 'SUCCESS' ? 'text-emerald-500' : 
                                    log.status === 'WARNING' ? 'text-yellow-500' : 'text-red-500'
                                }>
                                    {log.status === 'SUCCESS' ? <CheckCircle size={10} /> : <AlertOctagon size={10} />}
                                </span>
                            </div>
                            <div className="text-indigo-300 font-bold mb-0.5">{log.action}</div>
                            <div className="text-slate-400 leading-tight">{log.details}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DataConnectors;
