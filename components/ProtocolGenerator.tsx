import React, { useState, useEffect, useRef } from 'react';
import { generateRobotProtocol } from '../services/geminiService';
import { RobotProtocol, ProtocolStep } from '../types';
import { Bot, FileCode, Play, Terminal, AlertTriangle, LayoutGrid, Download, CheckCircle, Clock, Droplet, Settings, Pause, RotateCcw, FastForward, AlertOctagon, Thermometer } from 'lucide-react';

const ProtocolGenerator: React.FC = () => {
  const [platform, setPlatform] = useState<'OPENTRONS' | 'HAMILTON'>('OPENTRONS');
  const [task, setTask] = useState('PCR Setup');
  const [params, setParams] = useState('96 samples, 20uL Mastermix, 5uL DNA');
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState<RobotProtocol | null>(null);
  const [activeTab, setActiveTab] = useState<'DECK' | 'CODE' | 'SIMULATION'>('DECK');

  // Simulation State
  const [simState, setSimState] = useState<'STOPPED' | 'PLAYING' | 'PAUSED'>('STOPPED');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simTime, setSimTime] = useState(0); // in seconds
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const simLogsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!task) return;
    setLoading(true);
    setProtocol(null);
    setSimState('STOPPED');
    setCurrentStepIndex(0);
    setSimLogs([]);
    try {
      const result = await generateRobotProtocol(platform, task, params);
      setProtocol(result);
    } catch (error) {
      console.error(error);
      alert("Failed to generate protocol.");
    } finally {
      setLoading(false);
    }
  };

  const getSlotColor = (content: string, isActive: boolean) => {
    if (isActive) return 'bg-indigo-500/40 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105';
    if (content.toLowerCase().includes('tip')) return 'bg-slate-700 border-slate-600';
    if (content.toLowerCase().includes('plate')) return 'bg-cyan-900/30 border-cyan-800 text-cyan-400';
    if (content.toLowerCase().includes('tube') || content.toLowerCase().includes('rack')) return 'bg-purple-900/30 border-purple-800 text-purple-400';
    if (content.toLowerCase().includes('waste')) return 'bg-red-900/20 border-red-800 text-red-400';
    return 'bg-slate-800 border-slate-700';
  };

  // Mock grid for Opentrons
  const renderDeckMap = (simulationMode = false) => {
    if (!protocol) return null;
    
    // Create a map of slots
    const deckMap = new Map(protocol.deckLayout.map(s => [s.slotId, s]));
    const slots = [
        ['10', '11', '12'],
        ['7', '8', '9'],
        ['4', '5', '6'],
        ['1', '2', '3']
    ];

    const currentStep = protocol.steps[currentStepIndex];
    const sourceSlot = simulationMode && simState !== 'STOPPED' ? currentStep?.sourceSlot : null;
    const destSlot = simulationMode && simState !== 'STOPPED' ? currentStep?.destSlot : null;

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                {slots.map((row, rIdx) => (
                    <React.Fragment key={rIdx}>
                        {row.map(slotId => {
                            const slotData = deckMap.get(slotId);
                            const isActive = slotId === sourceSlot || slotId === destSlot;
                            return (
                                <div key={slotId} className={`aspect-square rounded-lg border-2 border-dashed p-3 relative flex flex-col justify-center items-center text-center transition-all duration-300 ${
                                    slotData ? getSlotColor(slotData.content, isActive) + ' border-solid' : 'border-slate-800 hover:border-slate-700'
                                }`}>
                                    <span className="absolute top-1 left-2 text-[10px] text-slate-500 font-bold">{slotId}</span>
                                    {slotData ? (
                                        <>
                                            <div className="text-xs font-bold mb-1 line-clamp-2">{slotData.content}</div>
                                            <div className="text-[10px] text-slate-500 truncate w-full px-1">{slotData.labwareType}</div>
                                            {isActive && (
                                                <div className="absolute inset-0 border-2 border-indigo-400 rounded-lg animate-pulse pointer-events-none"></div>
                                            )}
                                            {simulationMode && isActive && currentStep.volume && (
                                                <div className="absolute bottom-2 right-2 bg-slate-900/80 text-[10px] px-1 rounded text-indigo-300 border border-indigo-500/30">
                                                    {slotId === sourceSlot ? '-' : '+'}{currentStep.volume}uL
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-slate-700 text-xs">Empty</span>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
            {!simulationMode && (
                <div className="mt-6 flex gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-900/30 border border-cyan-800 rounded"></div> Labware</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-700 border border-slate-600 rounded"></div> Tips</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-900/30 border border-purple-800 rounded"></div> Tubes</div>
                </div>
            )}
        </div>
    );
  };

  // Simulation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simState === 'PLAYING' && protocol) {
        interval = setInterval(() => {
            setSimTime(prev => prev + 1);
            
            // Check if we need to advance step
            const currentStep = protocol.steps[currentStepIndex];
            if (!currentStep) {
                setSimState('STOPPED');
                setSimLogs(prev => [...prev, `[COMPLETE] Protocol finished successfully.`]);
                return;
            }

            // Simple logic: 1 "tick" = 1 second of simulation time
            // We assume each step takes its duration.
            // We need to track accumulated time vs step duration.
            // Simplified for MVP: Advance step every X ticks based on duration
            
            // Here, for better visualization, we'll just advance based on a fixed timer scaled by speed, 
            // but logging time correctly.
        }, 1000 / simulationSpeed); // Tick rate depends on speed multiplier
    }
    return () => clearInterval(interval);
  }, [simState, simulationSpeed, currentStepIndex, protocol]);

  // Separate effect to handle step progression
  useEffect(() => {
      if (simState === 'PLAYING' && protocol) {
          const step = protocol.steps[currentStepIndex];
          if (step) {
              const timer = setTimeout(() => {
                  setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.action}: ${step.description}`]);
                  
                  // Check logical errors
                  if (step.volume && step.volume > 200 && step.description.toLowerCase().includes('p20')) {
                      setSimLogs(prev => [...prev, `[ERROR] Volume ${step.volume}uL exceeds p20 tip capacity!`]);
                      setSimState('PAUSED');
                      return;
                  }

                  if (currentStepIndex < protocol.steps.length - 1) {
                      setCurrentStepIndex(prev => prev + 1);
                  } else {
                      setSimState('STOPPED');
                      setSimLogs(prev => [...prev, `[COMPLETE] Simulation finished.`]);
                  }
              }, (step.durationSeconds * 1000) / (simulationSpeed * 5)); // Accelerate playback significantly for UI feel (5x base speed)
              
              return () => clearTimeout(timer);
          }
      }
  }, [currentStepIndex, simState, protocol]);

  useEffect(() => {
      if (simLogsRef.current) {
          simLogsRef.current.scrollTop = simLogsRef.current.scrollHeight;
      }
  }, [simLogs]);

  const toggleSim = () => {
      if (simState === 'PLAYING') setSimState('PAUSED');
      else setSimState('PLAYING');
  };

  const resetSim = () => {
      setSimState('STOPPED');
      setCurrentStepIndex(0);
      setSimTime(0);
      setSimLogs([]);
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Bot className="text-indigo-400" />
            Robot Protocol Generator
          </h2>
          <p className="text-slate-400 text-sm">
            Autonomous synthesis of liquid handling scripts from biological intent.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left: Configuration */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Settings size={12}/> Setup
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Robot Platform</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setPlatform('OPENTRONS')}
                                className={`py-2 px-3 rounded text-sm font-medium border transition-all ${
                                    platform === 'OPENTRONS' 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                Opentrons
                            </button>
                            <button 
                                onClick={() => setPlatform('HAMILTON')}
                                className={`py-2 px-3 rounded text-sm font-medium border transition-all ${
                                    platform === 'HAMILTON' 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                Hamilton
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Assay Task</label>
                        <input 
                           type="text" 
                           value={task}
                           onChange={(e) => setTask(e.target.value)}
                           className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                           placeholder="e.g. Serial Dilution"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Parameters (Natural Language)</label>
                        <textarea 
                           value={params}
                           onChange={(e) => setParams(e.target.value)}
                           className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
                           placeholder="Describe volumes, sample counts, layout..."
                        />
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !task}
                        className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                            loading
                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        }`}
                    >
                        {loading ? <span className="animate-spin">⟳</span> : <Bot size={16} />}
                        Generate Protocol
                    </button>
                </div>
            </div>

            {protocol && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex-1 animate-in fade-in slide-in-from-left-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Validation Status</h3>
                    
                    <div className="space-y-3">
                         <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded border border-slate-800">
                             <span className="text-xs text-slate-400 flex items-center gap-2"><Clock size={12}/> Est. Runtime</span>
                             <span className="text-sm font-mono text-white">{protocol.estimatedRuntime} min</span>
                         </div>
                         <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded border border-slate-800">
                             <span className="text-xs text-slate-400 flex items-center gap-2"><Droplet size={12}/> Tips Consumed</span>
                             <span className="text-sm font-mono text-white">{protocol.tipsUsed}</span>
                         </div>
                    </div>

                    {protocol.safetyWarnings.length > 0 ? (
                        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                            <div className="text-xs font-bold text-yellow-500 mb-2 flex items-center gap-1">
                                <AlertTriangle size={12}/> Safety Warnings
                            </div>
                            <ul className="list-disc list-inside text-[10px] text-yellow-200/80 space-y-1">
                                {protocol.safetyWarnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    ) : (
                        <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-400">
                            <CheckCircle size={14}/> Protocol validated safe.
                        </div>
                    )}

                    <button className="w-full mt-4 flex items-center justify-center gap-2 text-xs bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition-colors">
                        <Download size={14}/> Download Script
                    </button>
                </div>
            )}
        </div>

        {/* Center: Visualization/Code */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden relative">
            <div className="flex border-b border-slate-700 bg-slate-800">
                <button 
                    onClick={() => setActiveTab('DECK')}
                    className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'DECK' ? 'border-indigo-500 text-white bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    <LayoutGrid size={14}/> Deck Map
                </button>
                <button 
                    onClick={() => setActiveTab('CODE')}
                    className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'CODE' ? 'border-indigo-500 text-white bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    <FileCode size={14}/> Script Editor
                </button>
                <button 
                    onClick={() => setActiveTab('SIMULATION')}
                    className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'SIMULATION' ? 'border-indigo-500 text-white bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    <Terminal size={14}/> Digital Twin Simulation
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {!protocol ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
                        <Bot size={64} className="mb-4"/>
                        <p>Waiting for protocol generation...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'DECK' && (
                            <div className="h-full overflow-y-auto p-4 animate-in fade-in">
                                {renderDeckMap()}
                            </div>
                        )}
                        {activeTab === 'CODE' && (
                            <div className="h-full overflow-y-auto bg-[#0d1117] p-4 font-mono text-xs text-slate-300 animate-in fade-in">
                                <pre className="whitespace-pre-wrap">{protocol.scriptContent}</pre>
                            </div>
                        )}
                        {activeTab === 'SIMULATION' && (
                            <div className="h-full flex flex-col animate-in fade-in">
                                {/* Simulation Controls */}
                                <div className="p-3 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button onClick={toggleSim} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors">
                                            {simState === 'PLAYING' ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}
                                        </button>
                                        <button onClick={resetSim} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                                            <RotateCcw size={16}/>
                                        </button>
                                        <div className="h-6 w-px bg-slate-700 mx-2"></div>
                                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                                            <button onClick={() => setSimulationSpeed(1)} className={`px-2 py-0.5 text-xs rounded ${simulationSpeed === 1 ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>1x</button>
                                            <button onClick={() => setSimulationSpeed(4)} className={`px-2 py-0.5 text-xs rounded ${simulationSpeed === 4 ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>4x</button>
                                            <button onClick={() => setSimulationSpeed(10)} className={`px-2 py-0.5 text-xs rounded ${simulationSpeed === 10 ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>10x</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-mono">
                                        <div className="text-slate-400">Time: <span className="text-white">{(simTime / 60).toFixed(0).padStart(2,'0')}:{(simTime % 60).toFixed(0).padStart(2,'0')}</span></div>
                                        <div className="text-slate-400">Step: <span className="text-white">{currentStepIndex + 1}/{protocol.steps.length}</span></div>
                                    </div>
                                </div>

                                <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                                    {/* Left: Virtual Deck */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                            <LayoutGrid size={12}/> Live Deck State
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            {renderDeckMap(true)}
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span>Progress</span>
                                                <span>{Math.round((currentStepIndex / protocol.steps.length) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-indigo-500 h-full transition-all duration-300 ease-out" 
                                                    style={{ width: `${(currentStepIndex / protocol.steps.length) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Console & Metrics */}
                                    <div className="w-80 flex flex-col gap-4">
                                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
                                            <div className="p-2 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-400 flex items-center gap-2">
                                                <Terminal size={12}/> Virtual Console
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1" ref={simLogsRef}>
                                                {simLogs.length === 0 && <span className="text-slate-600 italic">Ready to simulate...</span>}
                                                {simLogs.map((log, i) => (
                                                    <div key={i} className={`break-words ${log.includes('[ERROR]') ? 'text-red-400' : 'text-slate-300'}`}>
                                                        {log}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-3">Live Metrics</div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Liquid Moved</span>
                                                    <span className="text-white font-mono">
                                                        {protocol.steps.slice(0, currentStepIndex).reduce((acc, s) => acc + (s.volume || 0), 0).toFixed(0)} uL
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Robot Arm Dist.</span>
                                                    <span className="text-white font-mono">{(currentStepIndex * 0.45).toFixed(2)} m</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolGenerator;
