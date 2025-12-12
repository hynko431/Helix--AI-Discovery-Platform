import React, { useState } from 'react';
import { generatePackageManifest } from '../services/geminiService';
import { ExperimentData, PackageManifest } from '../types';
import { Package, Box, FileText, Lock, Globe, Terminal, Download, PlayCircle, Eye, EyeOff, CheckCircle, RefreshCw, FileCode } from 'lucide-react';

const MOCK_EXPERIMENTS: ExperimentData[] = [
  { id: 'exp-001', name: 'KRAS-G12C Binding Affinity Screen', date: '2023-11-15', description: 'High-throughput screening of 5000 compounds against KRAS G12C mutant.', framework: 'PyTorch', datasets: ['bindingdb_v2', 'internal_kras_library'], status: 'COMPLETED' },
  { id: 'exp-002', name: 'Toxicity Prediction Ensemble', date: '2023-11-20', description: 'Ensemble model predicting hepatotoxicity from molecular structure.', framework: 'Scikit-Learn', datasets: ['tox21', 'internal_admet'], status: 'COMPLETED' },
  { id: 'exp-003', name: 'AlphaFold Structure Prediction', date: '2023-11-22', description: 'Structure prediction for novel target candidate NX-552.', framework: 'JAX', datasets: ['pdb_snapshot'], status: 'COMPLETED' },
];

const ReproducibilityStudio: React.FC = () => {
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentData | null>(null);
  const [privacyLevel, setPrivacyLevel] = useState<'PUBLIC' | 'RESTRICTED'>('RESTRICTED');
  const [includeArtifacts, setIncludeArtifacts] = useState(true);
  const [baseImage, setBaseImage] = useState('pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime');
  
  const [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<PackageManifest | null>(null);
  const [activeTab, setActiveTab] = useState<'README' | 'DOCKER' | 'REQ'>('README');

  const handleGenerate = async () => {
    if (!selectedExperiment) return;
    setLoading(true);
    setManifest(null);
    try {
      const context = `Framework: ${selectedExperiment.framework}. Datasets: ${selectedExperiment.datasets.join(', ')}. Description: ${selectedExperiment.description}`;
      const result = await generatePackageManifest(selectedExperiment.name, context, privacyLevel);
      setManifest(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate package.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Package className="text-cyan-400" />
            Reproducibility Studio
          </h2>
          <p className="text-slate-400 text-sm">
            Containerize experiments for transparent peer validation and community sharing.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Configuration Panel */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            
            {/* Experiment Selector */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Box size={14}/> Select Experiment
                </h3>
                <div className="space-y-2">
                    {MOCK_EXPERIMENTS.map(exp => (
                        <div 
                            key={exp.id}
                            onClick={() => setSelectedExperiment(exp)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedExperiment?.id === exp.id 
                                ? 'bg-cyan-900/20 border-cyan-500/50 shadow-md' 
                                : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                            }`}
                        >
                            <div className="text-sm font-bold text-slate-200 mb-1 line-clamp-1">{exp.name}</div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                                <span>{exp.date}</span>
                                <span className="uppercase">{exp.framework}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Package Config */}
            {selectedExperiment && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex-1 flex flex-col animate-in fade-in slide-in-from-left-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Terminal size={14}/> Build Configuration
                    </h3>
                    
                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="text-xs text-slate-400 block mb-2">Data Privacy</label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                                <button 
                                    onClick={() => setPrivacyLevel('RESTRICTED')}
                                    className={`flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition-all ${
                                        privacyLevel === 'RESTRICTED' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <Lock size={12}/> Restricted
                                </button>
                                <button 
                                    onClick={() => setPrivacyLevel('PUBLIC')}
                                    className={`flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition-all ${
                                        privacyLevel === 'PUBLIC' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <Globe size={12}/> Public
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                {privacyLevel === 'RESTRICTED' 
                                    ? "PII/IP will be redacted. Synthetic data placeholders used." 
                                    : "Full raw datasets included. Use only for open source data."}
                            </p>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Base Environment</label>
                            <input 
                                type="text" 
                                value={baseImage}
                                onChange={(e) => setBaseImage(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIncludeArtifacts(!includeArtifacts)}
                                className={`w-10 h-6 rounded-full transition-colors relative ${includeArtifacts ? 'bg-cyan-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${includeArtifacts ? 'translate-x-4' : ''}`}></div>
                            </button>
                            <span className="text-xs text-slate-300">Include Model Weights</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`w-full mt-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            loading
                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        }`}
                    >
                        {loading ? <RefreshCw size={16} className="animate-spin"/> : <Package size={16}/>}
                        {loading ? 'Packaging...' : 'Generate Package'}
                    </button>
                </div>
            )}
        </div>

        {/* Center: Preview Panel */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('README')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${activeTab === 'README' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <FileText size={14}/> README.md
                    </button>
                    <button 
                        onClick={() => setActiveTab('DOCKER')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${activeTab === 'DOCKER' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Box size={14}/> Dockerfile
                    </button>
                    <button 
                        onClick={() => setActiveTab('REQ')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${activeTab === 'REQ' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <FileCode size={14}/> requirements.txt
                    </button>
                </div>
                {manifest && (
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center gap-2 transition-colors">
                            <PlayCircle size={14}/> Launch Binder
                        </button>
                        <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold flex items-center gap-2 transition-colors">
                            <Download size={14}/> Export .zip
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto bg-[#0d1117] p-6 relative">
                {!manifest ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-60">
                        <Package size={64} className="mb-4 text-slate-700"/>
                        <p>Configure and generate package to preview artifacts</p>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-sm max-w-none font-mono text-xs">
                        {activeTab === 'README' && (
                            <div className="font-sans whitespace-pre-wrap">{manifest.readme}</div>
                        )}
                        {activeTab === 'DOCKER' && (
                            <pre className="text-green-400">{manifest.dockerfile}</pre>
                        )}
                        {activeTab === 'REQ' && (
                            <pre className="text-blue-300">{manifest.requirements}</pre>
                        )}
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ReproducibilityStudio;
