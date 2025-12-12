import React, { useState, useEffect } from 'react';
import { generateUncertaintyAnalysis } from '../services/geminiService';
import { UncertaintyReport, UncertaintyPoint } from '../types';
import { BarChart2, ShieldAlert, Activity, Eye, Zap, AlertTriangle, Layers, Info } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, ErrorBar, Cell } from 'recharts';

const UncertaintyDashboard: React.FC = () => {
  const [modelType, setModelType] = useState<'Ensemble' | 'MC Dropout' | 'Bayesian NN'>('Ensemble');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<UncertaintyReport | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);

  useEffect(() => {
    handleRunAnalysis();
  }, [modelType]);

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      // Simulate dataset size
      const result = await generateUncertaintyAnalysis(modelType, 1000);
      setReport(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for "Uncertainty vs Error" plot
  // We need to calculate error if actual is present, otherwise just show uncertainty
  const uncertaintyVsErrorData = report?.predictions
    .filter(p => p.actual !== null && p.actual !== undefined)
    .map(p => ({
      ...p,
      error: Math.abs(p.predicted - (p.actual || 0)),
    })) || [];

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="text-yellow-400" />
            Uncertainty Quantification Lab
          </h2>
          <p className="text-slate-400 text-sm">
            Calibrate model confidence and detect out-of-distribution (OOD) risks before deployment.
          </p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
            {(['Ensemble', 'MC Dropout', 'Bayesian NN'] as const).map((type) => (
                <button
                    key={type}
                    onClick={() => setModelType(type)}
                    className={`px-4 py-2 text-xs font-bold rounded transition-all ${
                        modelType === type 
                        ? 'bg-yellow-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    {type}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
          <div className="flex-1 flex items-center justify-center flex-col text-slate-500">
              <Activity size={48} className="animate-spin mb-4 text-yellow-500"/>
              <p>Running Monte Carlo simulations...</p>
          </div>
      ) : report ? (
        <div className="flex-1 flex gap-6 overflow-hidden">
            
            {/* Left Column: Metrics & Calibration */}
            <div className="w-96 flex flex-col gap-6 overflow-y-auto">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">ECE Score</div>
                        <div className="text-2xl font-mono text-white flex items-baseline gap-2">
                            {report.metrics.ece.toFixed(3)}
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${
                                report.metrics.ece < 0.05 ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-red-900/30 text-red-400 border-red-800'
                            }`}>
                                {report.metrics.ece < 0.05 ? 'Good' : 'Poor'}
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">Expected Calibration Error</div>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">OOD Detection</div>
                        <div className="text-2xl font-mono text-white">
                            {(report.oodDetectionRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">Out-of-Distribution Rate</div>
                    </div>
                </div>

                {/* Reliability Diagram */}
                <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl flex-1 flex flex-col min-h-[300px]">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Layers size={16} className="text-yellow-400"/> Reliability Diagram
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={report.calibrationCurve}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis 
                                    dataKey="predictedProbability" 
                                    type="number" 
                                    domain={[0, 1]} 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    label={{ value: 'Predicted Prob', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                                />
                                <YAxis 
                                    domain={[0, 1]} 
                                    stroke="#64748b" 
                                    fontSize={10}
                                    label={{ value: 'Observed Freq', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontSize: '12px' }}
                                    formatter={(val: number) => val.toFixed(2)}
                                />
                                {/* Perfect Calibration Line */}
                                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#475569" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="observedFrequency" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                        Perfect calibration follows the diagonal dotted line.
                    </p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Info size={12}/> Analysis</h4>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{report.analysis}"
                    </p>
                </div>
            </div>

            {/* Right Column: Visualization */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                
                {/* Uncertainty vs Error Scatter */}
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col relative">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-400"/> Uncertainty vs. Prediction Error
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis 
                                    type="number" 
                                    dataKey="uncertainty" 
                                    name="Uncertainty (σ)" 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    label={{ value: 'Model Uncertainty (σ)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="error" 
                                    name="Absolute Error" 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                                />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs">
                                                    <p className="font-bold text-slate-200">{data.id}</p>
                                                    <p className="text-slate-400">Error: <span className="text-red-400">{data.error.toFixed(3)}</span></p>
                                                    <p className="text-slate-400">Uncertainty: <span className="text-yellow-400">{data.uncertainty.toFixed(3)}</span></p>
                                                    {data.inDistribution ? 
                                                        <span className="text-emerald-500 font-bold">In-Distribution</span> : 
                                                        <span className="text-red-500 font-bold">OOD Detected</span>
                                                    }
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Predictions" data={uncertaintyVsErrorData} fill="#8884d8">
                                    {uncertaintyVsErrorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.inDistribution ? '#3b82f6' : '#ef4444'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div> In-Distribution
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div> Out-of-Distribution (OOD)
                        </div>
                    </div>
                </div>

                {/* Prediction Intervals */}
                <div className="h-64 bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Eye size={16} className="text-emerald-400"/> Prediction Intervals (Batch Sample)
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Confidence Threshold:</span>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.1" 
                                value={confidenceThreshold} 
                                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                                className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                            <span className="text-xs font-mono text-yellow-400">{confidenceThreshold}</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis 
                                    dataKey="id" 
                                    type="category" 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    tick={false}
                                    label={{ value: 'Samples', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                                />
                                <YAxis 
                                    dataKey="predicted" 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs">
                                                    <p className="font-bold text-slate-200">{data.id}</p>
                                                    <p className="text-emerald-400">Pred: {data.predicted.toFixed(3)}</p>
                                                    <p className="text-slate-400">Uncertainty: ±{data.uncertainty.toFixed(3)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Predictions" data={report.predictions.slice(0, 20)} fill="#10b981">
                                    <ErrorBar dataKey="uncertainty" width={4} strokeWidth={2} stroke="#f59e0b" direction="y" />
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
      ) : null}
    </div>
  );
};

export default UncertaintyDashboard;
