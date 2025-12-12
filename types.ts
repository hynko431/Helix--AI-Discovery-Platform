export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  MOLECULE_DESIGNER = 'MOLECULE_DESIGNER',
  LITERATURE_AGENT = 'LITERATURE_AGENT',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE_GRAPH',
  DATA_CONNECTORS = 'DATA_CONNECTORS',
  MULTI_AGENT_WORKSPACE = 'MULTI_AGENT_WORKSPACE',
  SIMULATION_AGENT = 'SIMULATION_AGENT',
  DIFFERENTIABLE_SCORING = 'DIFFERENTIABLE_SCORING',
  RETROSYNTHESIS_PLANNER = 'RETROSYNTHESIS_PLANNER',
  ROBUSTNESS_ANALYSIS = 'ROBUSTNESS_ANALYSIS',
  PROTOCOL_GENERATOR = 'PROTOCOL_GENERATOR',
  AUTONOMOUS_EXECUTION = 'AUTONOMOUS_EXECUTION',
  ACTIVE_LEARNING = 'ACTIVE_LEARNING',
  UNCERTAINTY_DASHBOARD = 'UNCERTAINTY_DASHBOARD',
  NEGATIVE_MINING = 'NEGATIVE_MINING',
  COLLABORATIVE_REVIEW = 'COLLABORATIVE_REVIEW',
  AUDIT_LOG = 'AUDIT_LOG',
  IAM_ADMIN = 'IAM_ADMIN',
  REGULATORY_MODULE = 'REGULATORY_MODULE',
  COMPUTE_ORCHESTRATION = 'COMPUTE_ORCHESTRATION',
  MODEL_REGISTRY = 'MODEL_REGISTRY',
  MONITORING_DASHBOARD = 'MONITORING_DASHBOARD',
  MARKETPLACE = 'MARKETPLACE',
  IP_MANAGEMENT = 'IP_MANAGEMENT',
  REPRODUCIBILITY_STUDIO = 'REPRODUCIBILITY_STUDIO',
  OPEN_CHALLENGES = 'OPEN_CHALLENGES',
  PLATFORM_ANALYTICS = 'PLATFORM_ANALYTICS'
}

export interface DecisionSummary {
  primaryEvidence: string[];
  modelConfidence: {
    score: number; // 0-100
    reliability: 'High' | 'Medium' | 'Low';
    explanation: string;
  };
  counterEvidence: string[]; // Risks
  synthesisFeasibility: {
    stepCount: number;
    keyChallenges: string[];
    startingMaterials: string[];
  };
  uncertaintyAnalysis: {
    keyUnknowns: string[];
    confidenceInterval: string; // e.g. "± 0.5 pIC50"
  };
}

export interface MoleculeCandidate {
  name: string;
  target: string;
  mechanism: string;
  smiles: string;
  molecularWeight: number;
  logP: number;
  toxicityScore: number; // 0-1
  synthesisDifficulty: number; // 0-10
  rationale: string;
  decisionSummary?: DecisionSummary;
}

export interface ResearchPaper {
  title: string;
  source: string;
  snippet: string;
  url?: string;
}

export interface SearchResult {
  summary: string;
  sources: ResearchPaper[];
}

export interface LabStat {
  timestamp: string;
  synthesisRate: number;
  screeningSuccess: number;
}

export interface MonitorConfig {
  id: string;
  term: string;
  category: 'TARGET' | 'DISEASE' | 'COMPETITOR';
  status: 'ACTIVE' | 'PAUSED';
  lastHit: string;
  totalHits: number;
}

export interface MonitoringAlert {
  id: string;
  timestamp: string;
  monitorTerm: string;
  type: 'PAPER' | 'TRIAL' | 'PATENT';
  title: string;
  source: string;
  relevanceScore: number; // 0-100
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  url?: string;
  isNew: boolean;
}

// --- Multi-Agent Types ---

export interface AgentPersona {
  id: string;
  name: string;
  role: string;
  expertise: string[];
  color: string;
  avatar: string; // Initials or Icon name
}

export interface ArgumentNode {
  id: string;
  agentId: string;
  type: 'SUPPORT' | 'DISPUTE' | 'QUESTION' | 'EVIDENCE';
  content: string;
  parentId: string | null; // null if it's a root comment on the hypothesis
  timestamp: string;
  votes: number;
}

export interface HypothesisVersion {
  id: string;
  versionNumber: number;
  content: string;
  rationale: string;
  timestamp: string;
  status: 'DRAFT' | 'REVIEW' | 'CONSENSUS' | 'REJECTED';
}

export interface CausalNode {
  id: string;
  label: string;
  type: 'MECHANISM' | 'EVIDENCE' | 'CANDIDATE' | 'ASSAY' | 'CLAIM';
  description?: string;
  x?: number; // For visualization
  y?: number;
  vx?: number; // Velocity X
  vy?: number; // Velocity Y
}

export interface CausalEdge {
  id: string;
  source: string;
  target: string;
  relation: 'SUPPORTS' | 'REFUTES' | 'CAUSES' | 'VALIDATES';
}

export interface CausalGraphData {
  nodes: CausalNode[];
  edges: CausalEdge[];
}

// --- Simulation Types ---

export interface SimulationVariable {
  id: string;
  category: 'ENVIRONMENT' | 'GENETIC' | 'MOLECULAR';
  name: string;
  baseline: string;
  counterfactual: string;
}

export interface SimulationOutcome {
  moleculeName: string;
  variableName: string;
  baselineScore: number; // 0-100 (Efficacy/Binding)
  counterfactualScore: number;
  delta: number;
  confidenceInterval: [number, number]; // [low, high]
  impactAnalysis: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// --- Differentiable Scoring Types ---

export interface ScreeningResult {
  id: string;
  smiles: string;
  variantName: string;
  mlScore: number; // Predicted pIC50 (e.g., 6.0 - 9.0)
  uncertainty: number; // 0-1
  physicsScore?: number; // dG (kcal/mol)
  energyComponents?: {
    vdw: number;
    electrostatic: number;
    solvation: number;
  };
  status: 'QUEUED' | 'ML_SCORED' | 'PHYSICS_QUEUED' | 'PHYSICS_COMPLETED' | 'DISCARDED';
}

export interface OptimizationStep {
  step: number;
  score: number; // dG or pIC50
  modification: string; // Description of change
  gradient: number; // Magnitude of gradient
}

// --- Retrosynthesis Types ---

export interface Reagent {
  name: string;
  vendor: string;
  catalogId: string;
  cost: number; // price per unit
  unit: string; // e.g., 'g', 'mg', 'ml'
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'BACKORDER' | 'SYNTHESIS_REQUIRED';
  leadTime: string; // e.g., "2-3 days"
}

export interface SynthesisStep {
  stepNumber: number;
  description: string;
  reactionType: string;
  reagents: Reagent[];
  conditions: string; // e.g., "100°C, 2h, DMF"
  yield: number; // Percentage
  estimatedTime: number; // Hours
  safetyHazards: string[];
}

export interface RetrosynthesisResult {
  targetMolecule: string;
  totalCost: number;
  costCurrency: string;
  totalTimeHours: number;
  confidenceScore: number; // 0-1
  steps: SynthesisStep[];
  sustainabilityScore: number; // 0-10 (Green chemistry)
}

// --- Robustness Analysis Types ---

export interface EnsembleMember {
  id: string;
  name: string; // e.g. "G12D - Open State"
  type: 'WT' | 'MUTANT';
  mutation: string; // "WT" or specific mutation like "T790M"
  conformation: 'Active' | 'Inactive' | 'Cryptic' | 'Disordered';
  bindingEnergy: number; // dG kcal/mol
  rmsd: number; // Structural deviation in Angstroms from Crystal structure
}

export interface RobustnessReport {
  molecule: string;
  target: string;
  overallRobustness: number; // 0-100 score
  bindingVariance: number; // Statistical variance of binding energy
  criticalMutations: string[]; // List of mutations that kill binding
  ensemble: EnsembleMember[];
  analysis: string; // AI Summary
}

// --- Robot Protocol Generator Types ---

export interface DeckSlot {
  slotId: string; // "1" to "11" for Opentrons
  labwareType: string; // e.g. "opentrons_96_tiprack_300ul"
  content: string; // e.g. "p300 Tips", "MasterMix Plate"
}

export interface ProtocolStep {
  id: string;
  order: number;
  action: 'TRANSFER' | 'MIX' | 'INCUBATE' | 'MOVE' | 'THERMOCYCLE';
  description: string;
  durationSeconds: number;
  critical: boolean;
  // Simulation fields
  sourceSlot?: string;
  destSlot?: string;
  volume?: number;
  temperature?: number;
}

export interface RobotProtocol {
  id: string;
  name: string;
  platform: 'OPENTRONS' | 'HAMILTON' | 'BECKMAN';
  scriptContent: string; // The raw code
  deckLayout: DeckSlot[];
  steps: ProtocolStep[];
  estimatedRuntime: number; // Minutes
  safetyWarnings: string[];
  tipsUsed: number;
}

// --- Autonomous Lab Types ---

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
}

export interface TelemetryPoint {
  time: string;
  temp: number; // Celsius
  shakerRpm: number;
  turbidity: number; // OD600
}

export interface ExecutionStep {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'WAITING_QC';
  type: 'LIQUID' | 'TRANSPORT' | 'MEASURE' | 'QC_CHECK' | 'INCUBATE';
  duration?: number;
}

export interface InterventionRequest {
  id: string;
  type: 'QC_FAILURE' | 'HARDWARE_ERROR' | 'SAFETY_WARNING';
  title: string;
  description: string;
  suggestedActions: string[];
  severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
  dataSnapshot?: string; // e.g. "Measured: 15uL, Expected: 20uL"
}

// --- Active Learning Types ---

export interface ALPoint {
  id: string;
  x: number; // Latent dimension 1
  y: number; // Latent dimension 2
  score: number; // Actual or Predicted Activity (0-100)
  uncertainty: number; // 0-1 (Sigma)
  status: 'EXPLORED' | 'CANDIDATE' | 'UNEXPLORED' | 'RECOMMENDED';
  molecule: string;
  acquisitionScore?: number;
}

export interface ALBatchResult {
  candidates: ALPoint[];
  reasoning: string;
}

// --- Uncertainty & Calibration Types ---

export interface CalibrationData {
  bin: number;
  predictedProbability: number;
  observedFrequency: number;
  count: number;
}

export interface UncertaintyPoint {
  id: string;
  predicted: number;
  actual: number | null; // Null if not yet verified
  uncertainty: number; // Standard deviation or Entropy
  inDistribution: boolean; // OOD flag
}

export interface UncertaintyReport {
  modelName: string;
  calibrationCurve: CalibrationData[];
  predictions: UncertaintyPoint[];
  metrics: {
    ece: number; // Expected Calibration Error
    nll: number; // Negative Log Likelihood
    brier: number;
  };
  oodDetectionRate: number;
  analysis: string;
}

// --- Negative Mining Types ---

export interface FailedExperiment {
  id: string;
  moleculeName: string;
  target: string;
  assay: string;
  predictedActivity: number; // High score that was wrong
  actualActivity: number; // Low score observed
  failureDate: string;
  status: 'PENDING_REVIEW' | 'HARD_NEGATIVE' | 'TECHNICAL_FAILURE' | 'IGNORED';
  notes?: string;
}

export interface ModelVersion {
  version: string;
  date: string;
  falsePositiveRate: number;
  precision: number;
  hardNegativesCount: number;
}

// --- Collaborative Review Types ---

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

export interface ReviewComment {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  votes: number;
  annotation?: {
    targetText: string; // The specific text being annotated
    context?: string;
  };
}

export interface ReviewItem {
  id: string;
  type: 'MOLECULE' | 'PROTOCOL' | 'LITERATURE';
  title: string;
  description: string;
  owner: string;
  createdDate: string;
  status: ReviewStatus;
  data: any; // Flexible data payload (e.g. MoleculeCandidate or RobotProtocol)
  comments: ReviewComment[];
  approvals: string[]; // List of user IDs who approved
}

// --- Audit & Compliance Types ---

export enum AuditActionType {
  DECISION_APPROVED = 'DECISION_APPROVED',
  DECISION_REJECTED = 'DECISION_REJECTED',
  MODEL_VERSION_CHANGE = 'MODEL_VERSION_CHANGE',
  AGENT_RUN_COMPLETED = 'AGENT_RUN_COMPLETED',
  HUMAN_OVERRIDE = 'HUMAN_OVERRIDE',
  DATA_ACCESS = 'DATA_ACCESS',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export interface AuditLogEntry {
  id: string; // Block hash or unique ID
  blockId: number;
  previousHash: string; // Linking to previous entry
  timestamp: string;
  actor: {
    id: string;
    name: string;
    role: string;
  };
  action: AuditActionType;
  entityId: string;
  entityType: string; // 'MOLECULE', 'PROTOCOL', 'MODEL'
  summary: string;
  detailsJSON: string; // Full payload
  signature: string; // Cryptographic signature
  integrityStatus: 'VALID' | 'TAMPERED';
}

// --- IAM & RBAC Types ---

export type Permission = 
  | 'VIEW_PII' 
  | 'VIEW_PROPRIETARY_SEQUENCES' 
  | 'EDIT_SYSTEM_CONFIG' 
  | 'APPROVE_BUDGET' 
  | 'AUDIT_ACCESS'
  | 'MANAGE_USERS';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  clearanceLevel: 'L1' | 'L2' | 'L3' | 'L4';
}

export interface UserProfile {
  id: string;
  name: string;
  roleId: string;
  department: string;
  active: boolean;
  avatar: string; // Initials or short name
}

export interface SensitiveDataRecord {
  id: string;
  patientId: string; // Sensitive PII
  condition: string; // Public
  sequenceData: string; // Sensitive IP
  molecularFormula: string; // Sensitive IP
  siteId: string; // Public
}

// --- Regulatory & GLP Types ---

export interface ElectronicSignature {
  id: string;
  signerName: string;
  role: string;
  reason: 'AUTHORSHIP' | 'APPROVAL' | 'REVIEW';
  timestamp: string;
  status: 'VALID' | 'INVALID';
}

export interface RegulatoryDocument {
  id: string;
  title: string;
  type: 'PROTOCOL' | 'REPORT' | 'SOP' | 'SUBMISSION';
  version: string;
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'EFFECTIVE' | 'RETIRED';
  author: string;
  createdDate: string;
  contentSummary: string;
  signatures: ElectronicSignature[];
}

export interface SubmissionPackage {
  id: string;
  region: 'FDA' | 'EMA' | 'PMDA';
  type: 'IND' | 'NDA' | 'BLA';
  title: string;
  readinessScore: number; // 0-100
  documents: RegulatoryDocument[];
  targetDate: string;
  status: 'PLANNING' | 'ASSEMBLING' | 'READY';
}

// --- Compute & Orchestration Types ---

export interface ComputeNode {
  id: string;
  name: string;
  type: 'GPU_H100' | 'GPU_A100' | 'CPU_HIGH_MEM' | 'CPU_GENERAL';
  lifecycle: 'ON_DEMAND' | 'SPOT';
  status: 'RUNNING' | 'IDLE' | 'PREEMPTED' | 'STARTING';
  utilization: number; // 0-100%
  hourlyCost: number;
}

export interface ComputeJob {
  id: string;
  name: string;
  priority: 'CRITICAL' | 'NORMAL' | 'LOW';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PAUSED' | 'FAILED';
  estimatedCost: number;
  durationHours: number;
  checkpointed: boolean;
  assignedNodeId?: string;
  strategy: 'PERFORMANCE' | 'COST_SAVER';
}

// --- Model Registry & A/B Testing Types ---

export interface MLModel {
  id: string;
  name: string;
  version: string;
  framework: 'PyTorch' | 'TensorFlow' | 'JAX' | 'Scikit-Learn';
  status: 'PRODUCTION' | 'STAGING' | 'ARCHIVED' | 'TRAINING';
  metrics: {
    accuracy: number;
    latency: number; // ms
    f1Score: number;
  };
  lastUpdated: string;
  author: string;
}

export interface ABExperiment {
  id: string;
  name: string;
  modelA: string; // Champion Model ID
  modelB: string; // Challenger Model ID
  trafficSplit: number; // % to Model B (Challenger)
  status: 'RUNNING' | 'PAUSED' | 'CONCLUDED' | 'DRAFT';
  startDate: string;
  results: {
    modelA_conversion: number; // e.g. success rate of predictions
    modelB_conversion: number;
    p_value: number;
    confidence: number;
  };
}

// --- Monitoring & SLA Types ---

export interface ServiceHealth {
  id: string;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  uptime: number; // % 99.9xx
  latency: number; // ms
  errorRate: number; // %
  region: string;
}

export interface ActiveAlert {
  id: string;
  serviceId: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface MetricPoint {
  timestamp: string;
  latency: number;
  requests: number;
  errors: number;
}

export interface DriftMetric {
  feature: string;
  klDivergence: number; // > 0.1 is usually drift
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
  lastTrainingValue: number;
  currentValue: number;
}

// --- Marketplace Types ---

export interface Vendor {
  id: string;
  name: string;
  rating: number; // 0-5
  sla: string; // e.g. "24h Response"
  verified: boolean;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  category: 'ASSAY' | 'REAGENT' | 'SYNTHESIS' | 'EQUIPMENT';
  vendor: Vendor;
  price: number;
  currency: string;
  description: string;
  deliveryTime: string;
}

export interface QuoteRequest {
  id: string;
  title: string;
  description: string; // Natural language specs
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'ACCEPTED';
  estimatedCostRange: string;
  suggestedVendors: string[];
  createdDate: string;
}

// --- IP Management Types ---

export interface Patent {
  id: string;
  number: string; // e.g., US1234567B2
  title: string;
  assignee: string;
  filingDate: string;
  status: 'GRANTED' | 'PENDING' | 'EXPIRED' | 'ABANDONED';
  relevanceScore: number; // 0-100
  similarityAnalysis: string; // Why it's relevant
  claims: string[];
}

export interface IPAnalysisReport {
  candidateName: string;
  smiles: string;
  noveltyScore: number; // 0-100 (100 = completely novel)
  freedomToOperate: 'HIGH' | 'MEDIUM' | 'LOW' | 'BLOCKED';
  keyPatents: Patent[];
  riskAnalysis: string;
  generatedClaims: string[]; // Draft claims for the new invention
  lastUpdated: string;
}

// --- Reproducibility Types ---

export interface PackageManifest {
  dockerfile: string;
  requirements: string;
  readme: string;
  metadataJson: string;
}

export interface ExperimentData {
  id: string;
  name: string;
  date: string;
  description: string;
  framework: string; // 'PyTorch', 'JAX', etc.
  datasets: string[];
  status: 'COMPLETED' | 'FAILED' | 'RUNNING';
}

// --- Open Challenges Types ---

export interface Challenge {
  id: string;
  title: string;
  description: string;
  datasetName: string;
  metric: string; // e.g. "RMSE", "F1-Score"
  deadline: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  participants: number;
  prizePool?: string;
  tags: string[];
}

export interface LeaderboardEntry {
  rank: number;
  team: string;
  model: string;
  score: number;
  date: string;
}

// --- Platform Analytics Types ---
export const PLATFORM_ANALYTICS = 'PLATFORM_ANALYTICS';
