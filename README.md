# Helix - AI Discovery Platform

**The Operating System for the Next Generation of Autonomous Drug Discovery.**

---

## 🧪 Executive Summary

Helix is a comprehensive, enterprise-grade pharmaceutical workbench designed to accelerate the drug discovery lifecycle—from initial hypothesis generation to robotic laboratory execution. By integrating Large Language Models (Google Gemini), causal AI, and autonomous agents with rigorous scientific simulation and laboratory hardware protocols, Helix bridges the gap between *in-silico* design and *in-vitro* validation.

The platform emphasizes **Human-in-the-Loop (HITL) safety**, **GxP regulatory compliance**, and **cost-efficient compute orchestration**, making it a viable solution for modern biotech firms aiming to reduce the time-to-clinic for novel therapeutics.

---

## 🚀 Key Features

### 1. Generative Molecular Design
*   **Molecule Designer**: Generate novel chemical entities (NCEs) targeting specific biological pathways (e.g., KRAS G12C). Get instant feedback on properties like LogP, molecular weight, and toxicity.
*   **Decision Summary Cards**: AI-generated "why" behind every candidate, detailing evidence, risks, and synthesis feasibility.

### 2. Autonomous Research Agents
*   **Literature Scout**: Semantic search across PubMed and clinical trials to monitor targets, diseases, and competitors in real-time.
*   **Multi-Agent War Room**: Collaborative chat environment where specialized AI personas (Chemist, Biologist, Toxicologist) debate and refine hypotheses.
*   **Causal Knowledge Graph**: Interactive visualization of biomedical relationships (activates, inhibits, causes) with provenance linking to source papers.

### 3. Advanced Simulation & Scoring
*   **Differentiable Scoring**: Multi-stage screening cascade combining fast ML inference with rigorous physics-based rescoring (MM/GBSA).
*   **Cost Gating**: Visual indicators showing where expensive compute jobs are gated behind cheaper ML filters.
*   **Robustness Analysis**: Stress-test candidates against structural ensembles and resistance mutations.
*   **Counterfactual Simulator**: Run "What-If" scenarios (e.g., "What if pH drops to 5.5?") to test candidate resilience.

### 4. Lab Automation (Robotics)
*   **Protocol Generator**: Convert natural language intent into executable scripts for Opentrons or Hamilton liquid handlers.
*   **Autonomous Lab Supervisor**: Digital twin interface for live execution monitoring with real-time telemetry (temp, RPM).
*   **Human-in-the-Loop Safety**: Mandatory "Human Safety Check" modal verifying deck layout and reagents before any physical robot action begins.

### 5. Enterprise Governance (GxP)
*   **Immutable Audit Ledger**: Blockchain-style log of all decisions, overrides, and model version changes for 21 CFR Part 11 compliance.
*   **Regulatory Dashboard**: Draft FDA/IND submission documents and manage electronic signatures.
*   **IAM & Data Vault**: Granular role-based access control with dynamic masking of PII and IP-sensitive sequences.

---

## 🛠️ Technical Architecture

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **AI Engine**: Google GenAI SDK (Gemini 2.5 Flash)
*   **Visualization**: Recharts for telemetry and scientific plotting
*   **Icons**: Lucide React
*   **State Management**: React Hooks (`useState`, `useEffect`, `useReducer`)

---

## 📦 Project Structure

```
helix-platform/
├── index.html              # Entry HTML
├── index.tsx               # React Root
├── App.tsx                 # Main Application Layout & Routing
├── types.ts                # TypeScript Interfaces & Enums
├── metadata.json           # App Metadata
├── services/
│   └── geminiService.ts    # AI API Integration Layer
└── components/
    ├── LabControl.tsx      # Main Dashboard
    ├── MoleculeDesigner.tsx# Generative Chemistry
    ├── LiteratureAgent.tsx # Research Scout
    ├── MultiAgentWorkspace.tsx # Collaborative AI
    ├── AutonomousLab.tsx   # Robotics Interface
    ├── DifferentiableScoring.tsx # ML Pipeline
    ├── PlatformAnalytics.tsx # ROI & Metrics
    └── ... (20+ other feature components)
```

---

## 🔧 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/helix.git
    cd helix
    ```

2.  **Install dependencies**
    *(Note: This project uses ES modules via importmap in `index.html` for the provided environment, but for local dev use `npm` or `yarn`)*
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 🛡️ Safety & Compliance

Helix is designed with a **"Safety First"** philosophy:

*   **GxP Mode**: A visual indicator in the header confirms when the system is operating under regulatory compliance logging.
*   **Physical Interlocks**: Automated runs cannot commence without explicit human verification of safety constraints.
*   **Negative Mining**: The system actively captures failed experiments to reduce false positives in future predictions.

---

## 🤝 Contributing

We welcome contributions from domain experts in computational chemistry, bioinformatics, and frontend engineering. Please see `CONTRIBUTING.md` for guidelines on submitting pull requests and reporting issues.

---

## 📄 License

Proprietary / Enterprise License. (See `LICENSE` file for details).

---

*Built with ❤️ for Science.*