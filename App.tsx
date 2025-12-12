import React, { useState } from 'react';
import { ViewState } from './types';
import MoleculeDesigner from './components/MoleculeDesigner';
import LiteratureAgent from './components/LiteratureAgent';
import LabControl from './components/LabControl';
import KnowledgeGraph from './components/KnowledgeGraph';
import DataConnectors from './components/DataConnectors';
import MultiAgentWorkspace from './components/MultiAgentWorkspace';
import SimulationAgent from './components/SimulationAgent';
import DifferentiableScoring from './components/DifferentiableScoring';
import RetrosynthesisPlanner from './components/RetrosynthesisPlanner';
import RobustnessAnalysis from './components/RobustnessAnalysis';
import ProtocolGenerator from './components/ProtocolGenerator';
import AutonomousLab from './components/AutonomousLab';
import ActiveLearningDashboard from './components/ActiveLearningDashboard';
import UncertaintyDashboard from './components/UncertaintyDashboard';
import NegativeMiningDashboard from './components/NegativeMiningDashboard';
import CollaborativeReviewDashboard from './components/CollaborativeReviewDashboard';
import AuditLogDashboard from './components/AuditLogDashboard';
import IAMDashboard from './components/IAMDashboard';
import RegulatoryDashboard from './components/RegulatoryDashboard';
import ComputeOrchestration from './components/ComputeOrchestration';
import ModelRegistry from './components/ModelRegistry';
import MonitoringDashboard from './components/MonitoringDashboard';
import Marketplace from './components/Marketplace';
import IPManagementDashboard from './components/IPManagementDashboard';
import ReproducibilityStudio from './components/ReproducibilityStudio';
import OpenChallenges from './components/OpenChallenges';
import PlatformAnalytics from './components/PlatformAnalytics';
import { Dna, Beaker, FileText, Menu, LayoutDashboard, Network, Database, Users, Split, Layers, Factory, Shield, Bot, Activity, Compass, ShieldAlert, GitMerge, MessageSquare, FileCheck, Lock, Scale, Cloud, Server, Eye, ShoppingBag, BookOpen, Package, Trophy, TrendingUp, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderView = () => {
    switch (view) {
      case ViewState.MOLECULE_DESIGNER:
        return <MoleculeDesigner />;
      case ViewState.LITERATURE_AGENT:
        return <LiteratureAgent />;
      case ViewState.KNOWLEDGE_GRAPH:
        return <KnowledgeGraph />;
      case ViewState.DATA_CONNECTORS:
        return <DataConnectors />;
      case ViewState.MULTI_AGENT_WORKSPACE:
        return <MultiAgentWorkspace />;
      case ViewState.SIMULATION_AGENT:
        return <SimulationAgent />;
      case ViewState.DIFFERENTIABLE_SCORING:
        return <DifferentiableScoring />;
      case ViewState.RETROSYNTHESIS_PLANNER:
        return <RetrosynthesisPlanner />;
      case ViewState.ROBUSTNESS_ANALYSIS:
        return <RobustnessAnalysis />;
      case ViewState.PROTOCOL_GENERATOR:
        return <ProtocolGenerator />;
      case ViewState.AUTONOMOUS_EXECUTION:
        return <AutonomousLab />;
      case ViewState.ACTIVE_LEARNING:
        return <ActiveLearningDashboard />;
      case ViewState.UNCERTAINTY_DASHBOARD:
        return <UncertaintyDashboard />;
      case ViewState.NEGATIVE_MINING:
        return <NegativeMiningDashboard />;
      case ViewState.COLLABORATIVE_REVIEW:
        return <CollaborativeReviewDashboard />;
      case ViewState.AUDIT_LOG:
        return <AuditLogDashboard />;
      case ViewState.IAM_ADMIN:
        return <IAMDashboard />;
      case ViewState.REGULATORY_MODULE:
        return <RegulatoryDashboard />;
      case ViewState.COMPUTE_ORCHESTRATION:
        return <ComputeOrchestration />;
      case ViewState.MODEL_REGISTRY:
        return <ModelRegistry />;
      case ViewState.MONITORING_DASHBOARD:
        return <MonitoringDashboard />;
      case ViewState.MARKETPLACE:
        return <Marketplace />;
      case ViewState.IP_MANAGEMENT:
        return <IPManagementDashboard />;
      case ViewState.REPRODUCIBILITY_STUDIO:
        return <ReproducibilityStudio />;
      case ViewState.OPEN_CHALLENGES:
        return <OpenChallenges />;
      case ViewState.PLATFORM_ANALYTICS:
        return <PlatformAnalytics />;
      case ViewState.DASHBOARD:
      default:
        return <LabControl />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-10 relative`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
              <Dna className="text-cyan-500" />
              <span>HELIX</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Lab Dashboard" 
            active={view === ViewState.DASHBOARD}
            onClick={() => setView(ViewState.DASHBOARD)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<TrendingUp size={20} />} 
            label="ROI & Analytics" 
            active={view === ViewState.PLATFORM_ANALYTICS}
            onClick={() => setView(ViewState.PLATFORM_ANALYTICS)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<MessageSquare size={20} />} 
            label="Review Hub" 
            active={view === ViewState.COLLABORATIVE_REVIEW}
            onClick={() => setView(ViewState.COLLABORATIVE_REVIEW)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<ShoppingBag size={20} />} 
            label="Marketplace" 
            active={view === ViewState.MARKETPLACE}
            onClick={() => setView(ViewState.MARKETPLACE)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Trophy size={20} />} 
            label="Challenges" 
            active={view === ViewState.OPEN_CHALLENGES}
            onClick={() => setView(ViewState.OPEN_CHALLENGES)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Package size={20} />} 
            label="Reproducibility" 
            active={view === ViewState.REPRODUCIBILITY_STUDIO}
            onClick={() => setView(ViewState.REPRODUCIBILITY_STUDIO)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<BookOpen size={20} />} 
            label="IP & Patents" 
            active={view === ViewState.IP_MANAGEMENT}
            onClick={() => setView(ViewState.IP_MANAGEMENT)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Scale size={20} />} 
            label="Regulatory & GLP" 
            active={view === ViewState.REGULATORY_MODULE}
            onClick={() => setView(ViewState.REGULATORY_MODULE)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Activity size={20} />} 
            label="Monitoring & SLA" 
            active={view === ViewState.MONITORING_DASHBOARD}
            onClick={() => setView(ViewState.MONITORING_DASHBOARD)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<FileCheck size={20} />} 
            label="Compliance & Audit" 
            active={view === ViewState.AUDIT_LOG}
            onClick={() => setView(ViewState.AUDIT_LOG)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Lock size={20} />} 
            label="Identity & Access" 
            active={view === ViewState.IAM_ADMIN}
            onClick={() => setView(ViewState.IAM_ADMIN)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Cloud size={20} />} 
            label="Compute & Cost" 
            active={view === ViewState.COMPUTE_ORCHESTRATION}
            onClick={() => setView(ViewState.COMPUTE_ORCHESTRATION)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Server size={20} />} 
            label="Model Registry" 
            active={view === ViewState.MODEL_REGISTRY}
            onClick={() => setView(ViewState.MODEL_REGISTRY)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Beaker size={20} />} 
            label="Molecule Design" 
            active={view === ViewState.MOLECULE_DESIGNER}
            onClick={() => setView(ViewState.MOLECULE_DESIGNER)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Compass size={20} />} 
            label="Active Learning" 
            active={view === ViewState.ACTIVE_LEARNING}
            onClick={() => setView(ViewState.ACTIVE_LEARNING)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<GitMerge size={20} />} 
            label="Negative Mining" 
            active={view === ViewState.NEGATIVE_MINING}
            onClick={() => setView(ViewState.NEGATIVE_MINING)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<ShieldAlert size={20} />} 
            label="Uncertainty Lab" 
            active={view === ViewState.UNCERTAINTY_DASHBOARD}
            onClick={() => setView(ViewState.UNCERTAINTY_DASHBOARD)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Layers size={20} />} 
            label="Hybrid Scoring" 
            active={view === ViewState.DIFFERENTIABLE_SCORING}
            onClick={() => setView(ViewState.DIFFERENTIABLE_SCORING)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Factory size={20} />} 
            label="Retrosynthesis" 
            active={view === ViewState.RETROSYNTHESIS_PLANNER}
            onClick={() => setView(ViewState.RETROSYNTHESIS_PLANNER)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Split size={20} />} 
            label="Simulation Lab" 
            active={view === ViewState.SIMULATION_AGENT}
            onClick={() => setView(ViewState.SIMULATION_AGENT)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Shield size={20} />} 
            label="Robustness & Mutants" 
            active={view === ViewState.ROBUSTNESS_ANALYSIS}
            onClick={() => setView(ViewState.ROBUSTNESS_ANALYSIS)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Bot size={20} />} 
            label="Protocol Generator" 
            active={view === ViewState.PROTOCOL_GENERATOR}
            onClick={() => setView(ViewState.PROTOCOL_GENERATOR)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Eye size={20} />} 
            label="Autonomous Lab" 
            active={view === ViewState.AUTONOMOUS_EXECUTION}
            onClick={() => setView(ViewState.AUTONOMOUS_EXECUTION)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Network size={20} />} 
            label="Knowledge Graph" 
            active={view === ViewState.KNOWLEDGE_GRAPH}
            onClick={() => setView(ViewState.KNOWLEDGE_GRAPH)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Agent Workspace" 
            active={view === ViewState.MULTI_AGENT_WORKSPACE}
            onClick={() => setView(ViewState.MULTI_AGENT_WORKSPACE)}
            expanded={sidebarOpen}
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="Literature Agent" 
            active={view === ViewState.LITERATURE_AGENT}
            onClick={() => setView(ViewState.LITERATURE_AGENT)}
            expanded={sidebarOpen}
          />
          <div className="pt-4 mt-4 border-t border-slate-800">
            <SidebarItem 
                icon={<Database size={20} />} 
                label="Data Connectors" 
                active={view === ViewState.DATA_CONNECTORS}
                onClick={() => setView(ViewState.DATA_CONNECTORS)}
                expanded={sidebarOpen}
            />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
              Dr
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-white truncate">Dr. I. Siva Venkata Bhanu Prakash</div>
                <div className="text-xs text-slate-500 truncate">Lead Scientist</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-950">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 z-0">
          <div className="flex items-center gap-2 text-sm text-slate-400">
             <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs">v2.4.1-alpha</span>
             <span className="hidden md:inline"> | Connected to Google DeepMind GNoME API</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50 font-medium">
               <ShieldCheck size={12}/> GxP Mode Active
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               API: Active
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6 relative">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 z-[-1]">
            <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-900/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px]" />
          </div>
          
          {renderView()}
        </div>
      </main>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  expanded: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, expanded }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all
        ${active 
          ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/50' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }
        ${!expanded && 'justify-center'}
      `}
      title={!expanded ? label : undefined}
    >
      {icon}
      {expanded && <span className="font-medium text-sm">{label}</span>}
      {active && expanded && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
    </button>
  );
};

export default App;