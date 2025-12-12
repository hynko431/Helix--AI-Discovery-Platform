import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MoleculeCandidate, SearchResult, ResearchPaper, AgentPersona, ArgumentNode, SimulationVariable, SimulationOutcome, ScreeningResult, OptimizationStep, RetrosynthesisResult, RobustnessReport, RobotProtocol, ALPoint, ALBatchResult, UncertaintyReport, FailedExperiment, ModelVersion, CausalGraphData, AuditLogEntry, ComputeJob, ABExperiment, ActiveAlert, MetricPoint, MarketplaceItem, QuoteRequest, IPAnalysisReport, PackageManifest, Challenge, LeaderboardEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for Molecule Generation
const moleculeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative scientific name for the molecule." },
    target: { type: Type.STRING, description: "The biological target protein or pathway." },
    mechanism: { type: Type.STRING, description: "Brief description of how it works." },
    smiles: { type: Type.STRING, description: "Valid SMILES string representation." },
    molecularWeight: { type: Type.NUMBER, description: "Estimated molecular weight in g/mol." },
    logP: { type: Type.NUMBER, description: "Estimated lipophilicity (LogP)." },
    toxicityScore: { type: Type.NUMBER, description: "Predicted toxicity score between 0.0 (safe) and 1.0 (toxic)." },
    synthesisDifficulty: { type: Type.NUMBER, description: "Estimated synthesis difficulty 1-10." },
    rationale: { type: Type.STRING, description: "Why this molecule was designed for the target." },
    decisionSummary: {
        type: Type.OBJECT,
        description: "Structured explainable decision summary card.",
        properties: {
            primaryEvidence: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3-4 key scientific reasons supporting this candidate (SAR, binding modes)."
            },
            modelConfidence: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "0-100 confidence score." },
                    reliability: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    explanation: { type: Type.STRING, description: "Why the model is confident or not (e.g. 'Similar to training data')." }
                },
                required: ["score", "reliability", "explanation"]
            },
            counterEvidence: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 2-3 potential risks, liabilities, or reasons to reject."
            },
            synthesisFeasibility: {
                type: Type.OBJECT,
                properties: {
                    stepCount: { type: Type.NUMBER },
                    keyChallenges: { type: Type.ARRAY, items: { type: Type.STRING } },
                    startingMaterials: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["stepCount", "keyChallenges", "startingMaterials"]
            },
            uncertaintyAnalysis: {
                type: Type.OBJECT,
                properties: {
                    keyUnknowns: { type: Type.ARRAY, items: { type: Type.STRING } },
                    confidenceInterval: { type: Type.STRING }
                },
                required: ["keyUnknowns", "confidenceInterval"]
            }
        },
        required: ["primaryEvidence", "modelConfidence", "counterEvidence", "synthesisFeasibility", "uncertaintyAnalysis"]
    }
  },
  required: ["name", "target", "mechanism", "smiles", "molecularWeight", "logP", "rationale", "decisionSummary", "toxicityScore", "synthesisDifficulty"],
};

export const generateMoleculeCandidate = async (targetDescription: string): Promise<MoleculeCandidate> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Design a novel small molecule drug candidate for the following target or disease: ${targetDescription}. 
      Ensure the science is plausible based on medicinal chemistry principles.
      Generate a comprehensive Decision Summary card including evidence, confidence, risks, synthesis notes, and uncertainty analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: moleculeSchema,
        temperature: 0.7, // Some creativity for novel structures
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");
    return JSON.parse(text) as MoleculeCandidate;
  } catch (error) {
    console.error("Gemini Molecule Generation Error:", error);
    throw error;
  }
};

export const searchScientificLiterature = async (query: string): Promise<SearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find recent scientific developments, papers, or clinical trials regarding: ${query}. 
      Focus on mechanism of action and efficacy data. 
      Summarize the key findings in 2-3 paragraphs.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = response.text || "No summary available.";
    
    // Extract grounding chunks for sources
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: ResearchPaper[] = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => {
        let hostname = "Unknown Source";
        try {
          if (c.web?.uri) {
            hostname = new URL(c.web.uri).hostname;
          }
        } catch {
          // ignore invalid url
        }
        return {
          title: c.web?.title || "Unknown Source",
          url: c.web?.uri,
          source: hostname,
          snippet: "Source from Google Search Grounding"
        };
      });

    // Deduplicate sources based on URL
    const uniqueSources = Array.from(new Map(sources.map(item => [item.url, item])).values());

    return {
      summary,
      sources: uniqueSources
    };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};

// --- Multi-Agent Services ---

const critiqueSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['SUPPORT', 'DISPUTE', 'QUESTION', 'EVIDENCE'] },
    content: { type: Type.STRING, description: "The content of the argument/critique." },
    confidence: { type: Type.NUMBER, description: "Confidence score 0-1" }
  },
  required: ["type", "content", "confidence"]
};

export const generateAgentCritique = async (
  agent: AgentPersona,
  hypothesis: string,
  context: string
): Promise<{ type: 'SUPPORT' | 'DISPUTE' | 'QUESTION' | 'EVIDENCE', content: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a ${agent.role} named ${agent.name} with expertise in ${agent.expertise.join(', ')}.
      
      Current Hypothesis: "${hypothesis}"
      Context/Previous Arguments: "${context}"
      
      Provide a single, concise critical response or supporting argument based on your expertise. 
      Be scientific, critical, and constructive. If you spot a flaw, point it out. If you see potential, explain why.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: critiqueSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from agent");
    return JSON.parse(text);
  } catch (error) {
    console.error(`Agent ${agent.name} Error:`, error);
    return { type: 'QUESTION', content: "I need more data to form an opinion." };
  }
};

const refinementSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    content: { type: Type.STRING, description: "The refined hypothesis text." },
    rationale: { type: Type.STRING, description: "Why changes were made based on the arguments." }
  },
  required: ["content", "rationale"]
};

export const refineHypothesis = async (
  currentHypothesis: string,
  argumentsList: ArgumentNode[]
): Promise<{ content: string, rationale: string }> => {
  try {
    const argsText = argumentsList.map(a => `[${a.type}] ${a.content}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a Lead Scientific Orchestrator. 
      Current Hypothesis: "${currentHypothesis}"
      
      Team Arguments:
      ${argsText}
      
      Synthesize a NEW, refined version of the hypothesis that incorporates valid critiques and strengthens the proposition. 
      Provide a rationale for the changes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: refinementSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from orchestrator");
    return JSON.parse(text);
  } catch (error) {
    console.error("Refinement Error:", error);
    throw error;
  }
};

const causalGraphSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['MECHANISM', 'EVIDENCE', 'CANDIDATE', 'ASSAY', 'CLAIM'] },
          description: { type: Type.STRING }
        },
        required: ["id", "label", "type"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          relation: { type: Type.STRING, enum: ['SUPPORTS', 'REFUTES', 'CAUSES', 'VALIDATES'] }
        },
        required: ["source", "target", "relation"]
      }
    }
  },
  required: ["nodes", "edges"]
};

export const generateCausalGraph = async (hypothesis: string, argumentsList: ArgumentNode[]): Promise<CausalGraphData> => {
  try {
    const argsText = argumentsList.map(a => `[${a.type}] ${a.content}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Construct a causal argument map from the following scientific discussion.
      
      Hypothesis: "${hypothesis}"
      Arguments:
      ${argsText}
      
      Extract key entities as nodes (MECHANISM, EVIDENCE, CANDIDATE, ASSAY, CLAIM).
      Connect them with logical relationships (SUPPORTS, REFUTES, CAUSES, VALIDATES).
      Return a graph structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: causalGraphSchema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from causal graph generator");
    const result = JSON.parse(text);
    
    // Assign random IDs for robustness if needed, but schema handles it.
    // We trust Gemini to produce matching source/target IDs.
    return result as CausalGraphData;
  } catch (error) {
    console.error("Causal Graph Error:", error);
    throw error;
  }
};

// --- Simulation Services ---

const simulationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    baselineScore: { type: Type.NUMBER, description: "Score 0-100 for the baseline condition." },
    counterfactualScore: { type: Type.NUMBER, description: "Score 0-100 for the counterfactual condition." },
    confidenceLow: { type: Type.NUMBER, description: "Lower bound of confidence interval." },
    confidenceHigh: { type: Type.NUMBER, description: "Upper bound of confidence interval." },
    impactAnalysis: { type: Type.STRING, description: "Scientific explanation of the change in score." },
    riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
  },
  required: ["baselineScore", "counterfactualScore", "confidenceLow", "confidenceHigh", "impactAnalysis", "riskLevel"]
};

export const runCounterfactualSimulation = async (
  moleculeName: string,
  targetName: string,
  variable: SimulationVariable
): Promise<SimulationOutcome> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Perform a counterfactual simulation for the drug candidate: "${moleculeName}" targeting "${targetName}".
      
      Variable: ${variable.name}
      Baseline Condition: ${variable.baseline}
      Counterfactual Condition: ${variable.counterfactual}
      
      Predict the Efficacy/Binding Affinity score (0-100) for both conditions.
      Analyze the sensitivity of the drug to this change. 
      Provide a scientific rationale (e.g., changes in protonation state, steric hindrance, pathway activation).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: simulationSchema,
        temperature: 0.2, // Low temperature for consistent, analytical results
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from simulation");
    const result = JSON.parse(text);

    return {
      moleculeName,
      variableName: variable.name,
      baselineScore: result.baselineScore,
      counterfactualScore: result.counterfactualScore,
      delta: result.counterfactualScore - result.baselineScore,
      confidenceInterval: [result.confidenceLow, result.confidenceHigh],
      impactAnalysis: result.impactAnalysis,
      riskLevel: result.riskLevel
    };
  } catch (error) {
    console.error("Simulation Error:", error);
    throw error;
  }
};

// --- Differentiable Scoring Services ---

const screeningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    variants: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            variantName: { type: Type.STRING },
            smiles: { type: Type.STRING },
            mlScore: { type: Type.NUMBER, description: "Predicted pIC50, typically 5.0-10.0" },
            uncertainty: { type: Type.NUMBER, description: "0.0 to 1.0" }
        },
        required: ["variantName", "smiles", "mlScore", "uncertainty"]
      }
    }
  }
};

export const generateScreeningLibrary = async (scaffold: string, target: string): Promise<ScreeningResult[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 structural variants (R-group modifications) for the scaffold "${scaffold}" targeting "${target}".
      Predict a Machine Learning affinity score (pIC50) for each.
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: screeningSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from screening");
    const result = JSON.parse(text);
    
    return result.variants.map((v: any, index: number) => ({
      id: `var-${index}`,
      variantName: v.variantName,
      smiles: v.smiles,
      mlScore: v.mlScore,
      uncertainty: v.uncertainty,
      status: 'ML_SCORED'
    }));
  } catch (error) {
    console.error("Screening Error:", error);
    throw error;
  }
};

const physicsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dG: { type: Type.NUMBER, description: "Binding free energy in kcal/mol (negative is better)" },
    vdw: { type: Type.NUMBER, description: "Van der Waals energy component" },
    electrostatic: { type: Type.NUMBER, description: "Electrostatic energy component" },
    solvation: { type: Type.NUMBER, description: "Solvation energy component" }
  },
  required: ["dG", "vdw", "electrostatic", "solvation"]
};

export const runPhysicsRescoring = async (candidateName: string, target: string): Promise<{ dG: number, components: any }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Simulate a physics-based MM/GBSA rescoring calculation for "${candidateName}" against "${target}".
      Return plausible binding free energy values (dG typically -5 to -15 kcal/mol).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: physicsSchema,
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from physics");
    const result = JSON.parse(text);
    
    return {
      dG: result.dG,
      components: {
        vdw: result.vdw,
        electrostatic: result.electrostatic,
        solvation: result.solvation
      }
    };
  } catch (error) {
    console.error("Physics Error:", error);
    throw error;
  }
};

const optimizationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.NUMBER },
          score: { type: Type.NUMBER, description: "Improved binding energy" },
          modification: { type: Type.STRING, description: "Structural tweak performed" },
          gradient: { type: Type.NUMBER }
        },
        required: ["step", "score", "modification", "gradient"]
      }
    }
  }
};

export const runGradientOptimization = async (candidateName: string, initialScore: number): Promise<OptimizationStep[]> => {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Simulate a gradient-based optimization trajectory for "${candidateName}" starting at score ${initialScore}.
        Generate 5 steps of iterative structural refinement that improves the score (makes it more negative).
        Modifications should be subtle (e.g., "Rotate phenyl ring", "H-bond optimization").`,
        config: {
          responseMimeType: "application/json",
          responseSchema: optimizationSchema,
          temperature: 0.4,
        },
      });
  
      const text = response.text;
      if (!text) throw new Error("No output from optimization");
      return JSON.parse(text).steps;
  } catch (error) {
    console.error("Optimization Error:", error);
    throw error;
  }
};

// --- Retrosynthesis Services ---

const retrosynthesisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    targetMolecule: { type: Type.STRING },
    totalCost: { type: Type.NUMBER, description: "Total estimated cost in USD" },
    totalTimeHours: { type: Type.NUMBER, description: "Total estimated synthesis time in hours" },
    confidenceScore: { type: Type.NUMBER, description: "Feasibility score 0-1" },
    sustainabilityScore: { type: Type.NUMBER, description: "Green chemistry score 0-10" },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.NUMBER },
          description: { type: Type.STRING },
          reactionType: { type: Type.STRING },
          conditions: { type: Type.STRING },
          yield: { type: Type.NUMBER },
          estimatedTime: { type: Type.NUMBER },
          safetyHazards: { type: Type.ARRAY, items: { type: Type.STRING } },
          reagents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                vendor: { type: Type.STRING, description: "e.g. Sigma-Aldrich, WuXi" },
                catalogId: { type: Type.STRING },
                cost: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                availability: { type: Type.STRING, enum: ['IN_STOCK', 'LOW_STOCK', 'BACKORDER', 'SYNTHESIS_REQUIRED'] },
                leadTime: { type: Type.STRING }
              },
              required: ["name", "vendor", "cost", "availability"]
            }
          }
        },
        required: ["stepNumber", "description", "reactionType", "reagents", "conditions", "yield"]
      }
    }
  },
  required: ["targetMolecule", "steps", "totalCost", "totalTimeHours", "confidenceScore"]
};

export const generateRetrosynthesisRoute = async (smiles: string): Promise<RetrosynthesisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as an expert Organic Chemist and Procurement Manager.
      Generate a plausible retrosynthesis route for the molecule with SMILES: "${smiles}".
      Break it down into commercially available starting materials.
      Estimate costs (USD) and synthesis times (hours) realistically.
      Include vendors like Sigma-Aldrich, Enamine, etc.
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: retrosynthesisSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from retrosynthesis");
    
    const result = JSON.parse(text);
    return {
      ...result,
      costCurrency: 'USD'
    };
  } catch (error) {
    console.error("Retrosynthesis Error:", error);
    throw error;
  }
};

// --- Robustness Analysis Services ---

const robustnessSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallRobustness: { type: Type.NUMBER, description: "Score 0-100 indicating how well binding is maintained." },
    bindingVariance: { type: Type.NUMBER, description: "Statistical variance of binding energy scores." },
    criticalMutations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of mutations that severely reduce binding." },
    analysis: { type: Type.STRING, description: "Scientific summary of the ensemble results." },
    ensemble: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['WT', 'MUTANT'] },
          mutation: { type: Type.STRING },
          conformation: { type: Type.STRING, enum: ['Active', 'Inactive', 'Cryptic', 'Disordered'] },
          bindingEnergy: { type: Type.NUMBER, description: "dG in kcal/mol (negative is better)" },
          rmsd: { type: Type.NUMBER, description: "RMSD in Angstroms" }
        },
        required: ["name", "type", "mutation", "conformation", "bindingEnergy", "rmsd"]
      }
    }
  },
  required: ["overallRobustness", "bindingVariance", "criticalMutations", "ensemble", "analysis"]
};

export const runRobustnessAnalysis = async (moleculeName: string, targetName: string): Promise<RobustnessReport> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Perform a Structure Ensemble & Mutation Robustness Analysis for the molecule "${moleculeName}" binding to target "${targetName}".
      
      Simulate a structural ensemble (generated via AlphaFold-Multimer/MD) containing 12-15 members.
      Include the Wild Type (WT) in varying conformational states (Active/Inactive).
      Include common resistance mutations (e.g., if EGFR, use T790M, C797S; if KRAS, use G12D, Q61H, etc.).
      
      Predict the Binding Energy (dG) and structural RMSD for each.
      Calculate an overall robustness score based on how consistent the binding is.
      Identify any "critical vulnerabilities" where mutations abolish binding.
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: robustnessSchema,
        temperature: 0.6,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from robustness analysis");
    
    const result = JSON.parse(text);
    return {
      molecule: moleculeName,
      target: targetName,
      ...result
    };
  } catch (error) {
    console.error("Robustness Analysis Error:", error);
    throw error;
  }
};

// --- Robot Protocol Generator Services ---

const robotProtocolSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    platform: { type: Type.STRING, enum: ['OPENTRONS', 'HAMILTON', 'BECKMAN'] },
    scriptContent: { type: Type.STRING, description: "The full executable python/script code." },
    estimatedRuntime: { type: Type.NUMBER, description: "Estimated runtime in minutes." },
    tipsUsed: { type: Type.NUMBER, description: "Number of tips consumed." },
    deckLayout: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          slotId: { type: Type.STRING, description: "1-12 for Opentrons" },
          labwareType: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["slotId", "labwareType", "content"]
      }
    },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          order: { type: Type.NUMBER },
          action: { type: Type.STRING, enum: ['TRANSFER', 'MIX', 'INCUBATE', 'MOVE', 'THERMOCYCLE'] },
          description: { type: Type.STRING },
          durationSeconds: { type: Type.NUMBER },
          critical: { type: Type.BOOLEAN },
          // Simulation data
          sourceSlot: { type: Type.STRING, description: "Slot ID of source." },
          destSlot: { type: Type.STRING, description: "Slot ID of destination." },
          volume: { type: Type.NUMBER, description: "Liquid volume in uL." },
          temperature: { type: Type.NUMBER, description: "Temperature if incubating." }
        },
        required: ["id", "order", "action", "description", "durationSeconds", "critical"]
      }
    },
    safetyWarnings: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["name", "platform", "scriptContent", "deckLayout", "steps", "estimatedRuntime", "safetyWarnings", "tipsUsed"]
};

export const generateRobotProtocol = async (
  platform: 'OPENTRONS' | 'HAMILTON',
  taskDescription: string,
  parameters: string
): Promise<RobotProtocol> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Senior Laboratory Automation Engineer.
      Generate a fully executable robotic protocol for the ${platform} platform.
      Task: ${taskDescription}
      Parameters: ${parameters}
      
      Requirements:
      1. Generate valid ${platform === 'OPENTRONS' ? 'Python (Opentrons APIv2)' : 'Hamilton Venus Pseudo-code'} script.
      2. Define a complete deck layout with standard labware (e.g. opentrons_96_tiprack_300ul, nest_96_wellplate).
      3. Include specific safety warnings (e.g., volume limits, tip compatibility).
      4. Calculate estimated runtime.
      5. Include specific sourceSlot, destSlot (integers as strings '1'...'12'), and volume for each step where applicable to enable simulation.
      
      Return valid JSON matching the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: robotProtocolSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from robot protocol generator");
    
    const result = JSON.parse(text);
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...result
    };
  } catch (error) {
    console.error("Robot Protocol Error:", error);
    throw error;
  }
};

// --- Autonomous Lab Services ---

const qcAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    result: { type: Type.STRING, enum: ['PASS', 'FAIL', 'WARNING'] },
    reasoning: { type: Type.STRING, description: "Why it passed or failed based on the data." },
    confidence: { type: Type.NUMBER, description: "Confidence in the decision." }
  },
  required: ["result", "reasoning", "confidence"]
};

export const analyzeQCResult = async (metricName: string, value: number, context: string): Promise<{ result: 'PASS' | 'FAIL' | 'WARNING', reasoning: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Quality Control Specialist in a biotech lab.
      Analyze the following QC measurement.
      Metric: ${metricName}
      Measured Value: ${value}
      Context/Expectation: ${context}
      
      Decide if this PASSES, FAILS, or triggers a WARNING. 
      Fail if significant deviation (>10%). Warning if slight deviation.
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: qcAnalysisSchema,
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from QC analysis");
    return JSON.parse(text);
  } catch (error) {
    console.error("QC Analysis Error:", error);
    // Fallback safe mode
    return { result: 'WARNING', reasoning: "AI Analysis failed, manual review required." };
  }
};

const interventionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'CRITICAL'] },
    suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "description", "severity", "suggestedActions"]
};

export const suggestIntervention = async (errorType: string, context: string): Promise<{ title: string, description: string, suggestedActions: string[], severity: 'LOW' | 'MEDIUM' | 'CRITICAL' }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Lab Automation Support Engineer.
      An error occurred during an autonomous run.
      Error: ${errorType}
      Context: ${context}
      
      Suggest 2-3 specific resolution actions a human scientist can take.
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: interventionSchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from Intervention service");
    return JSON.parse(text);
  } catch (error) {
     console.error("Intervention Error:", error);
     return { 
       title: "System Error", 
       description: "AI failed to generate suggestions. Please check system logs.", 
       severity: "CRITICAL", 
       suggestedActions: ["Emergency Stop", "Manual Override"] 
     };
  }
};

// --- Active Learning Services ---

const activeLearningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    candidates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          molecule: { type: Type.STRING },
          x: { type: Type.NUMBER, description: "Latent space coordinate X (0-100)" },
          y: { type: Type.NUMBER, description: "Latent space coordinate Y (0-100)" },
          score: { type: Type.NUMBER, description: "Predicted Score (0-100)" },
          uncertainty: { type: Type.NUMBER, description: "Model Uncertainty (0-1)" },
          acquisitionScore: { type: Type.NUMBER, description: "Calculated acquisition value" }
        },
        required: ["molecule", "x", "y", "score", "uncertainty", "acquisitionScore"]
      }
    },
    reasoning: { type: Type.STRING }
  },
  required: ["candidates", "reasoning"]
};

export const generateActiveLearningBatch = async (
  currentData: ALPoint[],
  strategy: 'UCB' | 'EI' | 'PI',
  explorationWeight: number
): Promise<ALBatchResult> => {
  try {
    // Summarize current data for the prompt
    const dataSummary = currentData.map(p => 
      `${p.molecule}: Score ${p.score}, Pos(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Bayesian Optimization Algorithm for drug discovery.
      Current Data Points:
      ${dataSummary}
      
      Task: Propose a batch of 5 new candidate molecules to test next.
      Strategy: ${strategy} (Exploration Weight: ${explorationWeight}/10).
      
      Instructions:
      1. Analyze the 'latent space' implied by the current data.
      2. Identify regions of high potential (high score) or high uncertainty (unexplored).
      3. Generate 5 new molecules with coordinates (x,y), predicted scores, and uncertainty values.
      4. Calculate an 'acquisitionScore' for each based on the strategy.
      5. Provide a reasoning for the batch selection.
      
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: activeLearningSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from Active Learning service");
    
    const result = JSON.parse(text);
    return {
      candidates: result.candidates.map((c: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        status: 'RECOMMENDED',
        ...c
      })),
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error("Active Learning Error:", error);
    throw error;
  }
};

// --- Uncertainty & Calibration Services ---

const uncertaintySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    modelName: { type: Type.STRING },
    calibrationCurve: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          bin: { type: Type.NUMBER },
          predictedProbability: { type: Type.NUMBER },
          observedFrequency: { type: Type.NUMBER },
          count: { type: Type.NUMBER }
        },
        required: ["bin", "predictedProbability", "observedFrequency", "count"]
      }
    },
    predictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          predicted: { type: Type.NUMBER },
          actual: { type: Type.NUMBER, nullable: true },
          uncertainty: { type: Type.NUMBER },
          inDistribution: { type: Type.BOOLEAN }
        },
        required: ["id", "predicted", "uncertainty", "inDistribution"]
      }
    },
    metrics: {
      type: Type.OBJECT,
      properties: {
        ece: { type: Type.NUMBER },
        nll: { type: Type.NUMBER },
        brier: { type: Type.NUMBER }
      },
      required: ["ece", "nll", "brier"]
    },
    oodDetectionRate: { type: Type.NUMBER },
    analysis: { type: Type.STRING }
  },
  required: ["modelName", "calibrationCurve", "predictions", "metrics", "oodDetectionRate", "analysis"]
};

export const generateUncertaintyAnalysis = async (modelType: string, datasetSize: number): Promise<UncertaintyReport> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Bayesian Data Scientist interpreting a deep learning model for drug discovery.
      
      Model Type: ${modelType}
      Dataset Size: ${datasetSize}
      
      Generate a simulated Uncertainty Quantification Report.
      1. Create a Calibration Curve (10 bins) showing Predicted Prob vs Observed Frequency.
      2. Generate ~30 sample predictions with 'uncertainty' (sigma) and 'inDistribution' flags.
         - Correlate high uncertainty with high error or OOD data.
      3. Calculate metrics: Expected Calibration Error (ECE), NLL, Brier Score.
      4. Provide a textual analysis of the model's reliability.
      
      Return valid JSON conforming to the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: uncertaintySchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from Uncertainty service");
    return JSON.parse(text) as UncertaintyReport;
  } catch (error) {
    console.error("Uncertainty Analysis Error:", error);
    throw error;
  }
};

// --- Negative Mining Services ---

const failedExperimentsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    experiments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          moleculeName: { type: Type.STRING },
          target: { type: Type.STRING },
          assay: { type: Type.STRING },
          predictedActivity: { type: Type.NUMBER, description: "High predicted score (0-100)" },
          actualActivity: { type: Type.NUMBER, description: "Low observed score (0-100)" },
          failureReason: { type: Type.STRING, description: "Hypothesized reason e.g. 'False Positive', 'Insoluble'" }
        },
        required: ["moleculeName", "target", "assay", "predictedActivity", "actualActivity"]
      }
    }
  }
};

export const getFailedExperiments = async (): Promise<FailedExperiment[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 5 simulated "failed" drug discovery experiments where the AI model predicted high activity but the lab result was low/inactive.
      These serve as "Hard Negatives" for training.
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: failedExperimentsSchema,
        temperature: 0.6,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from failed experiments service");
    const result = JSON.parse(text);
    
    return result.experiments.map((exp: any, i: number) => ({
        id: `fail-${Date.now()}-${i}`,
        ...exp,
        failureDate: new Date().toLocaleDateString(),
        status: 'PENDING_REVIEW'
    }));
  } catch (error) {
    console.error("Failed Experiments Error:", error);
    throw error;
  }
};

const fineTuningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    newVersion: { type: Type.STRING },
    improvement: { type: Type.STRING, description: "Description of performance gain" },
    metrics: {
        type: Type.OBJECT,
        properties: {
            fpr: { type: Type.NUMBER, description: "New False Positive Rate" },
            precision: { type: Type.NUMBER },
            deltaFPR: { type: Type.NUMBER, description: "Change in FPR (negative is good)" }
        },
        required: ["fpr", "precision", "deltaFPR"]
    }
  },
  required: ["newVersion", "improvement", "metrics"]
};

export const triggerFineTuning = async (hardNegativesCount: number): Promise<{ version: ModelVersion, improvement: string }> => {
    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Simulate the result of fine-tuning a Graph Neural Network (GNN) on ${hardNegativesCount} new hard negative examples.
          
          Generate:
          1. A new version string (e.g. v2.4.X).
          2. Improved metrics (False Positive Rate should decrease).
          3. A summary of the improvement.
          
          Return valid JSON.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: fineTuningSchema,
            temperature: 0.4,
          },
        });
    
        const text = response.text;
        if (!text) throw new Error("No output from fine-tuning service");
        const result = JSON.parse(text);
        
        return {
            version: {
                version: result.newVersion,
                date: new Date().toLocaleDateString(),
                falsePositiveRate: result.metrics.fpr,
                precision: result.metrics.precision,
                hardNegativesCount: hardNegativesCount
            },
            improvement: result.improvement
        };
      } catch (error) {
        console.error("Fine Tuning Error:", error);
        throw error;
      }
};

// --- Audit & Compliance Services ---

const complianceReportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: ['COMPLIANT', 'WARNING', 'CRITICAL_RISK'] },
    summary: { type: Type.STRING },
    anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["status", "summary", "anomalies", "recommendations"]
};

export const generateComplianceReport = async (logs: AuditLogEntry[]): Promise<{ status: string, summary: string, anomalies: string[], recommendations: string[] }> => {
  try {
    // Pass a summarized version of logs to avoid token limits
    const logSummary = logs.map(l => `${l.timestamp} - ${l.action} by ${l.actor.name}: ${l.summary}`).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following audit logs for regulatory compliance (GxP/FDA 21 CFR Part 11).
      
      Logs:
      ${logSummary}
      
      Identify any potential integrity risks, unusual patterns (e.g. human overrides of high-risk warnings), or gaps in provenance.
      Return a JSON report.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: complianceReportSchema,
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from compliance service");
    return JSON.parse(text);
  } catch (error) {
    console.error("Compliance Report Error:", error);
    throw error;
  }
};

// --- Regulatory Services ---

const regTextSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: "Formal regulatory text." }
  },
  required: ["text"]
};

export const generateRegulatorySection = async (sectionType: string, context: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Draft a formal regulatory text section for an FDA/EMA submission.
      Section Type: ${sectionType} (e.g., "Non-Clinical Overview", "Quality Overall Summary").
      Context Data: "${context}"
      
      Tone: Formal, objective, scientific, and compliant with ICH guidelines.
      Return valid JSON with the text field.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: regTextSchema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from regulatory generator");
    return JSON.parse(text).text;
  } catch (error) {
    console.error("Regulatory Text Error:", error);
    return "Error generating regulatory text. Please consult manual SOPs.";
  }
};

// --- Compute Orchestration Services ---

const computeStrategySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestion: { type: Type.STRING, description: "Actionable strategy suggestion." },
    savedCost: { type: Type.NUMBER, description: "Estimated savings in USD." },
    newStrategy: { type: Type.STRING, enum: ['PERFORMANCE', 'COST_SAVER'] },
    reasoning: { type: Type.STRING }
  },
  required: ["suggestion", "savedCost", "newStrategy", "reasoning"]
};

export const optimizeComputeSchedule = async (jobs: ComputeJob[]): Promise<{ suggestion: string, savedCost: number, newStrategy: string, reasoning: string }> => {
  try {
    const jobSummary = jobs.map(j => `${j.name} (${j.priority}): ${j.status} - Est Cost $${j.estimatedCost}`).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the current compute job queue for cost optimization opportunities.
      Jobs:
      ${jobSummary}
      
      Identify opportunities to move non-critical jobs to Spot instances or off-peak hours.
      Return a strategic recommendation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: computeStrategySchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from compute optimizer");
    return JSON.parse(text);
  } catch (error) {
    console.error("Compute Optimization Error:", error);
    throw error;
  }
};

// --- Model Registry & A/B Testing Services ---

const abAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recommendation: { type: Type.STRING, enum: ['PROMOTE_CHALLENGER', 'KEEP_CHAMPION', 'CONTINUE_TESTING'] },
    reasoning: { type: Type.STRING, description: "Statistical explanation based on P-value and lift." },
    projectedImpact: { type: Type.STRING, description: "Expected outcome if promoted." }
  },
  required: ["recommendation", "reasoning", "projectedImpact"]
};

export const analyzeExperimentResults = async (experiment: ABExperiment): Promise<{ recommendation: string, reasoning: string, projectedImpact: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Data Scientist specializing in A/B testing.
      Analyze the following experiment results:
      Experiment: ${experiment.name}
      Traffic Split: ${experiment.trafficSplit}% to Challenger
      
      Model A (Champion) Conversion: ${(experiment.results.modelA_conversion * 100).toFixed(1)}%
      Model B (Challenger) Conversion: ${(experiment.results.modelB_conversion * 100).toFixed(1)}%
      P-Value: ${experiment.results.p_value}
      Confidence: ${(experiment.results.confidence * 100).toFixed(1)}%
      
      Recommend whether to promote the challenger, keep the champion, or gather more data.
      Consider statistical significance (alpha=0.05).
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: abAnalysisSchema,
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from A/B analysis");
    return JSON.parse(text);
  } catch (error) {
    console.error("A/B Analysis Error:", error);
    throw error;
  }
};

// --- Monitoring & SLA Services ---

const healthAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    rootCause: { type: Type.STRING, description: "Likely cause of the incident based on alert correlation." },
    remediation: { type: Type.STRING, description: "Suggested fix." },
    impact: { type: Type.STRING, description: "Business impact summary." }
  },
  required: ["rootCause", "remediation", "impact"]
};

export const analyzeSystemHealth = async (alerts: ActiveAlert[], metrics: MetricPoint[]): Promise<{ rootCause: string, remediation: string, impact: string }> => {
  try {
    const alertSummary = alerts.map(a => `[${a.severity}] ${a.message} (${a.serviceId})`).join('\n');
    const metricSummary = `Latest Metrics: Latency ${metrics[metrics.length-1].latency}ms, Errors ${metrics[metrics.length-1].errors}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Site Reliability Engineer (SRE).
      Analyze the following system state for root cause analysis.
      
      Active Alerts:
      ${alertSummary}
      
      Metrics Snapshot:
      ${metricSummary}
      
      Correlate the alerts to find the single most likely root cause (e.g. database lock causing API latency).
      Suggest a specific remediation step (e.g. scale out read replicas).
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: healthAnalysisSchema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from SRE analysis");
    return JSON.parse(text);
  } catch (error) {
    console.error("System Health Analysis Error:", error);
    throw error;
  }
};

// --- Marketplace Services ---

const marketplaceSearchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['ASSAY', 'REAGENT', 'SYNTHESIS', 'EQUIPMENT'] },
          vendorName: { type: Type.STRING },
          rating: { type: Type.NUMBER, description: "0-5" },
          sla: { type: Type.STRING, description: "e.g. '2 Weeks'" },
          price: { type: Type.NUMBER },
          description: { type: Type.STRING },
          verified: { type: Type.BOOLEAN }
        },
        required: ["name", "category", "vendorName", "rating", "sla", "price", "description", "verified"]
      }
    }
  }
};

export const searchMarketplace = async (query: string, categoryFilter: string): Promise<MarketplaceItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 5 plausible scientific marketplace items for drug discovery.
      User Query: "${query}"
      Category Filter: ${categoryFilter} (If 'ALL', return mixed results).
      
      Return realistic vendor names (e.g. Thermo Fisher, WuXi, Charles River) and pricing.
      Include 'verified' flag for trusted vendors.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: marketplaceSearchSchema,
        temperature: 0.6,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from marketplace search");
    const result = JSON.parse(text);
    
    return result.items.map((item: any, i: number) => ({
        id: `mkt-${Date.now()}-${i}`,
        name: item.name,
        category: item.category,
        price: item.price,
        currency: 'USD',
        description: item.description,
        deliveryTime: item.sla,
        vendor: {
            id: `vnd-${i}`,
            name: item.vendorName,
            rating: item.rating,
            sla: item.sla,
            verified: item.verified
        }
    }));
  } catch (error) {
    console.error("Marketplace Search Error:", error);
    throw error;
  }
};

const rfqSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    formattedSpecs: { type: Type.STRING, description: "Cleaned up technical specifications." },
    estimatedCostRange: { type: Type.STRING, description: "e.g. $5,000 - $8,000" },
    suggestedVendors: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "formattedSpecs", "estimatedCostRange", "suggestedVendors"]
};

export const draftRFQ = async (specs: string): Promise<QuoteRequest> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Draft a formal Request for Quote (RFQ) based on these user requirements:
      "${specs}"
      
      Format the specifications professionally. Estimate a realistic cost range. Suggest 3 known vendors.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: rfqSchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from RFQ drafter");
    const result = JSON.parse(text);
    
    return {
        id: `rfq-${Date.now()}`,
        title: result.title,
        description: result.formattedSpecs,
        status: 'DRAFT',
        estimatedCostRange: result.estimatedCostRange,
        suggestedVendors: result.suggestedVendors,
        createdDate: new Date().toLocaleDateString()
    };
  } catch (error) {
    console.error("RFQ Draft Error:", error);
    throw error;
  }
};

// --- IP Management Services ---

const ipAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    noveltyScore: { type: Type.NUMBER, description: "0-100 score indicating uniqueness." },
    freedomToOperate: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW', 'BLOCKED'] },
    riskAnalysis: { type: Type.STRING, description: "Detailed legal/scientific analysis of FTO risks." },
    generatedClaims: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Draft independent claims for the candidate." },
    keyPatents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.STRING },
          title: { type: Type.STRING },
          assignee: { type: Type.STRING },
          filingDate: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['GRANTED', 'PENDING', 'EXPIRED', 'ABANDONED'] },
          relevanceScore: { type: Type.NUMBER },
          similarityAnalysis: { type: Type.STRING }
        },
        required: ["number", "title", "assignee", "status", "relevanceScore", "similarityAnalysis"]
      }
    }
  },
  required: ["noveltyScore", "freedomToOperate", "riskAnalysis", "generatedClaims", "keyPatents"]
};

export const conductIPAnalysis = async (candidateName: string, smiles: string): Promise<IPAnalysisReport> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Patent Attorney and Chemist. Conduct a preliminary Freedom-to-Operate (FTO) and Novelty analysis for the following small molecule:
      
      Name: ${candidateName}
      SMILES: ${smiles}
      
      Compare against known chemical space (simulated patent database). 
      Identify potentially blocking patents (e.g. from major competitors like Novartis, Pfizer, Merck).
      Draft 3 independent claims that could cover this specific structure.
      
      Return valid JSON matching the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: ipAnalysisSchema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from IP analysis");
    const result = JSON.parse(text);
    
    return {
      candidateName,
      smiles,
      lastUpdated: new Date().toLocaleDateString(),
      ...result,
      keyPatents: result.keyPatents.map((p: any, i: number) => ({
          id: `pat-${i}`,
          claims: [], // Schema didn't ask for full claims of existing patents to save tokens
          ...p
      }))
    };
  } catch (error) {
    console.error("IP Analysis Error:", error);
    throw error;
  }
};

// --- Reproducibility Services ---

const packageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dockerfile: { type: Type.STRING, description: "Content of Dockerfile." },
    requirements: { type: Type.STRING, description: "Content of requirements.txt." },
    readme: { type: Type.STRING, description: "Markdown README explaining the experiment." },
    metadataJson: { type: Type.STRING, description: "JSON string of manifest metadata." }
  },
  required: ["dockerfile", "requirements", "readme", "metadataJson"]
};

export const generatePackageManifest = async (experimentName: string, context: string, privacyLevel: string): Promise<PackageManifest> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a Reproducible Research Package configuration for the following experiment:
      
      Experiment: ${experimentName}
      Context: ${context}
      Privacy Level: ${privacyLevel}
      
      Requirements:
      1. Generate a valid Dockerfile (Python based, install standard scientific stack).
      2. Generate a requirements.txt with plausible dependencies.
      3. Generate a comprehensive README.md describing the experiment, how to run it, and dataset provenance.
      4. If privacy is 'RESTRICTED', ensure the README mentions data redaction protocols.
      
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: packageSchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from package generator");
    return JSON.parse(text);
  } catch (error) {
    console.error("Package Generation Error:", error);
    throw error;
  }
};

// --- Open Challenges Services ---

const challengesSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    challenges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          datasetName: { type: Type.STRING },
          metric: { type: Type.STRING },
          deadline: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['ACTIVE', 'UPCOMING', 'COMPLETED'] },
          participants: { type: Type.NUMBER },
          prizePool: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "description", "datasetName", "metric", "deadline", "status", "participants", "tags"]
      }
    }
  },
  required: ["challenges"]
};

export const generateChallenges = async (): Promise<Challenge[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 4 diverse scientific challenges for a drug discovery community platform.
      Topics: Protein Folding, Toxicity Prediction, Synthesis Optimization, Target Identification.
      Include realistic metrics (e.g. RMSE, F1) and deadlines.
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: challengesSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from challenges generator");
    const result = JSON.parse(text);
    
    return result.challenges.map((c: any, i: number) => ({
      id: `chall-${i}`,
      ...c
    }));
  } catch (error) {
    console.error("Challenges Generation Error:", error);
    throw error;
  }
};

const evaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "The calculated score based on metric." },
    feedback: { type: Type.STRING, description: "Constructive feedback on the model." },
    rank: { type: Type.NUMBER, description: "Simulated rank on leaderboard." }
  },
  required: ["score", "feedback", "rank"]
};

export const evaluateChallengeSubmission = async (challengeTitle: string, submissionNote: string): Promise<{ score: number, feedback: string, rank: number }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Simulate the evaluation of a submission for the scientific challenge: "${challengeTitle}".
      Submission Note: "${submissionNote}"
      
      Generate a realistic score (0.0 - 1.0 or appropriate range), rank (1-100), and specific scientific feedback.
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No output from evaluation");
    return JSON.parse(text);
  } catch (error) {
    console.error("Evaluation Error:", error);
    throw error;
  }
};
