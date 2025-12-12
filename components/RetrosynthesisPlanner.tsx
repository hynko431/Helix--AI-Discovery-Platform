import React, { useState } from 'react';
import { generateRetrosynthesisRoute } from '../services/geminiService';
import { RetrosynthesisResult, Reagent } from '../types';
import { Factory, DollarSign, Clock, Leaf, AlertTriangle, ArrowRight, ShoppingCart, Truck, Check, Search, Beaker, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RetrosynthesisPlanner: React.FC = () => {
  const [input, setInput] = useState('CC(C)C1=CC=C(C=C1)C(C)C(=O)O'); // Ibuprofen default
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<RetrosynthesisResult | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    setLoading(true);
    try {
      const result = await generateRetrosynthesisRoute(input);
      setRoute(result);
    } catch (error) {
      console.error(error);
      alert("Failed to plan route.");
    } finally {
      setLoading(false);
    }
  };

  const getAllReagents = () => {
    if (!route) return [];
    return route.steps.flatMap(s => s.reagents);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return 'text-emerald-400 bg-emerald-900/20 border-emerald-800';
      case 'LOW_STOCK': return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
      case 'BACKORDER': return 'text-orange-400 bg-orange-900/20 border-orange-800';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Factory className="text-amber-400" />
            In-Silico Retrosynthesis Planner
          </h2>
          <p className="text-slate-400 text-sm">
            AI-driven route planning with real-time cost estimation and vendor procurement logic.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left: Input & Summary */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <form onSubmit={handleGenerate} className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-400 uppercase">Target Molecule</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter SMILES or Name..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 pr-10"
                />
                <Search className="absolute right-3 top-2.5 text-slate-500" size={14} />
              </div>
              <button 
                type="submit"
                disabled={loading || !input}
                className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  loading
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                }`}
              >
                {loading ? <span className="animate-spin">⟳</span> : <Factory size={16} />}
                Generate Route
              </button>
            </form>
          </div>

          {route && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4">
              {/* Stats Cards */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Route Economics</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                       <div className="text-slate-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><DollarSign size={10}/> Est. Cost</div>
                       <div className="text-xl font-mono text-white font-bold">${route.totalCost.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                       <div className="text-slate-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><Clock size={10}/> Total Time</div>
                       <div className="text-xl font-mono text-white font-bold">{route.totalTimeHours}h</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                       <div className="text-slate-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><Check size={10}/> Feasibility</div>
                       <div className="text-xl font-mono text-emerald-400 font-bold">{(route.confidenceScore * 100).toFixed(0)}%</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                       <div className="text-slate-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><Leaf size={10}/> Eco Score</div>
                       <div className="text-xl font-mono text-green-400 font-bold">{route.sustainabilityScore}/10</div>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex-1">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Step Breakdown</h3>
                 <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={route.steps.map(s => ({ step: `S${s.stepNumber}`, time: s.estimatedTime }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="step" stroke="#64748b" fontSize={10} tickLine={false} />
                          <Tooltip 
                            cursor={{fill: '#334155', opacity: 0.2}}
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }}
                          />
                          <Bar dataKey="time" fill="#d97706" radius={[4, 4, 0, 0]} name="Time (h)" />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Center: Route Visualizer */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center z-10">
             <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Beaker size={18} className="text-amber-400"/> Synthesis Pathway
             </h3>
             {route && <span className="text-xs text-slate-500 font-mono">{route.steps.length} Steps • Linear Sequence</span>}
          </div>

          <div className="flex-1 overflow-y-auto p-8 relative">
             {!route ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-60">
                  <Factory size={64} className="mb-4 text-slate-700"/>
                  <p>Enter a molecule to generate synthesis route</p>
               </div>
             ) : (
               <div className="space-y-8 max-w-3xl mx-auto">
                 {/* Target */}
                 <div className="flex justify-center mb-12">
                    <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-xl text-center min-w-[200px] shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                       <div className="text-xs text-amber-500 uppercase font-bold tracking-wider mb-1">Target Product</div>
                       <div className="font-bold text-white text-lg">{route.targetMolecule.length > 20 ? 'Target Molecule' : route.targetMolecule}</div>
                    </div>
                 </div>

                 {/* Steps in Reverse (Retrosynthesis) logic visually displayed top-down as Forward Synthesis for readability */}
                 {[...route.steps].map((step, idx) => (
                    <div key={idx} className="relative pl-8 border-l-2 border-slate-700 last:border-0 pb-12 last:pb-0 animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: `${idx * 150}ms`}}>
                       <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-amber-500 z-10"></div>
                       
                       <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 hover:border-amber-500/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                             <div className="flex items-center gap-3">
                                <span className="bg-amber-900/20 text-amber-500 font-bold px-2 py-1 rounded text-xs">Step {step.stepNumber}</span>
                                <h4 className="font-bold text-slate-200">{step.reactionType}</h4>
                             </div>
                             <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Clock size={12}/> {step.estimatedTime}h
                             </div>
                          </div>

                          <p className="text-sm text-slate-400 mb-4">{step.description}</p>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                             <div className="bg-slate-800/50 p-2 rounded border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Conditions</div>
                                <div className="text-xs text-slate-300 font-mono">{step.conditions}</div>
                             </div>
                             <div className="bg-slate-800/50 p-2 rounded border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Yield</div>
                                <div className="text-xs text-emerald-400 font-mono font-bold">{step.yield}%</div>
                             </div>
                          </div>
                          
                          {/* Reagents */}
                          <div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Reagents / Catalysts</div>
                             <div className="flex flex-wrap gap-2">
                                {step.reagents.map((r, i) => (
                                   <div key={i} className="flex items-center gap-2 bg-slate-800 px-2 py-1.5 rounded border border-slate-700 text-xs text-slate-300">
                                      <Beaker size={10} className="text-slate-500"/>
                                      {r.name}
                                   </div>
                                ))}
                             </div>
                          </div>

                          {step.safetyHazards && step.safetyHazards.length > 0 && (
                             <div className="mt-4 flex items-center gap-2 text-xs text-orange-400 bg-orange-900/10 p-2 rounded border border-orange-900/20">
                                <AlertTriangle size={12}/>
                                <span>Hazards: {step.safetyHazards.join(', ')}</span>
                             </div>
                          )}
                       </div>
                       
                       {idx < route.steps.length - 1 && (
                          <div className="absolute left-[-1px] bottom-0 -translate-x-1/2 translate-y-full text-slate-600">
                             <ArrowRight size={16} className="rotate-90"/>
                          </div>
                       )}
                    </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Right: Procurement List */}
        <div className="w-72 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                 <ShoppingCart size={18} className="text-emerald-400"/> Procurement
              </h3>
              {route && <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/50">{getAllReagents().length} Items</span>}
           </div>

           <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {!route ? (
                 <div className="text-center text-slate-600 mt-10 text-xs italic">No items to order</div>
              ) : (
                 getAllReagents().map((reagent, idx) => (
                    <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-3 group hover:border-slate-600 transition-colors">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-200 text-xs line-clamp-1" title={reagent.name}>{reagent.name}</h4>
                          <span className="font-mono text-emerald-400 text-xs font-bold">${reagent.cost}</span>
                       </div>
                       <div className="text-[10px] text-slate-500 mb-2">{reagent.vendor} • {reagent.catalogId}</div>
                       
                       <div className="flex justify-between items-center mt-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getStockStatusColor(reagent.availability)}`}>
                             {reagent.availability.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                             <Truck size={10}/> {reagent.leadTime}
                          </span>
                       </div>
                    </div>
                 ))
              )}
           </div>
           
           {route && (
             <div className="p-4 border-t border-slate-800 bg-slate-800/20">
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors">
                   <Package size={14}/> Generate PO
                </button>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default RetrosynthesisPlanner;
