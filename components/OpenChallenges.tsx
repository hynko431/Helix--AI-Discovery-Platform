import React, { useState, useEffect } from 'react';
import { generateChallenges, evaluateChallengeSubmission } from '../services/geminiService';
import { Challenge, LeaderboardEntry } from '../types';
import { Trophy, Target, Users, Calendar, Award, Upload, FileText, ChevronRight, Activity, Zap, RefreshCw, Lock, Download, Star } from 'lucide-react';

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, team: 'DeepMind Alpha', model: 'AlphaFold-3-Distilled', score: 0.942, date: '2023-11-20' },
    { rank: 2, team: 'Baker Lab', model: 'RoseTTAFold-X', score: 0.938, date: '2023-11-19' },
    { rank: 3, team: 'Meta AI', model: 'ESM-3', score: 0.925, date: '2023-11-18' },
    { rank: 4, team: 'Stanford NLP', model: 'BioMistral-v2', score: 0.890, date: '2023-11-15' },
    { rank: 5, team: 'Novartis DS', model: 'ChemBERTa-Tox', score: 0.885, date: '2023-11-12' },
];

const OpenChallenges: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEADERBOARD' | 'SUBMIT'>('OVERVIEW');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Submission State
  const [submissionNote, setSubmissionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ score: number, feedback: string, rank: number } | null>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    try {
        const data = await generateChallenges();
        setChallenges(data);
        if (data.length > 0) setSelectedChallenge(data[0]);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmission = async () => {
      if (!selectedChallenge || !submissionNote) return;
      setIsSubmitting(true);
      try {
          const result = await evaluateChallengeSubmission(selectedChallenge.title, submissionNote);
          setSubmissionResult(result);
      } catch (e) {
          console.error(e);
          alert("Evaluation failed.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ACTIVE': return 'bg-emerald-500';
          case 'UPCOMING': return 'bg-blue-500';
          case 'COMPLETED': return 'bg-slate-500';
          default: return 'bg-slate-500';
      }
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Trophy className="text-yellow-400" />
            Open Challenges & Benchmarks
          </h2>
          <p className="text-slate-400 text-sm">
            Community-driven scientific tasks to accelerate model validation and discovery.
          </p>
        </div>
        <button 
            onClick={loadChallenges}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Challenge List */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                    <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                        <Target size={16} className="text-yellow-400"/> Active Challenges
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {challenges.map(chall => (
                        <div 
                            key={chall.id}
                            onClick={() => { setSelectedChallenge(chall); setActiveTab('OVERVIEW'); setSubmissionResult(null); }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedChallenge?.id === chall.id 
                                ? 'bg-yellow-900/10 border-yellow-500/50' 
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-900 ${getStatusColor(chall.status)}`}>
                                    {chall.status}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <Users size={10}/> {chall.participants}
                                </span>
                            </div>
                            <h4 className={`font-bold text-sm mb-1 ${selectedChallenge?.id === chall.id ? 'text-white' : 'text-slate-300'}`}>
                                {chall.title}
                            </h4>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {chall.tags.slice(0, 2).map(t => (
                                    <span key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {challenges.length === 0 && !loading && (
                        <div className="text-center text-slate-500 py-8 text-xs italic">
                            No active challenges found.
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Center: Detail View */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden relative">
            {selectedChallenge ? (
                <>
                    {/* Detail Header */}
                    <div className="p-6 bg-slate-900/50 border-b border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{selectedChallenge.title}</h2>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1"><Calendar size={14}/> Deadline: {selectedChallenge.deadline}</span>
                                    {selectedChallenge.prizePool && (
                                        <span className="flex items-center gap-1 text-yellow-400 font-bold"><Award size={14}/> {selectedChallenge.prizePool}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                                <button 
                                    onClick={() => setActiveTab('OVERVIEW')}
                                    className={`px-4 py-2 text-xs font-bold rounded transition-all ${activeTab === 'OVERVIEW' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Overview
                                </button>
                                <button 
                                    onClick={() => setActiveTab('LEADERBOARD')}
                                    className={`px-4 py-2 text-xs font-bold rounded transition-all ${activeTab === 'LEADERBOARD' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Leaderboard
                                </button>
                                <button 
                                    onClick={() => setActiveTab('SUBMIT')}
                                    className={`px-4 py-2 text-xs font-bold rounded transition-all ${activeTab === 'SUBMIT' ? 'bg-yellow-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        
                        {activeTab === 'OVERVIEW' && (
                            <div className="max-w-3xl space-y-8 animate-in fade-in">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3">Challenge Description</h3>
                                    <p className="text-slate-300 leading-relaxed text-sm">
                                        {selectedChallenge.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                                        <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                                            <Activity size={16} className="text-emerald-400"/> Evaluation Metric
                                        </h4>
                                        <div className="text-2xl font-mono text-white mb-1">{selectedChallenge.metric}</div>
                                        <p className="text-xs text-slate-500">Submissions ranked by descending performance.</p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                                        <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                                            <FileText size={16} className="text-blue-400"/> Dataset
                                        </h4>
                                        <div className="text-sm font-medium text-white mb-2">{selectedChallenge.datasetName}</div>
                                        <button className="text-xs flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                                            <Download size={12}/> Download (1.2 GB)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'LEADERBOARD' && (
                            <div className="animate-in fade-in">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700">
                                        <tr>
                                            <th className="p-4 w-16 text-center">Rank</th>
                                            <th className="p-4">Team</th>
                                            <th className="p-4">Model</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4 text-right">Score ({selectedChallenge.metric})</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {MOCK_LEADERBOARD.map((entry) => (
                                            <tr key={entry.rank} className={`hover:bg-slate-700/20 transition-colors ${entry.rank === 1 ? 'bg-yellow-900/10' : ''}`}>
                                                <td className="p-4 text-center">
                                                    {entry.rank === 1 ? <Trophy size={16} className="text-yellow-400 mx-auto"/> : <span className="font-mono text-slate-500">#{entry.rank}</span>}
                                                </td>
                                                <td className="p-4 font-bold text-white">{entry.team}</td>
                                                <td className="p-4 text-slate-300 font-mono text-xs">{entry.model}</td>
                                                <td className="p-4 text-slate-500 text-xs">{entry.date}</td>
                                                <td className="p-4 text-right font-mono font-bold text-emerald-400">{entry.score.toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'SUBMIT' && (
                            <div className="max-w-2xl mx-auto animate-in fade-in">
                                {!submissionResult ? (
                                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <Upload size={20} className="text-yellow-400"/> New Submission
                                        </h3>
                                        
                                        <div className="mb-4">
                                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Model Description / Notes</label>
                                            <textarea 
                                                value={submissionNote}
                                                onChange={(e) => setSubmissionNote(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-yellow-500 outline-none h-32 resize-none"
                                                placeholder="Describe your architecture, hyperparameters, and any specific techniques used..."
                                            />
                                        </div>

                                        <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-lg p-8 flex flex-col items-center justify-center mb-6 cursor-pointer hover:border-slate-500 transition-colors">
                                            <FileText size={32} className="text-slate-500 mb-2"/>
                                            <p className="text-sm text-slate-300 font-medium">Drag & drop predictions.csv</p>
                                            <p className="text-xs text-slate-500 mt-1">Max file size: 50MB</p>
                                        </div>

                                        <button 
                                            onClick={handleSubmission}
                                            disabled={isSubmitting || !submissionNote}
                                            className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                isSubmitting 
                                                ? 'bg-slate-700 text-slate-400 cursor-wait' 
                                                : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg'
                                            }`}
                                        >
                                            {isSubmitting ? <RefreshCw size={16} className="animate-spin"/> : <Zap size={16}/>}
                                            Evaluate Model
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center">
                                        <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-800">
                                            <Star size={32} className="text-emerald-400" fill="currentColor"/>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-1">Submission Evaluated!</h3>
                                        <p className="text-slate-400 text-sm mb-6">Your model has been successfully benchmarked.</p>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                                                <div className="text-xs text-slate-500 uppercase font-bold">Score</div>
                                                <div className="text-3xl font-mono text-white font-bold">{submissionResult.score.toFixed(4)}</div>
                                            </div>
                                            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                                                <div className="text-xs text-slate-500 uppercase font-bold">Rank</div>
                                                <div className="text-3xl font-mono text-yellow-400 font-bold">#{submissionResult.rank}</div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-left mb-6">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">AI Feedback</h4>
                                            <p className="text-sm text-slate-300 leading-relaxed italic">"{submissionResult.feedback}"</p>
                                        </div>

                                        <button 
                                            onClick={() => { setSubmissionResult(null); setSubmissionNote(''); }}
                                            className="text-sm text-slate-400 hover:text-white underline"
                                        >
                                            Submit another model
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-60">
                    <Trophy size={64} className="mb-4 text-slate-700"/>
                    <p>Select a challenge to view details</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default OpenChallenges;
