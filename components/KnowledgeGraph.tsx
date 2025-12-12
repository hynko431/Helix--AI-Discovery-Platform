import React, { useState, useMemo } from 'react';
import { Share2, FileText, ArrowRight, ExternalLink, ShieldCheck, AlertTriangle, Network, Info, ZoomIn, Search, Zap, Ban, Link as LinkIcon, Filter, Sliders, X, Database, Maximize, RotateCcw, BoxSelect, Bookmark, Save, Trash2, GitPullRequest } from 'lucide-react';

// --- Types for Graph Data ---
type NodeType = 'PROTEIN' | 'COMPOUND' | 'PATHWAY' | 'PHENOTYPE';
type EdgeType = 'ACTIVATES' | 'INHIBITS' | 'ASSOCIATED_WITH';

interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  description: string;
}

interface GraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  type: EdgeType;
  confidence: number; // 0-1
  provenance: {
    paperTitle: string;
    author: string;
    year: string;
    pmcid: string;
    snippet: string; // The specific sentence supporting the claim
  };
}

interface GraphCluster {
  id: string;
  label: string;
  nodeIds: string[];
  color: 'emerald' | 'blue' | 'red' | 'purple' | 'slate';
}

interface SavedView {
  id: string;
  name: string;
  timestamp: string;
  state: {
    viewState: { x: number; y: number; k: number };
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    minConfidence: number;
    activeTypes: Record<EdgeType, boolean>;
    showClusters: boolean;
  };
}

// --- Mock Data: KRAS Signaling Pathway ---
const NODES: GraphNode[] = [
  { id: 'n1', label: 'AMG-510 (Sotorasib)', type: 'COMPOUND', x: 100, y: 300, description: 'First-in-class KRAS G12C inhibitor used for non-small cell lung cancer.' },
  { id: 'n2', label: 'KRAS G12C', type: 'PROTEIN', x: 300, y: 300, description: 'Oncogenic mutant form of KRAS GTPase where Glycine is replaced by Cysteine at codon 12.' },
  { id: 'n3', label: 'RAF1', type: 'PROTEIN', x: 500, y: 200, description: 'Proto-oncogene, serine/threonine-protein kinase that is part of the ERK signaling pathway.' },
  { id: 'n4', label: 'PI3K', type: 'PROTEIN', x: 500, y: 400, description: 'Phosphatidylinositol 3-kinase involved in cell growth, proliferation, differentiation, and motility.' },
  { id: 'n5', label: 'MEK1/2', type: 'PROTEIN', x: 700, y: 200, description: 'Mitogen-activated protein kinase kinase enzymes that phosphorylate MAPK/ERK.' },
  { id: 'n6', label: 'ERK1/2', type: 'PROTEIN', x: 900, y: 200, description: 'Extracellular signal-regulated kinases, key effectors in the MAPK/ERK pathway.' },
  { id: 'n7', label: 'Tumor Proliferation', type: 'PHENOTYPE', x: 900, y: 400, description: 'Uncontrolled rapid cell growth and division characterizing malignant tumors.' },
];

const EDGES: GraphEdge[] = [
  { 
    id: 'e1', source: 'n1', target: 'n2', type: 'INHIBITS', confidence: 0.99,
    provenance: { paperTitle: 'The clinical KRAS(G12C) inhibitor AMG 510 drives anti-tumour immunity', author: 'Canon et al.', year: '2019', pmcid: 'PMC6858556', snippet: 'AMG 510 covalently modifies the cysteine 12 residue of KRAS(G12C) and inhibits downstream signaling.' } 
  },
  { 
    id: 'e2', source: 'n2', target: 'n3', type: 'ACTIVATES', confidence: 0.95,
    provenance: { paperTitle: 'RAS-RAF-MEK-ERK signaling pathway', author: 'McCubrey et al.', year: '2007', pmcid: 'PMC1854955', snippet: 'GTP-bound RAS recruits and activates RAF kinases at the plasma membrane.' } 
  },
  { 
    id: 'e3', source: 'n2', target: 'n4', type: 'ACTIVATES', confidence: 0.92,
    provenance: { paperTitle: 'Ras signaling and transforming function', author: 'Castellano et al.', year: '2011', pmcid: 'PMC3128630', snippet: 'Ras creates a binding site for the p110 subunit of PI3K, stimulating its lipid kinase activity.' } 
  },
  { 
    id: 'e4', source: 'n3', target: 'n5', type: 'ACTIVATES', confidence: 0.98,
    provenance: { paperTitle: 'RAF kinases: function, regulation and role in human cancer', author: 'Matallanas et al.', year: '2011', pmcid: 'PMC3074211', snippet: 'Activated RAF phosphorylates and activates MEK1 and MEK2.' } 
  },
  { 
    id: 'e5', source: 'n5', target: 'n6', type: 'ACTIVATES', confidence: 0.98,
    provenance: { paperTitle: 'MEK1/2 signaling', author: 'Roskoski Jr.', year: '2012', pmcid: 'PMC3348123', snippet: 'MEK1/2 are dual-specificity protein kinases that phosphorylate ERK1/2.' } 
  },
  { 
    id: 'e6', source: 'n6', target: 'n7', type: 'ASSOCIATED_WITH', confidence: 0.85,
    provenance: { paperTitle: 'ERK signaling in cancer', author: 'Samatar et al.', year: '2014', pmcid: 'PMC4340032', snippet: 'Hyperactivation of ERK promotes cell cycle progression and proliferation.' } 
  },
  { 
    id: 'e7', source: 'n4', target: 'n7', type: 'ASSOCIATED_WITH', confidence: 0.88,
    provenance: { paperTitle: 'PI3K pathway in cancer', author: 'Liu et al.', year: '2009', pmcid: 'PMC2782343', snippet: 'PI3K/AKT signaling is a key driver of cell growth and survival.' } 
  },
];

const CLUSTERS: GraphCluster[] = [
  { id: 'c1', label: 'Target Engagement', nodeIds: ['n1', 'n2'], color: 'emerald' },
  { id: 'c2', label: 'Signal Transduction', nodeIds: ['n3', 'n4', 'n5', 'n6'], color: 'blue' },
  { id: 'c3', label: 'Pathology', nodeIds: ['n7'], color: 'red' }
];

const KnowledgeGraph: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [minConfidence, setMinConfidence] = useState(0.7);
  const [activeTypes, setActiveTypes] = useState<Record<EdgeType, boolean>>({
    ACTIVATES: true,
    INHIBITS: true,
    ASSOCIATED_WITH: true
  });

  // Search & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [viewState, setViewState] = useState({ x: 0, y: 0, k: 1 }); // View transform (x, y, scale)

  // Bookmarks State
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    {
        id: 'default', 
        name: 'Default Overview', 
        timestamp: 'Preset',
        state: {
            viewState: { x: 0, y: 0, k: 1 },
            selectedNodeId: null,
            selectedEdgeId: null,
            minConfidence: 0.7,
            activeTypes: { ACTIVATES: true, INHIBITS: true, ASSOCIATED_WITH: true },
            showClusters: true
        }
    }
  ]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const handleEdgeClick = (edge: GraphEdge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const toggleFilter = (type: EdgeType) => {
    setActiveTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const setCausalOnly = () => {
      setActiveTypes({
          ACTIVATES: true,
          INHIBITS: true,
          ASSOCIATED_WITH: false
      });
  };

  const filteredEdges = useMemo(() => {
    return EDGES.filter(edge => 
      edge.confidence >= minConfidence && activeTypes[edge.type]
    );
  }, [minConfidence, activeTypes]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return NODES.filter(node => 
      node.label.toLowerCase().includes(lowerQuery) || 
      node.type.toLowerCase().includes(lowerQuery) ||
      node.id.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const handleSearchSelect = (node: GraphNode) => {
      setSelectedNode(node);
      setSelectedEdge(null);
      setSearchQuery('');
      setIsSearchFocused(false);

      // Zoom to Node Logic
      const zoom = 2.0;
      const x = 500 - (node.x * zoom);
      const y = 300 - (node.y * zoom);
      
      setViewState({ x, y, k: zoom });
  };

  const handleResetView = () => {
    setViewState({ x: 0, y: 0, k: 1 });
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleSaveView = () => {
    const name = prompt("Enter a name for this view:", `View ${savedViews.length + 1}`);
    if (!name) return;
    
    const newView: SavedView = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        state: {
            viewState,
            selectedNodeId: selectedNode?.id || null,
            selectedEdgeId: selectedEdge?.id || null,
            minConfidence,
            activeTypes,
            showClusters
        }
    };
    
    setSavedViews(prev => [...prev, newView]);
  };

  const handleLoadView = (view: SavedView) => {
    setViewState(view.state.viewState);
    setSelectedNode(view.state.selectedNodeId ? NODES.find(n => n.id === view.state.selectedNodeId) || null : null);
    setSelectedEdge(view.state.selectedEdgeId ? EDGES.find(e => e.id === view.state.selectedEdgeId) || null : null);
    setMinConfidence(view.state.minConfidence);
    setActiveTypes(view.state.activeTypes);
    setShowClusters(view.state.showClusters);
    setShowBookmarks(false);
  };

  const handleDeleteView = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSavedViews(prev => prev.filter(v => v.id !== id));
  };

  const getClusterBounds = (cluster: GraphCluster) => {
    const clusterNodes = NODES.filter(n => cluster.nodeIds.includes(n.id));
    if (clusterNodes.length === 0) return null;

    const xs = clusterNodes.map(n => n.x);
    const ys = clusterNodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // Add padding around the nodes
    return {
        x: minX - 80,
        y: minY - 50,
        width: (maxX - minX) + 160,
        height: (maxY - minY) + 100
    };
  };

  const getClusterStyle = (color: string) => {
    switch(color) {
        case 'emerald': return { stroke: '#10b981', fill: '#10b981' };
        case 'blue': return { stroke: '#3b82f6', fill: '#3b82f6' };
        case 'red': return { stroke: '#ef4444', fill: '#ef4444' };
        case 'purple': return { stroke: '#a855f7', fill: '#a855f7' };
        default: return { stroke: '#94a3b8', fill: '#94a3b8' };
    }
  };

  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case 'PROTEIN': return 'bg-blue-500 border-blue-400';
      case 'COMPOUND': return 'bg-emerald-500 border-emerald-400';
      case 'PATHWAY': return 'bg-purple-500 border-purple-400';
      case 'PHENOTYPE': return 'bg-red-500 border-red-400';
      default: return 'bg-slate-500 border-slate-400';
    }
  };

  const getNodeBorderColor = (type: NodeType) => {
    switch (type) {
      case 'PROTEIN': return 'border-blue-500';
      case 'COMPOUND': return 'border-emerald-500';
      case 'PATHWAY': return 'border-purple-500';
      case 'PHENOTYPE': return 'border-red-500';
      default: return 'border-slate-500';
    }
  };

  const getEdgeColor = (type: EdgeType) => {
    switch (type) {
      case 'INHIBITS': return '#ef4444'; // Red-500
      case 'ACTIVATES': return '#0ea5e9'; // Sky-500
      case 'ASSOCIATED_WITH': return '#94a3b8'; // Slate-400
    }
  };

  const getNature = (type: EdgeType) => {
      return (type === 'ACTIVATES' || type === 'INHIBITS') ? 'CAUSAL' : 'CORRELATIONAL';
  };

  const getExternalLinks = (node: GraphNode) => {
    if (node.type === 'PROTEIN') {
      return [
        { name: 'UniProt', url: `https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(node.label)}` },
        { name: 'NCBI Gene', url: `https://www.ncbi.nlm.nih.gov/gene/?term=${encodeURIComponent(node.label)}` },
        { name: 'AlphaFold DB', url: `https://alphafold.ebi.ac.uk/search/text/${encodeURIComponent(node.label)}` }
      ];
    }
    if (node.type === 'COMPOUND') {
      return [
        { name: 'PubChem', url: `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(node.label)}` },
        { name: 'DrugBank', url: `https://go.drugbank.com/searches?query=${encodeURIComponent(node.label)}` },
        { name: 'ChEMBL', url: `https://www.ebi.ac.uk/chembl/g/#search_results/all/query=${encodeURIComponent(node.label)}` }
      ];
    }
    return [
       { name: 'Google Scholar', url: `https://scholar.google.com/scholar?q=${encodeURIComponent(node.label)}` },
       { name: 'PubMed', url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(node.label)}` }
    ];
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Network className="text-indigo-400" />
            Causal Knowledge Graph
          </h2>
          <p className="text-slate-400 text-sm">
            Interactive visualization of causal biomedical relationships. 
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden relative">
        {/* Graph Canvas */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden shadow-inner group/canvas">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>

          {/* Controls Bar */}
          <div className="absolute top-4 left-4 z-20 flex gap-2">
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shadow-lg ${
                 showFilters 
                 ? 'bg-indigo-600 border-indigo-500 text-white' 
                 : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 backdrop-blur'
               }`}
               title="Filters"
             >
                <Sliders size={14}/>
                Filter
             </button>

             <button 
               onClick={setCausalOnly}
               className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 backdrop-blur text-xs font-medium transition-colors shadow-lg hover:text-white group"
               title="Show Causal Only (Activates/Inhibits)"
             >
                <GitPullRequest size={14} className="group-hover:text-pink-400 transition-colors"/>
                Causal Only
             </button>

             <button 
               onClick={() => setShowClusters(!showClusters)}
               className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shadow-lg ${
                 showClusters
                 ? 'bg-indigo-600 border-indigo-500 text-white' 
                 : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 backdrop-blur'
               }`}
               title="Toggle Clusters"
             >
                <BoxSelect size={14}/>
                Groups
             </button>

             <button 
               onClick={() => setShowBookmarks(!showBookmarks)}
               className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shadow-lg ${
                 showBookmarks
                 ? 'bg-indigo-600 border-indigo-500 text-white' 
                 : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 backdrop-blur'
               }`}
               title="Bookmarks"
             >
                <Bookmark size={14}/>
                Views
             </button>

             <button 
                onClick={handleResetView}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 backdrop-blur text-xs font-medium transition-colors shadow-lg"
                title="Reset View"
             >
                 <RotateCcw size={14} />
                 Reset
             </button>

             {/* Search Bar */}
             <div className="relative">
                <div className={`flex items-center bg-slate-800/90 backdrop-blur border ${isSearchFocused ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-700'} rounded-lg transition-all w-64 shadow-lg`}>
                    <Search size={14} className="text-slate-400 ml-3 flex-shrink-0" />
                    <input 
                        type="text"
                        placeholder="Search nodes by ID or Label..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        className="bg-transparent border-none text-xs text-white placeholder-slate-500 px-3 py-2 w-full focus:outline-none"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="mr-2 text-slate-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {isSearchFocused && searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                        {filteredNodes.length > 0 ? (
                            filteredNodes.map(node => (
                                <button
                                    key={node.id}
                                    onClick={() => handleSearchSelect(node)}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors flex items-center gap-3 border-b border-slate-700/50 last:border-0"
                                >
                                    <div className={`w-2 h-2 rounded-full ${getNodeColor(node.type).split(' ')[0]}`}></div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">{node.label}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">ID: {node.id} • {node.type}</div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-3 text-xs text-slate-500 text-center italic">No matching nodes found</div>
                        )}
                    </div>
                )}
             </div>
          </div>

          {/* Bookmarks Panel */}
          {showBookmarks && (
            <div className="absolute top-14 left-4 z-30 w-64 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-3">
                 <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Bookmark size={12} /> Saved Views
                 </span>
                 <button onClick={handleSaveView} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors">
                    <Save size={10} /> Save
                 </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                 {savedViews.length === 0 && <p className="text-xs text-slate-500 italic text-center py-2">No saved views</p>}
                 {savedViews.map(view => (
                     <div key={view.id} className="bg-slate-900/50 border border-slate-700/50 rounded p-2 flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                        <button onClick={() => handleLoadView(view)} className="text-left flex-1">
                            <div className="text-sm text-slate-200 font-medium truncate group-hover:text-indigo-400 transition-colors">{view.name}</div>
                            <div className="text-[10px] text-slate-500">{view.timestamp}</div>
                        </button>
                        {view.id !== 'default' && (
                            <button onClick={(e) => handleDeleteView(e, view.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={12} />
                            </button>
                        )}
                     </div>
                 ))}
              </div>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <div className="absolute top-14 left-4 z-30 w-64 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Confidence Score</span>
                  <span className="text-xs font-mono text-emerald-400">{(minConfidence * 100).toFixed(0)}%+</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="0.99" step="0.01"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Relationship Type</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={activeTypes.ACTIVATES} 
                      onChange={() => toggleFilter('ACTIVATES')}
                      className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm text-slate-200 flex items-center gap-2">
                      <Zap size={12} className="text-sky-400" /> Activates
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={activeTypes.INHIBITS} 
                      onChange={() => toggleFilter('INHIBITS')}
                      className="rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm text-slate-200 flex items-center gap-2">
                      <Ban size={12} className="text-red-400" /> Inhibits
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={activeTypes.ASSOCIATED_WITH} 
                      onChange={() => toggleFilter('ASSOCIATED_WITH')}
                      className="rounded border-slate-600 bg-slate-700 text-slate-500 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm text-slate-200 flex items-center gap-2">
                      <LinkIcon size={12} className="text-slate-400" /> Associated
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-1 rounded backdrop-blur"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Compound</div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-1 rounded backdrop-blur"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Protein</div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-1 rounded backdrop-blur"><div className="w-2 h-2 rounded-full bg-red-500"></div>Phenotype</div>
          </div>

          <svg className="w-full h-full absolute inset-0 pointer-events-auto" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <marker id="arrow-activates" markerWidth="14" markerHeight="14" refX="14" refY="7" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L14,7 L0,14" fill="#0ea5e9" />
              </marker>
              <marker id="arrow-inhibits" markerWidth="14" markerHeight="14" refX="14" refY="7" orient="auto" markerUnits="userSpaceOnUse">
                 <path d="M2,7 L14,7 M14,0 L14,14" stroke="#ef4444" strokeWidth="2" fill="none" />
              </marker>
              <marker id="arrow-associated" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="3" fill="#94a3b8" />
              </marker>

              {/* Glow filter for high confidence causal edges */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <g 
                style={{ 
                    transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.k})`, 
                    transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    transformOrigin: '0 0'
                }}
            >
                {/* Cluster Visualization Layer */}
                {showClusters && CLUSTERS.map(cluster => {
                  const bounds = getClusterBounds(cluster);
                  if (!bounds) return null;
                  const styles = getClusterStyle(cluster.color);
                  
                  return (
                    <g key={cluster.id} className="pointer-events-none transition-all duration-500 opacity-100 animate-fade-in">
                       <rect 
                          x={bounds.x} 
                          y={bounds.y} 
                          width={bounds.width} 
                          height={bounds.height}
                          rx="16"
                          fill={styles.fill}
                          fillOpacity="0.05"
                          stroke={styles.stroke}
                          strokeWidth="1"
                          strokeDasharray="4 4"
                          strokeOpacity="0.3"
                       />
                       <text
                          x={bounds.x + 10}
                          y={bounds.y - 10}
                          fill={styles.fill}
                          fontSize="10"
                          fontWeight="bold"
                          className="uppercase font-mono tracking-wider opacity-70"
                       >
                         {cluster.label}
                       </text>
                    </g>
                  );
                })}

                {filteredEdges.map((edge) => {
                const start = NODES.find(n => n.id === edge.source)!;
                const end = NODES.find(n => n.id === edge.target)!;
                const isSelected = selectedEdge?.id === edge.id;
                
                // NEW: Hover logic
                const isHoveredEdge = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
                
                const isCausal = getNature(edge.type) === 'CAUSAL';
                const isHighConfidence = edge.confidence > 0.9;
                
                // Width Calculation
                const baseWidth = isCausal ? 2 : 1;
                const widthRange = isCausal ? 5 : 2; 
                const dynamicWidth = baseWidth + (Math.pow(edge.confidence, 3) * widthRange);
                // Increase width if selected or hovered
                const strokeWidth = (isSelected || isHoveredEdge) ? dynamicWidth + 3 : dynamicWidth;
                
                // Opacity Calculation
                const minOpacity = isCausal ? 0.5 : 0.3;
                const maxOpacity = isCausal ? 1.0 : 0.7;
                let dynamicOpacity = isSelected ? 1 : minOpacity + (edge.confidence * (maxOpacity - minOpacity));
                
                // If hovering, highlight connected edges and dim others
                if (hoveredNode && !selectedNode && !selectedEdge) {
                    dynamicOpacity = isHoveredEdge ? 1 : 0.1;
                }

                // Dash Pattern
                const dashSolid = 2 + (edge.confidence * 6);
                const dashGap = 10 - (edge.confidence * 5);
                const dashArray = isCausal ? 'none' : `${dashSolid},${dashGap}`;

                return (
                    <g key={edge.id} onClick={() => handleEdgeClick(edge)} className="cursor-pointer group">
                    <line 
                        x1={start.x} y1={start.y} 
                        x2={end.x} y2={end.y} 
                        stroke="transparent" 
                        strokeWidth="20" 
                    />
                    <line 
                        x1={start.x} y1={start.y} 
                        x2={end.x} y2={end.y} 
                        stroke={getEdgeColor(edge.type)} 
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                        strokeLinecap={isCausal ? "round" : "butt"}
                        strokeOpacity={dynamicOpacity}
                        markerEnd={edge.type === 'INHIBITS' ? 'url(#arrow-inhibits)' : edge.type === 'ACTIVATES' ? 'url(#arrow-activates)' : 'url(#arrow-associated)'}
                        className="transition-all duration-300"
                        filter={((isCausal && isHighConfidence) || isHoveredEdge) ? "url(#glow)" : undefined}
                    />
                    
                    {(isSelected || (isCausal && edge.confidence > 0.85) || isHoveredEdge) && (
                        <foreignObject x={(start.x + end.x)/2 - 12} y={(start.y + end.y)/2 - 12} width="24" height="24">
                        <div 
                            className={`
                            flex items-center justify-center w-6 h-6 rounded-full border shadow-sm transition-all duration-300 scale-75
                            ${edge.type === 'INHIBITS' ? 'bg-red-950 border-red-500 text-red-400' : 
                            edge.type === 'ACTIVATES' ? 'bg-sky-950 border-sky-500 text-sky-400' : 'bg-slate-800 border-slate-600 text-slate-400'}
                            `}
                            style={{ opacity: dynamicOpacity }}
                        >
                            {edge.type === 'INHIBITS' ? <Ban size={12} /> : edge.type === 'ACTIVATES' ? <Zap size={12} /> : <LinkIcon size={12} />}
                        </div>
                        </foreignObject>
                    )}
                    </g>
                );
                })}

                {NODES.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                
                // Selection relation check
                const isSelectedRelated = selectedNode && filteredEdges.some(e => 
                    (e.source === selectedNode.id && e.target === node.id) || 
                    (e.target === selectedNode.id && e.source === node.id)
                );
                
                // Hover checks
                const isHovered = hoveredNode === node.id;
                const isHoveredNeighbor = hoveredNode && filteredEdges.some(e => 
                    (e.source === hoveredNode && e.target === node.id) || 
                    (e.target === hoveredNode && e.source === node.id)
                );

                // Determine styling based on state priority
                let className = `w-full h-full flex items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-md cursor-pointer transition-all duration-300 ${getNodeColor(node.type)} bg-opacity-20 `;
                
                if (selectedNode) {
                    // Selection Mode
                    if (isSelected) {
                        className += 'ring-4 ring-white/10 scale-105 opacity-100 ';
                    } else if (isSelectedRelated) {
                        className += 'opacity-100 ';
                    } else {
                        className += 'opacity-20 grayscale '; // Dim unrelated
                    }
                } else if (hoveredNode) {
                    // Hover Mode
                    if (isHovered) {
                         className += 'ring-4 ring-white/30 scale-110 z-10 shadow-[0_0_20px_rgba(255,255,255,0.2)] opacity-100 ';
                    } else if (isHoveredNeighbor) {
                         className += 'ring-2 ring-white/10 scale-105 opacity-100 ';
                    } else {
                         className += 'opacity-20 grayscale blur-[1px] '; // Adding blur for depth
                    }
                } else {
                    // Default Mode
                    className += 'hover:scale-105 opacity-100 ';
                }
                
                return (
                    <foreignObject key={node.id} x={node.x - 60} y={node.y - 20} width="120" height="40">
                        <div
                            onClick={() => handleNodeClick(node)}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            className={className}
                        >
                            <span className="text-xs font-bold text-white tracking-wide truncate px-2">{node.label}</span>
                        </div>
                    </foreignObject>
                );
                })}
            </g>
          </svg>
        </div>

        {/* Inspector Panel */}
        <div className="w-80 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col transition-all duration-300">
          <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Info size={16} /> Inspector
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedNode && !selectedEdge && (
              <div className="text-center text-slate-500 mt-10">
                <ZoomIn className="mx-auto mb-3 opacity-50" size={48} />
                <p>Select a node or connection<br/>to view details & provenance.</p>
              </div>
            )}

            {selectedNode && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-bold text-slate-500 tracking-wider">ENTITY</span>
                     <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">{selectedNode.type}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{selectedNode.label}</h2>
                  <p className={`text-sm text-slate-300 leading-relaxed border-l-2 pl-3 ${getNodeBorderColor(selectedNode.type)}`}>
                    {selectedNode.description}
                  </p>
                </div>

                <div className="space-y-3">
                   <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                     <Database size={12} className="text-slate-400" />
                     External Databases
                   </h4>
                   <div className="grid grid-cols-2 gap-2">
                      {getExternalLinks(selectedNode).map((link) => (
                        <a 
                          key={link.name}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 rounded text-xs text-slate-300 flex items-center justify-center gap-2 transition-all group shadow-sm"
                        >
                          <ExternalLink size={12} className="group-hover:text-indigo-400"/> 
                          {link.name}
                        </a>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {selectedEdge && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-slate-500 tracking-wider">RELATIONSHIP</span>
                     <div className="flex gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            getNature(selectedEdge.type) === 'CAUSAL' 
                            ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                            {getNature(selectedEdge.type)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            selectedEdge.type === 'INHIBITS' ? 'text-red-400 bg-red-900/20' : 
                            selectedEdge.type === 'ACTIVATES' ? 'text-sky-400 bg-sky-900/20' : 'text-slate-400 bg-slate-800'
                        }`}>
                            {selectedEdge.type}
                        </span>
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mb-6 p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getNodeColor(NODES.find(n => n.id === selectedEdge.source)!.type).split(' ')[0]}`}></div>
                        <span className="font-mono text-sm text-slate-300">{NODES.find(n => n.id === selectedEdge.source)?.label}</span>
                      </div>
                      <div className="ml-1 pl-2 border-l border-slate-700 py-1">
                          <span className={`text-xs font-bold flex items-center gap-1 ${
                              selectedEdge.type === 'INHIBITS' ? 'text-red-400' : 
                              selectedEdge.type === 'ACTIVATES' ? 'text-sky-400' : 'text-slate-500'
                          }`}>
                              {selectedEdge.type === 'INHIBITS' ? <Ban size={10}/> : selectedEdge.type === 'ACTIVATES' ? <Zap size={10}/> : <LinkIcon size={10}/>}
                              {selectedEdge.type}
                          </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getNodeColor(NODES.find(n => n.id === selectedEdge.target)!.type).split(' ')[0]}`}></div>
                        <span className="font-mono text-sm text-white font-bold">{NODES.find(n => n.id === selectedEdge.target)?.label}</span>
                      </div>
                  </div>
                  
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs text-slate-400 flex items-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-500"/> Confidence Score
                       </span>
                       <span className="text-emerald-400 font-mono font-bold">{(selectedEdge.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500" style={{width: `${selectedEdge.confidence * 100}%`}}></div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b ${
                      getNature(selectedEdge.type) === 'CAUSAL' ? 'from-purple-500/0 via-purple-500/50 to-purple-500/0' : 'from-slate-500/0 via-slate-500/30 to-slate-500/0'
                  }`}></div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                     <FileText size={14} /> 
                     {getNature(selectedEdge.type) === 'CAUSAL' ? 'Evidence for Causal Claim' : 'Association Source'}
                  </h4>
                  
                  <a 
                    href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${selectedEdge.provenance.pmcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-800 border border-slate-700 p-4 rounded-lg relative overflow-hidden group hover:border-indigo-500/50 transition-colors hover:bg-slate-800/80 cursor-pointer"
                  >
                     <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={16} className="text-slate-400 group-hover:text-indigo-400" />
                     </div>
                     <p className="text-xs text-indigo-300 font-mono mb-2">PMCID: {selectedEdge.provenance.pmcid}</p>
                     <h5 className="text-sm font-semibold text-white mb-1 leading-snug">{selectedEdge.provenance.paperTitle}</h5>
                     <p className="text-xs text-slate-400 mb-4">{selectedEdge.provenance.author}, {selectedEdge.provenance.year}</p>
                     
                     <div className="bg-slate-900/80 p-3 rounded border border-slate-700/50 relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l"></div>
                        <p className="text-xs text-slate-300 italic font-serif leading-relaxed pl-2">
                           "{selectedEdge.provenance.snippet}"
                        </p>
                     </div>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
