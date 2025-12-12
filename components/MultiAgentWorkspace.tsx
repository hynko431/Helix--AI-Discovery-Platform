import React, { useState, useEffect, useRef } from 'react';
import { generateAgentCritique, refineHypothesis, generateCausalGraph } from '../services/geminiService';
import { AgentPersona, ArgumentNode, HypothesisVersion, CausalGraphData, CausalNode, CausalEdge } from '../types';
import { Users, MessageSquare, GitBranch, Play, StopCircle, CheckCircle, AlertTriangle, Shield, Brain, User, Plus, Clock, History, ThumbsUp, ThumbsDown, GitCommit, ChevronRight, Gavel, UserCog, Info, Network, RefreshCw, ZoomIn, Ban, Zap, Link as LinkIcon, FileText } from 'lucide-react';

const INITIAL_AGENTS: AgentPersona[] = [
  { 
    id: 'a1', name: 'Dr. Sarah Chen', role: 'Medicinal Chemist', 
    expertise: ['SAR', 'Synthesis', 'Solubility'], color: 'bg-cyan-500', avatar: 'SC' 
  },
  { 
    id: 'a2', name: 'Dr. Marcus Webb', role: 'Systems Biologist', 
    expertise: ['Pathways', 'Omics', 'Off-targets'], color: 'bg-emerald-500', avatar: 'MW' 
  },
  { 
    id: 'a3', name: 'Dr. Elena Rodriguez', role: 'Clinical Strategist', 
    expertise: ['Trials', 'Regulations', 'Patient Safety'], color: 'bg-purple-500', avatar: 'ER' 
  },
  { 
    id: 'a4', name: 'ToxBot v4.2', role: 'AI Toxicologist', 
    expertise: ['ADMET', 'Hepatotoxicity', 'Cardiotoxicity'], color: 'bg-rose-500', avatar: 'TB' 
  }
];

const MultiAgentWorkspace: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentAgentIndex, setCurrentAgentIndex] = useState<number | null>(null);
  
  const [hypothesisVersions, setHypothesisVersions] = useState<HypothesisVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [argumentsList, setArgumentsList] = useState<ArgumentNode[]>([]);
  const [viewMode, setViewMode] = useState<'DISCUSSION' | 'GRAPH'>('DISCUSSION');
  
  // Graph State
  const [causalGraph, setCausalGraph] = useState<CausalGraphData | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [nodes, setNodes] = useState<CausalNode[]>([]); // Local state for simulation

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeVersion = hypothesisVersions.find(v => v.id === activeVersionId);

  const startSession = () => {
    if (!topic) return;
    setIsSessionActive(true);
    
    // Create initial draft
    const initialDraft: HypothesisVersion = {
      id: 'v1',
      versionNumber: 1,
      content: topic, // Initially just the topic/prompt as the hypothesis base
      rationale: 'Initial Problem Statement',
      timestamp: new Date().toLocaleTimeString(),
      status: 'DRAFT'
    };
    
    setHypothesisVersions([initialDraft]);
    setActiveVersionId('v1');
    setArgumentsList([]);
  };

  const runCollaborationCycle = async () => {
    if (!activeVersion || isThinking) return;
    setIsThinking(true);

    try {
      // 1. Agents Critique Loop
      const newArgs: ArgumentNode[] = [];
      
      for (let i = 0; i < INITIAL_AGENTS.length; i++) {
        setCurrentAgentIndex(i);
        const agent = INITIAL_AGENTS[i];
        
        // Context is the hypothesis + recent arguments
        const context = newArgs.map(a => `${a.type}: ${a.content}`).join('\n');
        
        const critique = await generateAgentCritique(agent, activeVersion.content, context);
        
        const argNode: ArgumentNode = {
          id: Math.random().toString(36).substr(2, 9),
          agentId: agent.id,
          type: critique.type,
          content: critique.content,
          parentId: null,
          timestamp: new Date().toLocaleTimeString(),
          votes: 0
        };
        
        newArgs.push(argNode);
        setArgumentsList(prev => [...prev, argNode]);
        
        // Small delay for UI visualization
        await new Promise(r => setTimeout(r, 1000));
      }

      setCurrentAgentIndex(null);

      // 2. Synthesis Step
      const refinement = await refineHypothesis(activeVersion.content, [...argumentsList, ...newArgs]);
      
      const newVersion: HypothesisVersion = {
        id: Math.random().toString(36).substr(2, 9),
        versionNumber: activeVersion.versionNumber + 1,
        content: refinement.content,
        rationale: refinement.rationale,
        timestamp: new Date().toLocaleTimeString(),
        status: 'DRAFT'
      };

      setHypothesisVersions(prev => [newVersion, ...prev]);
      setActiveVersionId(newVersion.id);

    } catch (e) {
      console.error(e);
      alert("Collaboration cycle failed. Check API key.");
    } finally {
      setIsThinking(false);
      setCurrentAgentIndex(null);
    }
  };

  const handleGenerateGraph = async () => {
      if (!activeVersion) return;
      setIsGraphLoading(true);
      try {
          const graph = await generateCausalGraph(activeVersion.content, argumentsList);
          setCausalGraph(graph);
          
          // Initialize node positions randomly for force layout
          const width = 800;
          const height = 600;
          const initialNodes = graph.nodes.map(n => ({
              ...n,
              x: Math.random() * width,
              y: Math.random() * height,
              vx: 0,
              vy: 0
          }));
          setNodes(initialNodes);
          
      } catch (e) {
          console.error(e);
      } finally {
          setIsGraphLoading(false);
      }
  };

  // Simple Force Layout Simulation
  useEffect(() => {
      if (viewMode === 'GRAPH' && nodes.length > 0 && causalGraph) {
          const simulation = setInterval(() => {
              setNodes(prevNodes => {
                  const newNodes = [...prevNodes];
                  // Constants
                  const repulsion = 5000;
                  const springLength = 150;
                  const springStrength = 0.05;
                  const centerStrength = 0.02;
                  const width = 800;
                  const height = 500;

                  // 1. Repulsion
                  for (let i = 0; i < newNodes.length; i++) {
                      for (let j = i + 1; j < newNodes.length; j++) {
                          const n1 = newNodes[i];
                          const n2 = newNodes[j];
                          let dx = (n1.x || 0) - (n2.x || 0);
                          let dy = (n1.y || 0) - (n2.y || 0);
                          let distSq = dx*dx + dy*dy;
                          if (distSq === 0) { dx = 1; dy = 1; distSq = 2; } // Prevent divide by zero
                          
                          const force = repulsion / distSq;
                          const dist = Math.sqrt(distSq);
                          const fx = (dx / dist) * force;
                          const fy = (dy / dist) * force;

                          if (n1.vx !== undefined) n1.vx += fx;
                          if (n1.vy !== undefined) n1.vy += fy;
                          if (n2.vx !== undefined) n2.vx -= fx;
                          if (n2.vy !== undefined) n2.vy -= fy;
                      }
                  }

                  // 2. Springs (Edges)
                  causalGraph.edges.forEach(edge => {
                      const source = newNodes.find(n => n.id === edge.source);
                      const target = newNodes.find(n => n.id === edge.target);
                      if (source && target) {
                          let dx = (target.x || 0) - (source.x || 0);
                          let dy = (target.y || 0) - (source.y || 0);
                          const dist = Math.sqrt(dx*dx + dy*dy);
                          const displacement = dist - springLength;
                          
                          const fx = (dx / dist) * displacement * springStrength;
                          const fy = (dy / dist) * displacement * springStrength;

                          if (source.vx !== undefined) source.vx += fx;
                          if (source.vy !== undefined) source.vy += fy;
                          if (target.vx !== undefined) target.vx -= fx;
                          if (target.vy !== undefined) target.vy -= fy;
                      }
                  });

                  // 3. Center Gravity & Update
                  newNodes.forEach(node => {
                      // Pull to center
                      const cx = width / 2;
                      const cy = height / 2;
                      if (node.vx !== undefined) node.vx += (cx - (node.x || 0)) * centerStrength;
                      if (node.vy !== undefined) node.vy += (cy - (node.y || 0)) * centerStrength;

                      // Apply Velocity
                      if (node.vx !== undefined) {
                          node.x = (node.x || 0) + node.vx * 0.1; // damping
                          node.vx *= 0.9; // friction
                      }
                      if (node.vy !== undefined) {
                          node.y = (node.y || 0) + node.vy * 0.1;
                          node.vy *= 0.9;
                      }
                  });

                  return newNodes;
              });
          }, 50);

          return () => clearInterval(simulation);
      }
  }, [viewMode, causalGraph]); // Removed 'nodes' from dependency to avoid infinite loop restart, simulation manages internal state

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (viewMode === 'DISCUSSION') {
        scrollToBottom();
    }
  }, [argumentsList, viewMode]);

  const getNodeColor = (type: string) => {
      switch(type) {
          case 'MECHANISM': return 'bg-purple-500 border-purple-400';
          case 'EVIDENCE': return 'bg-emerald-500 border-emerald-400';
          case 'CANDIDATE': return 'bg-cyan-500 border-cyan-400';
          case 'ASSAY': return 'bg-orange-500 border-orange-400';
          case 'CLAIM': return 'bg-slate-500 border-slate-400';
          default: return 'bg-slate-600 border-slate-500';
      }
  };

  const getEdgeColor = (relation: string) => {
      switch(relation) {
          case 'SUPPORTS': return '#10b981'; // Emerald
          case 'REFUTES': return '#ef4444'; // Red
          case 'CAUSES': return '#a855f7'; // Purple
          case 'VALIDATES': return '#f59e0b'; // Amber
          default: return '#64748b'; // Slate
      }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-end mb-4 px-2">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Users className="text-pink-400" />
            Multi-Agent Collaborative Workspace
          </h2>
          <p className="text-slate-400 text-sm">
            Autonomous agent chains debating and refining scientific hypotheses.
          </p>
        </div>
        <div className="flex gap-2">
          {!isSessionActive ? (
            <button 
              onClick={startSession}
              disabled={!topic}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                topic 
                ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play size={18} /> Initialize War Room
            </button>
          ) : (
            <button 
              onClick={() => { setIsSessionActive(false); setTopic(''); setHypothesisVersions([]); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400"
            >
              <StopCircle size={18} /> Reset
            </button>
          )}
        </div>
      </div>

      {!isSessionActive ? (
        <div className="flex-1 flex items-center justify-center p-8">
           <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-center mb-6">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                    <Brain size={32} className="text-pink-500" />
                 </div>
              </div>
              <h3 className="text-center text-xl font-semibold text-white mb-2">Define Research Objective</h3>
              <p className="text-center text-slate-400 mb-8">
                 Enter a starting proposition, target, or query. The agent swarm will iteratively critique and refine it.
              </p>
              
              <textarea 
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 placeholder="e.g. Design a proteolysis targeting chimera (PROTAC) for degradation of undruggable KRAS mutants..."
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none h-32 mb-6"
              />
              
              <div className="grid grid-cols-2 gap-4">
                 {INITIAL_AGENTS.map(agent => (
                    <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-800">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${agent.color}`}>
                          {agent.avatar}
                       </div>
                       <div>
                          <div className="text-sm font-medium text-slate-200">{agent.name}</div>
                          <div className="text-xs text-slate-500">{agent.role}</div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden">
           
           {/* Left: Agents & History */}
           <div className="w-64 flex flex-col gap-4">
              {/* Agents List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col flex-shrink-0">
                 <div className="p-3 border-b border-slate-800 bg-slate-800/50 font-semibold text-slate-300 text-sm flex items-center gap-2">
                    <Users size={14} /> Active Agents
                 </div>
                 <div className="p-2 space-y-2">
                    {INITIAL_AGENTS.map((agent, idx) => (
                       <div 
                          key={agent.id} 
                          className={`flex items-center gap-3 p-2 rounded-lg transition-all border ${
                             currentAgentIndex === idx 
                             ? 'bg-slate-800 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.1)]' 
                             : 'bg-transparent border-transparent opacity-60'
                          }`}
                       >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${agent.color} relative`}>
                             {agent.avatar}
                             {currentAgentIndex === idx && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                             )}
                          </div>
                          <div className="overflow-hidden">
                             <div className="text-xs font-medium text-slate-200 truncate">{agent.name}</div>
                             <div className="text-[10px] text-slate-500 truncate">{agent.role}</div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Version History */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                 <div className="p-3 border-b border-slate-800 bg-slate-800/50 font-semibold text-slate-300 text-sm flex items-center gap-2">
                    <History size={14} /> Version History
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {hypothesisVersions.map((version) => (
                       <button
                          key={version.id}
                          onClick={() => setActiveVersionId(version.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all relative ${
                             activeVersionId === version.id 
                             ? 'bg-slate-800 border-pink-500/30' 
                             : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                       >
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-xs font-bold text-pink-400 font-mono">v{version.versionNumber}.0</span>
                             <span className="text-[10px] text-slate-500">{version.timestamp}</span>
                          </div>
                          <div className="text-xs text-slate-300 line-clamp-2">
                             {version.content}
                          </div>
                          {activeVersionId === version.id && (
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500 rounded-l-lg"></div>
                          )}
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Center: Hypothesis & Argument Map */}
           <div className="flex-1 flex flex-col gap-6 overflow-hidden">
              
              {/* Active Hypothesis Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex-shrink-0 animate-in fade-in slide-in-from-top-4">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-pink-500/10 rounded-lg">
                          <GitBranch className="text-pink-400" size={24} />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-white">Current Hypothesis <span className="text-pink-400 font-mono text-sm ml-2">v{activeVersion?.versionNumber}.0</span></h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                             <span className="flex items-center gap-1"><GitCommit size={10}/> {activeVersion?.id}</span>
                             <span>•</span>
                             <span className="uppercase font-bold tracking-wider">{activeVersion?.status}</span>
                          </div>
                       </div>
                    </div>
                    
                    <button 
                       onClick={runCollaborationCycle}
                       disabled={isThinking}
                       className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                          isThinking 
                          ? 'bg-slate-700 text-slate-400 cursor-wait' 
                          : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                       }`}
                    >
                       {isThinking ? (
                          <>
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             Agents Deliberating...
                          </>
                       ) : (
                          <>
                             <MessageSquare size={16} /> 
                             Run Collaboration Cycle
                          </>
                       )}
                    </button>
                 </div>

                 <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 mb-4">
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                       {activeVersion?.content}
                    </p>
                 </div>

                 {activeVersion?.rationale && (
                    <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-900/30 p-2 rounded">
                       <Info size={14} className="mt-0.5 text-blue-400 flex-shrink-0"/>
                       <span><strong className="text-blue-300">Orchestrator Rationale:</strong> {activeVersion.rationale}</span>
                    </div>
                 )}
              </div>

              {/* Argument Map / Chat */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
                 <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                       <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                          {viewMode === 'DISCUSSION' ? <Gavel size={18} className="text-pink-400"/> : <Network size={18} className="text-pink-400"/>}
                          {viewMode === 'DISCUSSION' ? 'Argument Thread' : 'Causal Argument Map'}
                       </h3>
                    </div>
                    
                    <div className="flex bg-slate-800 rounded-lg border border-slate-700 p-0.5">
                        <button 
                            onClick={() => setViewMode('DISCUSSION')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                                viewMode === 'DISCUSSION' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <MessageSquare size={12}/> Discussion
                        </button>
                        <button 
                            onClick={() => { setViewMode('GRAPH'); if (!causalGraph) handleGenerateGraph(); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                                viewMode === 'GRAPH' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Network size={12}/> Causal Map
                        </button>
                    </div>
                 </div>

                 {viewMode === 'DISCUSSION' ? (
                     <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {argumentsList.length === 0 && (
                           <div className="text-center text-slate-600 mt-10">
                              <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                              <p>No active debate.</p>
                              <p className="text-sm">Start a collaboration cycle to invite agent critiques.</p>
                           </div>
                        )}
                        
                        {argumentsList.map((arg) => {
                           const agent = INITIAL_AGENTS.find(a => a.id === arg.agentId);
                           return (
                              <div key={arg.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                                 <div className="flex-shrink-0 flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${agent?.color} shadow-lg`}>
                                       {agent?.avatar}
                                    </div>
                                    <div className="h-full w-0.5 bg-slate-800 my-2"></div>
                                 </div>
                                 
                                 <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                       <span className="font-bold text-slate-200 text-sm">{agent?.name}</span>
                                       <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">{agent?.role}</span>
                                       <span className="text-xs text-slate-600 ml-auto">{arg.timestamp}</span>
                                    </div>
                                    
                                    <div className={`p-4 rounded-xl border relative ${
                                       arg.type === 'SUPPORT' ? 'bg-emerald-900/10 border-emerald-500/30' :
                                       arg.type === 'DISPUTE' ? 'bg-red-900/10 border-red-500/30' :
                                       arg.type === 'EVIDENCE' ? 'bg-blue-900/10 border-blue-500/30' :
                                       'bg-slate-800 border-slate-700'
                                    }`}>
                                       {/* Type Badge */}
                                       <div className={`absolute -top-3 left-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                          arg.type === 'SUPPORT' ? 'bg-emerald-900 text-emerald-300 border-emerald-700' :
                                          arg.type === 'DISPUTE' ? 'bg-red-900 text-red-300 border-red-700' :
                                          arg.type === 'EVIDENCE' ? 'bg-blue-900 text-blue-300 border-blue-700' :
                                          'bg-slate-700 text-slate-300 border-slate-600'
                                       }`}>
                                          {arg.type}
                                       </div>

                                       <p className="text-sm text-slate-300 leading-relaxed mt-1">
                                          {arg.content}
                                       </p>

                                       <div className="mt-3 flex items-center gap-3">
                                          <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                             <ThumbsUp size={12} /> {arg.votes}
                                          </button>
                                          <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                             <ThumbsDown size={12} />
                                          </button>
                                          {arg.type === 'EVIDENCE' && (
                                             <button className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                <Shield size={12} /> Verify Source
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
                        <div ref={messagesEndRef} />
                     </div>
                 ) : (
                     <div className="flex-1 relative overflow-hidden bg-slate-950">
                         {isGraphLoading && (
                             <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900/80 backdrop-blur-sm">
                                 <RefreshCw size={24} className="animate-spin text-pink-500 mb-2"/>
                                 <span className="text-slate-300 ml-2">Mapping logical dependencies...</span>
                             </div>
                         )}
                         
                         {(!causalGraph && !isGraphLoading) ? (
                             <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                 <Network size={48} className="mb-4 opacity-50"/>
                                 <p>Generate a causal map from the current debate.</p>
                                 <button onClick={handleGenerateGraph} className="mt-4 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-sm font-medium transition-colors">
                                     Generate Map
                                 </button>
                             </div>
                         ) : (
                             <>
                                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div> Mechanism
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Evidence
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500"></div> Candidate
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div> Assay
                                    </div>
                                    <button onClick={handleGenerateGraph} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white border border-slate-700 transition-colors mt-2" title="Regenerate">
                                        <RefreshCw size={14}/>
                                    </button>
                                </div>

                                <svg className="w-full h-full cursor-grab active:cursor-grabbing">
                                    <defs>
                                        <marker id="arrow-supports" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                                            <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
                                        </marker>
                                        <marker id="arrow-refutes" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                                            <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                                        </marker>
                                        <marker id="arrow-causes" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                                            <path d="M0,0 L0,6 L9,3 z" fill="#a855f7" />
                                        </marker>
                                        <marker id="arrow-validates" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                                            <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" />
                                        </marker>
                                    </defs>
                                    
                                    {/* Edges */}
                                    {causalGraph?.edges.map((edge) => {
                                        const source = nodes.find(n => n.id === edge.source);
                                        const target = nodes.find(n => n.id === edge.target);
                                        if (!source || !target) return null;
                                        
                                        return (
                                            <g key={`${edge.source}-${edge.target}`}>
                                                <line 
                                                    x1={source.x} y1={source.y} 
                                                    x2={target.x} y2={target.y} 
                                                    stroke={getEdgeColor(edge.relation)} 
                                                    strokeWidth="2"
                                                    markerEnd={`url(#arrow-${edge.relation.toLowerCase()})`}
                                                    opacity="0.6"
                                                />
                                            </g>
                                        );
                                    })}

                                    {/* Nodes */}
                                    {nodes.map(node => (
                                        <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                                            <circle r="16" className={`${getNodeColor(node.type)}`} strokeWidth="2" fillOpacity="0.2"/>
                                            <circle r="4" fill="white" opacity="0.8"/>
                                            <foreignObject x="-60" y="20" width="120" height="60" className="overflow-visible pointer-events-none">
                                                <div className="text-[10px] text-center bg-slate-900/80 px-2 py-1 rounded text-slate-200 border border-slate-700/50 line-clamp-2">
                                                    {node.label}
                                                </div>
                                            </foreignObject>
                                        </g>
                                    ))}
                                </svg>
                             </>
                         )}
                     </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MultiAgentWorkspace;
