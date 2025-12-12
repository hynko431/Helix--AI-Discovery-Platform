import React, { useState, useEffect, useRef } from 'react';
import { analyzeQCResult, suggestIntervention } from '../services/geminiService';
import { ExecutionLog, ExecutionStep, TelemetryPoint, InterventionRequest } from '../types';
import { Activity, Play, Pause, Square, AlertOctagon, CheckCircle, Thermometer, Waves, Droplet, UserCheck, RefreshCw, Terminal, Eye, Brain, Box, Shield, CheckSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const INITIAL_STEPS: ExecutionStep[] = [
  { id: 's1', name: 'Initialize Deck & Calibrate', status: 'PENDING', type: 'TRANSPORT', duration: 120 },
  { id: 's2', name: 'Reagent Aspiration (Source)', status: 'PENDING', type: 'LIQUID', duration: 45 },
  { id: 's3', name: 'Dispense to Target Plate', status: 'PENDING', type: 'LIQUID', duration: 60 },
  { id: 's4', name: 'Orbital Mixing', status: 'PENDING', type: 'LIQUID', duration: 30 },
  { id: 's5', name: 'QC Check: Volume Verification', status: 'PENDING', type: 'QC_CHECK', duration: 10 },
  { id: 's6', name: 'Incubation @ 37°C', status: 'PENDING', type: 'INCUBATE', duration: 180 },
  { id: 's7', name: 'Read Absorbance (OD600)', status: 'PENDING', type: 'MEASURE', duration: 20 },
  { id: 's8', name: 'Finalize & Archive', status: 'PENDING', type: 'TRANSPORT', duration: 30 },
];

const AutonomousLab: React.FC = () => {
  const [runStatus, setRunStatus] = useState<'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ERROR'>('IDLE');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [steps, setSteps] = useState<ExecutionStep[]>(INITIAL_STEPS);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [intervention, setIntervention] = useState<InterventionRequest | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const [safetyChecks, setSafetyChecks] = useState({ deck: false, reagents: false, interlock: false });
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, level: ExecutionLog['level'] = 'INFO') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    }].slice(-50)); // Keep last 50
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Telemetry Simulation Loop
  useEffect(() => {
    if (runStatus !== 'RUNNING') return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        const lastTime = prev.length > 0 ? new Date(prev[prev.length - 1].time).getTime() : Date.now();
        const newTime = new Date(Date.now());
        
        // Simulate data
        const temp = 37 + (Math.random() - 0.5) * 0.5; // 37 +/- 0.25
        const rpm = activeStepIndex === 3 ? 800 + (Math.random() - 0.5) * 20 : 0;
        const turbidity = activeStepIndex >= 6 ? 0.45 + (Math.random() * 0.1) : 0.05;

        return [...prev, { 
            time: newTime.toLocaleTimeString(), 
            temp, 
            shakerRpm: rpm, 
            turbidity 
        }].slice(-30); // Keep last 30 points
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [runStatus, activeStepIndex]);

  // Main Execution Loop
  useEffect(() => {
    let stepTimer: NodeJS.Timeout;

    if (runStatus === 'RUNNING' && !intervention && !analyzing && !awaitingAuth) {
        if (activeStepIndex >= steps.length) {
            setRunStatus('COMPLETED');
            addLog("Protocol completed successfully.", 'SUCCESS');
            return;
        }

        const currentStep = steps[activeStepIndex];

        // Start step if pending
        if (currentStep.status === 'PENDING') {
            setSteps(prev => prev.map((s, i) => i === activeStepIndex ? { ...s, status: 'RUNNING' } : s));
            addLog(`Started: ${currentStep.name}`);
        }

        // --- QC CHECK LOGIC ---
        if (currentStep.type === 'QC_CHECK' && currentStep.status === 'RUNNING') {
             setRunStatus('PAUSED'); // Pause for AI Analysis
             setAnalyzing(true);
             addLog("Initiating AI QC Analysis...", 'INFO');
             
             // Simulate a reading (pass or fail random)
             const measuredVolume = Math.random() > 0.3 ? 19.8 : 14.2; // 30% chance of failure for demo
             
             analyzeQCResult("Pipette Volume", measuredVolume, "Expected 20uL +/- 5%")
                .then(result => {
                    setAnalyzing(false);
                    if (result.result === 'PASS') {
                        addLog(`QC Passed: ${result.reasoning}`, 'SUCCESS');
                        setSteps(prev => prev.map((s, i) => i === activeStepIndex ? { ...s, status: 'COMPLETED' } : s));
                        setActiveStepIndex(prev => prev + 1);
                        setRunStatus('RUNNING');
                    } else {
                        addLog(`QC Failed: ${result.reasoning}`, 'ERROR');
                        setSteps(prev => prev.map((s, i) => i === activeStepIndex ? { ...s, status: 'FAILED' } : s));
                        // Trigger Intervention
                        setIntervention({
                            id: 'int-1',
                            type: 'QC_FAILURE',
                            title: 'Volume Check Failed',
                            description: result.reasoning,
                            suggestedActions: ['Retry Step', 'Skip Well', 'Abort Run'],
                            severity: result.result === 'FAIL' ? 'CRITICAL' : 'MEDIUM',
                            dataSnapshot: `Measured: ${measuredVolume.toFixed(1)}uL`
                        });
                    }
                });
             return; // Halt loop
        }

        // --- SIMULATED HARDWARE ERROR ---
        // 1% chance per tick of hardware error
        if (Math.random() < 0.005 && currentStep.status === 'RUNNING') {
             setRunStatus('ERROR');
             setAnalyzing(true); // "Thinking"
             addLog("Hardware Anomaly Detected. Analyzing...", 'ERROR');
             
             suggestIntervention("Pressure Sensor Outlier", "Aspiration pressure dropped to 0 during liquid handling.")
                .then(res => {
                    setAnalyzing(false);
                    setIntervention({
                        id: 'int-hw-1',
                        type: 'HARDWARE_ERROR',
                        title: res.title,
                        description: res.description,
                        suggestedActions: res.suggestedActions,
                        severity: res.severity
                    });
                });
             return;
        }

        // --- NORMAL STEP PROGRESSION ---
        // Simulate step completion based on duration (speed up for demo: 1s real = 10s sim)
        stepTimer = setTimeout(() => {
             setSteps(prev => prev.map((s, i) => i === activeStepIndex ? { ...s, status: 'COMPLETED' } : s));
             addLog(`Completed: ${currentStep.name}`, 'SUCCESS');
             setActiveStepIndex(prev => prev + 1);
        }, (currentStep.duration || 10) * 100); // 100ms per "unit"
    }

    return () => clearTimeout(stepTimer);
  }, [runStatus, activeStepIndex, intervention, analyzing, awaitingAuth]);

  const handleStartRequest = () => {
    if (runStatus === 'IDLE' || runStatus === 'COMPLETED') {
        // Prepare for HITL Verification
        setAwaitingAuth(true);
        setSafetyChecks({ deck: false, reagents: false, interlock: false });
    } else {
        // Resume
        setRunStatus('RUNNING');
    }
  };

  const confirmStart = () => {
      setAwaitingAuth(false);
      // Reset if needed
      if (runStatus === 'COMPLETED') {
          setSteps(INITIAL_STEPS);
          setActiveStepIndex(0);
          setTelemetry([]);
          setLogs([]);
      }
      setRunStatus('RUNNING');
      addLog("Human authorization received. Execution started.", 'SUCCESS');
  };

  const handleInterventionDecision = (action: string) => {
      addLog(`User Action: ${action}`, 'WARNING');
      setIntervention(null);
      
      if (action.toLowerCase().includes('abort')) {
          setRunStatus('IDLE');
          addLog("Protocol aborted by user.", 'ERROR');
      } else if (action.toLowerCase().includes('retry')) {
          // Reset current step
          setSteps(prev => prev.map((s, i) => i === activeStepIndex ? { ...s, status: 'PENDING' } : s));
          setRunStatus('RUNNING');
      } else if (action.toLowerCase().includes('skip')) {
          setSteps(prev => prev.map((s, i) => i === activeStepIndex ? { ...s, status: 'SKIPPED' } : s));
          setActiveStepIndex(prev => prev + 1);
          setRunStatus('RUNNING');
      } else {
          // Manual continue
          setRunStatus('RUNNING');
      }
  };

  const allChecksPassed = safetyChecks.deck && safetyChecks.reagents && safetyChecks.interlock;

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden relative">
      {/* Top Control Bar */}
      <div className="mb-4 bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
         <div className="flex items-center gap-4">
             <div className="p-2 bg-indigo-900/30 rounded-lg">
                 <Activity className="text-indigo-400" size={24} />
             </div>
             <div>
                 <h2 className="text-lg font-bold text-white leading-tight">Autonomous Lab Supervisor</h2>
                 <div className="flex items-center gap-2 text-xs">
                     <span className={`flex items-center gap-1 font-bold ${
                         runStatus === 'RUNNING' ? 'text-emerald-400' :
                         runStatus === 'ERROR' ? 'text-red-400' :
                         runStatus === 'PAUSED' ? 'text-yellow-400' : 'text-slate-400'
                     }`}>
                         {runStatus === 'RUNNING' && <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                         {runStatus}
                     </span>
                     <span className="text-slate-600">|</span>
                     <span className="text-slate-400">Node: Helix-One (London)</span>
                 </div>
             </div>
         </div>
         
         <div className="flex gap-3">
             {intervention ? (
                 <button disabled className="px-6 py-2 bg-red-600/20 border border-red-500 text-red-400 rounded-lg font-bold text-sm animate-pulse flex items-center gap-2">
                     <UserCheck size={18} /> Awaiting Decision
                 </button>
             ) : (
                 <>
                    {runStatus === 'RUNNING' ? (
                        <button onClick={() => setRunStatus('PAUSED')} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                            <Pause size={18} /> Pause
                        </button>
                    ) : (
                        <button onClick={handleStartRequest} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                            <Play size={18} /> {runStatus === 'IDLE' || runStatus === 'COMPLETED' ? 'Start Run' : 'Resume'}
                        </button>
                    )}
                 </>
             )}
             <button onClick={() => {setRunStatus('IDLE'); addLog("Emergency Stop Triggered", 'ERROR');}} className="px-4 py-2 bg-red-900/30 border border-red-800 text-red-400 hover:bg-red-900/50 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                 <Square size={14} fill="currentColor" /> E-Stop
             </button>
         </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left: Steps Timeline */}
          <div className="w-72 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-800 bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Execution Plan
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {steps.map((step, idx) => (
                     <div key={step.id} className={`relative pl-6 border-l-2 ${
                         idx === activeStepIndex && runStatus === 'RUNNING' ? 'border-emerald-500' :
                         step.status === 'COMPLETED' ? 'border-indigo-500' :
                         step.status === 'FAILED' ? 'border-red-500' : 'border-slate-700'
                     }`}>
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${
                             idx === activeStepIndex && runStatus === 'RUNNING' ? 'bg-slate-900 border-emerald-500 animate-pulse' :
                             step.status === 'COMPLETED' ? 'bg-indigo-500 border-indigo-500' :
                             step.status === 'FAILED' ? 'bg-red-500 border-red-500' : 'bg-slate-900 border-slate-600'
                        }`}></div>
                        
                        <div className={`p-3 rounded-lg border text-sm transition-all ${
                            idx === activeStepIndex ? 'bg-slate-800 border-emerald-500/50 shadow-lg' : 'bg-slate-900/50 border-slate-800'
                        }`}>
                            <div className="font-bold text-slate-200 mb-1">{step.name}</div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className={`uppercase font-bold ${
                                    step.status === 'RUNNING' ? 'text-emerald-400' :
                                    step.status === 'FAILED' ? 'text-red-400' : 'text-slate-500'
                                }`}>{step.status}</span>
                                <span className="text-slate-600">{step.type}</span>
                            </div>
                        </div>
                     </div>
                 ))}
             </div>
          </div>

          {/* Center: Live Monitor */}
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
             {/* Digital Twin / Visualization Placeholder */}
             <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl relative overflow-hidden flex flex-col">
                 <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
                 <div className="p-4 flex justify-between items-center border-b border-slate-700 bg-slate-800/80 z-10">
                    <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                        <Eye size={16} className="text-indigo-400"/> Live Digital Twin
                    </h3>
                    <div className="text-xs text-slate-400 font-mono">Cam-01: ONLINE</div>
                 </div>
                 
                 <div className="flex-1 flex items-center justify-center relative">
                     {/* Placeholder Animation for Robot Arm */}
                     {runStatus === 'RUNNING' ? (
                         <div className="relative w-64 h-64 border-4 border-slate-700 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-600 rounded-full"></div>
                             <div className="w-48 h-1 bg-indigo-500 absolute top-1/2 left-1/2 origin-left animate-[spin_3s_linear_infinite]"></div>
                             <div className="absolute w-full h-full border border-indigo-500/20 rounded-full animate-ping"></div>
                         </div>
                     ) : (
                         <div className="text-slate-600 flex flex-col items-center">
                             <Box size={48} className="mb-2 opacity-50"/>
                             <p>System Idle</p>
                         </div>
                     )}
                     
                     {/* Overlay for Intervention */}
                     {intervention && (
                         <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in">
                             <div className="bg-slate-900 border border-red-500 rounded-xl p-6 max-w-md w-full shadow-2xl">
                                 <div className="flex items-center gap-3 mb-4">
                                     <div className="p-3 bg-red-900/30 rounded-full border border-red-800">
                                        <AlertOctagon size={24} className="text-red-500" />
                                     </div>
                                     <div>
                                         <h3 className="text-xl font-bold text-white">Intervention Required</h3>
                                         <p className="text-red-400 text-sm font-mono">{intervention.type} • {intervention.severity}</p>
                                     </div>
                                 </div>
                                 
                                 <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6">
                                     <h4 className="text-sm font-bold text-slate-300 mb-1">{intervention.title}</h4>
                                     <p className="text-xs text-slate-400 mb-2">{intervention.description}</p>
                                     {intervention.dataSnapshot && (
                                         <div className="text-xs font-mono text-indigo-400 bg-indigo-900/20 p-2 rounded">{intervention.dataSnapshot}</div>
                                     )}
                                 </div>

                                 <div className="space-y-2">
                                     <div className="text-xs font-bold text-slate-500 uppercase">AI Suggested Actions</div>
                                     {intervention.suggestedActions.map((action, i) => (
                                         <button 
                                            key={i}
                                            onClick={() => handleInterventionDecision(action)}
                                            className="w-full text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 text-sm text-white transition-all flex justify-between items-center group"
                                         >
                                            {action}
                                            <Brain size={14} className="text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         </div>
                     )}

                     {analyzing && (
                         <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-indigo-500/50 rounded-lg p-3 flex items-center gap-3 shadow-lg z-10">
                             <RefreshCw size={16} className="text-indigo-400 animate-spin" />
                             <span className="text-xs text-indigo-100">AI Analyzing Data...</span>
                         </div>
                     )}
                 </div>
             </div>

             {/* Telemetry Charts */}
             <div className="h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 flex gap-4">
                 <div className="flex-1 min-w-0">
                     <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-2"><Thermometer size={12}/> Temperature (°C)</div>
                     <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={telemetry}>
                             <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                             <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                         </LineChart>
                     </ResponsiveContainer>
                 </div>
                 <div className="flex-1 min-w-0">
                     <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-2"><Waves size={12}/> Shaker (RPM)</div>
                     <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={telemetry}>
                             <YAxis domain={[0, 1000]} hide />
                             <Line type="monotone" dataKey="shakerRpm" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                         </LineChart>
                     </ResponsiveContainer>
                 </div>
                 <div className="flex-1 min-w-0">
                     <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-2"><Droplet size={12}/> Turbidity (OD)</div>
                     <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={telemetry}>
                             <YAxis domain={[0, 1]} hide />
                             <Line type="monotone" dataKey="turbidity" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                         </LineChart>
                     </ResponsiveContainer>
                 </div>
             </div>
          </div>

          {/* Right: Logs & QC */}
          <div className="w-80 flex flex-col gap-6">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden font-mono">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                      <Terminal size={12} /> System Logs
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5" ref={logsEndRef}>
                      {logs.map(log => (
                          <div key={log.id} className="text-[10px] leading-relaxed break-words">
                              <span className="text-slate-600">[{log.timestamp}]</span>{' '}
                              <span className={`${
                                  log.level === 'ERROR' ? 'text-red-500' :
                                  log.level === 'WARNING' ? 'text-yellow-500' :
                                  log.level === 'SUCCESS' ? 'text-emerald-500' : 'text-slate-300'
                              }`}>{log.message}</span>
                          </div>
                      ))}
                      {/* Fake cursor */}
                      <div className="w-2 h-4 bg-slate-600 animate-pulse mt-2"></div>
                  </div>
              </div>
          </div>
      </div>

      {/* Human-in-the-Loop Safety Auth Modal */}
      {awaitingAuth && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-800">
                          <Shield size={32} className="text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Human Safety Check</h3>
                      <p className="text-slate-400 text-sm mt-1">Verify physical conditions before authorizing automation.</p>
                  </div>

                  <div className="space-y-4 mb-8">
                      <div 
                        onClick={() => setSafetyChecks(prev => ({ ...prev, deck: !prev.deck }))}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            safetyChecks.deck ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                          <div className={`w-6 h-6 rounded flex items-center justify-center border ${
                              safetyChecks.deck ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 text-transparent'
                          }`}>
                              <CheckSquare size={14} fill="currentColor"/>
                          </div>
                          <div>
                              <div className="font-bold text-white text-sm">Deck Layout Verified</div>
                              <div className="text-xs text-slate-400">Labware matches digital twin config.</div>
                          </div>
                      </div>

                      <div 
                        onClick={() => setSafetyChecks(prev => ({ ...prev, reagents: !prev.reagents }))}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            safetyChecks.reagents ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                          <div className={`w-6 h-6 rounded flex items-center justify-center border ${
                              safetyChecks.reagents ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 text-transparent'
                          }`}>
                              <CheckSquare size={14} fill="currentColor"/>
                          </div>
                          <div>
                              <div className="font-bold text-white text-sm">Reagents Confirmed</div>
                              <div className="text-xs text-slate-400">Volumes sufficient, caps removed.</div>
                          </div>
                      </div>

                      <div 
                        onClick={() => setSafetyChecks(prev => ({ ...prev, interlock: !prev.interlock }))}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            safetyChecks.interlock ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                          <div className={`w-6 h-6 rounded flex items-center justify-center border ${
                              safetyChecks.interlock ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 text-transparent'
                          }`}>
                              <CheckSquare size={14} fill="currentColor"/>
                          </div>
                          <div>
                              <div className="font-bold text-white text-sm">Interlocks Active</div>
                              <div className="text-xs text-slate-400">Safety enclosure closed and locked.</div>
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button 
                          onClick={() => setAwaitingAuth(false)}
                          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-sm transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmStart}
                          disabled={!allChecksPassed}
                          className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                              allChecksPassed 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                      >
                          <UserCheck size={16} /> Authorize Run
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AutonomousLab;