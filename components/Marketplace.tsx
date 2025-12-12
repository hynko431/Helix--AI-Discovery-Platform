import React, { useState, useEffect } from 'react';
import { searchMarketplace, draftRFQ } from '../services/geminiService';
import { MarketplaceItem, QuoteRequest } from '../types';
import { ShoppingBag, Search, Filter, Star, Truck, CheckCircle, Plus, Send, FileText, X, DollarSign, Package } from 'lucide-react';

const INITIAL_ITEMS: MarketplaceItem[] = [
  { 
    id: 'm1', name: 'KRAS G12C Assay Kit (HTRF)', category: 'ASSAY', 
    price: 1250, currency: 'USD', description: 'High-throughput homogeneous time-resolved fluorescence kit.', deliveryTime: '2 Days',
    vendor: { id: 'v1', name: 'Cisbio', rating: 4.8, sla: '48h', verified: true }
  },
  { 
    id: 'm2', name: 'Custom Synthesis (10mg, >95%)', category: 'SYNTHESIS', 
    price: 3500, currency: 'USD', description: 'Standard synthesis service for non-GMP lead compounds.', deliveryTime: '3 Weeks',
    vendor: { id: 'v2', name: 'WuXi AppTec', rating: 4.9, sla: '3 Weeks', verified: true }
  },
  { 
    id: 'm3', name: 'HEK293 Cell Line (Transfected)', category: 'REAGENT', 
    price: 800, currency: 'USD', description: 'Stable cell line expressing target protein.', deliveryTime: '1 Week',
    vendor: { id: 'v3', name: 'Charles River', rating: 4.7, sla: '1 Week', verified: true }
  },
];

const Marketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BROWSE' | 'RFQ'>('BROWSE');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [items, setItems] = useState<MarketplaceItem[]>(INITIAL_ITEMS);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<MarketplaceItem[]>([]);
  
  // RFQ State
  const [rfqInput, setRfqInput] = useState('');
  const [rfqDraft, setRfqDraft] = useState<QuoteRequest | null>(null);
  const [rfqLoading, setRfqLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    try {
        const results = await searchMarketplace(searchQuery, categoryFilter);
        setItems(results);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleAddToCart = (item: MarketplaceItem) => {
      setCart(prev => [...prev, item]);
  };

  const handleCreateRFQ = async () => {
      if (!rfqInput) return;
      setRfqLoading(true);
      try {
          const draft = await draftRFQ(rfqInput);
          setRfqDraft(draft);
      } catch (e) {
          console.error(e);
      } finally {
          setRfqLoading(false);
      }
  };

  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'ASSAY': return 'bg-purple-900/30 text-purple-400 border-purple-800';
          case 'REAGENT': return 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
          case 'SYNTHESIS': return 'bg-blue-900/30 text-blue-400 border-blue-800';
          case 'EQUIPMENT': return 'bg-orange-900/30 text-orange-400 border-orange-800';
          default: return 'bg-slate-800 text-slate-400 border-slate-700';
      }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <ShoppingBag className="text-cyan-400" />
            Marketplace & Procurement
          </h2>
          <p className="text-slate-400 text-sm">
            Integrated sourcing for assays, reagents, and CRO services.
          </p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button 
                onClick={() => setActiveTab('BROWSE')}
                className={`px-4 py-2 text-xs font-bold rounded transition-all flex items-center gap-2 ${
                    activeTab === 'BROWSE' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
                <Search size={14}/> Browse Catalog
            </button>
            <button 
                onClick={() => setActiveTab('RFQ')}
                className={`px-4 py-2 text-xs font-bold rounded transition-all flex items-center gap-2 ${
                    activeTab === 'RFQ' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
                <FileText size={14}/> Request Quote
            </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left Content Area */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
            
            {activeTab === 'BROWSE' && (
                <div className="flex flex-col h-full">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex gap-4">
                        <form onSubmit={handleSearch} className="flex-1 relative">
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search e.g. 'EGFR antibodies' or 'Toxicity Screening'..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                            />
                            <Search className="absolute left-3 top-3.5 text-slate-500" size={16}/>
                        </form>
                        <select 
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="ALL">All Categories</option>
                            <option value="ASSAY">Assays</option>
                            <option value="REAGENT">Reagents</option>
                            <option value="SYNTHESIS">Synthesis</option>
                            <option value="EQUIPMENT">Equipment</option>
                        </select>
                        <button 
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {items.map(item => (
                                <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${getCategoryColor(item.category)}`}>
                                            {item.category}
                                        </span>
                                        {item.vendor.verified && (
                                            <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-900/20 px-1.5 py-0.5 rounded border border-cyan-800">
                                                <CheckCircle size={10}/> Verified
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">{item.name}</h4>
                                    <div className="text-xs text-slate-400 mb-3 line-clamp-2 h-8">{item.description}</div>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 text-xs font-bold">
                                                {item.vendor.name.charAt(0)}
                                            </div>
                                            <div className="text-xs text-slate-300">
                                                {item.vendor.name}
                                                <div className="flex items-center text-[10px] text-yellow-500">
                                                    <Star size={8} fill="currentColor" className="mr-1"/> {item.vendor.rating}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-white font-bold">${item.price}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                                                <Truck size={10}/> {item.deliveryTime}
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleAddToCart(item)}
                                        className="w-full mt-3 py-2 bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14}/> Add to Cart
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'RFQ' && (
                <div className="flex flex-col h-full p-6 overflow-y-auto">
                    {!rfqDraft ? (
                        <div className="max-w-2xl mx-auto w-full">
                            <div className="text-center mb-8">
                                <FileText size={48} className="text-cyan-400 mx-auto mb-4 opacity-80"/>
                                <h3 className="text-xl font-bold text-white">Intelligent Request for Quote</h3>
                                <p className="text-slate-400 text-sm mt-2">
                                    Describe your custom synthesis or assay needs in natural language. 
                                    Our AI agent will structure the request and match you with vetted vendors.
                                </p>
                            </div>
                            
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Specifications</label>
                                <textarea 
                                    value={rfqInput}
                                    onChange={(e) => setRfqInput(e.target.value)}
                                    className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none mb-4"
                                    placeholder="e.g. I need custom synthesis of a library of 50 kinase inhibitors based on the attached scaffold. Purity >95%, 5mg each. Required by end of next month."
                                />
                                <button 
                                    onClick={handleCreateRFQ}
                                    disabled={rfqLoading || !rfqInput}
                                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {rfqLoading ? 'Analyzing Request...' : 'Draft RFQ'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FileText className="text-cyan-400"/> RFQ Draft: {rfqDraft.title}
                                </h3>
                                <button onClick={() => setRfqDraft(null)} className="text-slate-400 hover:text-white">
                                    <X size={20}/>
                                </button>
                            </div>

                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Technical Specifications</h4>
                                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap">
                                        {rfqDraft.description}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Estimated Budget</h4>
                                        <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                            <DollarSign size={16} className="text-emerald-400"/>
                                            <span className="text-white font-mono">{rfqDraft.estimatedCostRange}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Suggested Vendors</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {rfqDraft.suggestedVendors.map(v => (
                                                <span key={v} className="bg-indigo-900/30 text-indigo-300 border border-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                                                    {v}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                                    <button className="px-4 py-2 text-slate-400 hover:text-white text-sm">Edit Draft</button>
                                    <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg">
                                        <Send size={14}/> Send to Vendors
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>

        {/* Right: Cart / Quick Summary */}
        <div className="w-80 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <ShoppingBag size={16}/> Procurement Cart
                </h3>
                <span className="bg-cyan-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cart.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                    <div className="text-center text-slate-600 mt-10">
                        <Package size={32} className="mx-auto mb-2 opacity-30"/>
                        <p className="text-xs italic">Cart is empty</p>
                    </div>
                ) : (
                    cart.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="flex items-start gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-right-2">
                            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-800">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-200 truncate">{item.name}</div>
                                <div className="text-[10px] text-slate-500">{item.vendor.name}</div>
                            </div>
                            <div className="text-xs font-mono text-cyan-400 font-bold">
                                ${item.price}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {cart.length > 0 && (
                <div className="p-4 border-t border-slate-800 bg-slate-800/30">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-slate-400">Total Est.</span>
                        <span className="text-lg font-mono font-bold text-white">
                            ${cart.reduce((sum, i) => sum + i.price, 0).toLocaleString()}
                        </span>
                    </div>
                    <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg transition-colors">
                        Submit Order
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Marketplace;
