import React, { useState } from 'react';
import { ReviewItem, ReviewComment, ReviewStatus } from '../types';
import { MessageSquare, ThumbsUp, ThumbsDown, CheckCircle, XCircle, AlertCircle, FileText, Bot, Beaker, Clock, User, Send, Quote, Search, Filter, History, Edit3 } from 'lucide-react';

const MOCK_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-001',
    type: 'MOLECULE',
    title: 'Candidate: NX-552 (KRAS Inhibitor)',
    description: 'Novel covalent inhibitor targeting G12C mutation with improved solubility profile.',
    owner: 'Dr. Sarah Chen',
    createdDate: '2023-11-15 09:30',
    status: 'PENDING',
    data: {
      name: 'NX-552',
      smiles: 'CC(C)C1=CC=C(C=C1)C(C)C(=O)O...[Simulated Structure]',
      scores: { potency: 8.9, toxicity: 0.12, synthesis: 4.5 },
      evidence: 'Strong hydrogen bonding observed in pocket 2 during docking simulation.'
    },
    comments: [
      { id: 'c1', author: 'Dr. Marcus Webb', role: 'Biologist', content: 'The toxicity score looks promising, but have we checked for off-target HER2 inhibition?', timestamp: '10:15 AM', votes: 3 },
      { id: 'c2', author: 'ToxBot AI', role: 'Automated Agent', content: 'Flag: Structural similarity to known hepatotoxic compounds > 60%. Proceed with caution.', timestamp: '10:16 AM', votes: 5, annotation: { targetText: 'toxicity: 0.12' } }
    ],
    approvals: []
  },
  {
    id: 'rev-002',
    type: 'PROTOCOL',
    title: 'Protocol: High-Throughput Screening v2',
    description: 'Updated liquid handling parameters for 384-well plate dispensing to reduce edge effects.',
    owner: 'AutoLab System',
    createdDate: '2023-11-14 14:20',
    status: 'CHANGES_REQUESTED',
    data: {
      steps: 12,
      platform: 'Hamilton STAR',
      duration: '45 mins',
      criticalStep: 'Aspiration speed reduced to 5uL/s'
    },
    comments: [
      { id: 'c3', author: 'Lab Manager', role: 'Admin', content: 'This speed reduction increases total runtime by 15%. Is it worth it?', timestamp: 'Yesterday', votes: 1, annotation: { targetText: 'Aspiration speed reduced to 5uL/s' } }
    ],
    approvals: []
  },
  {
    id: 'rev-003',
    type: 'LITERATURE',
    title: 'Paper: Resistance Mechanisms in EGFR',
    description: 'Key findings from recent Nature paper regarding T790M secondary mutations.',
    owner: 'Literature Agent',
    createdDate: '2023-11-16 08:00',
    status: 'APPROVED',
    data: {
      source: 'Nature Med.',
      snippet: 'We observed that 40% of patients developed C797S mutation upon treatment with Osimertinib, bypassing the covalent bond formation.'
    },
    comments: [
      { id: 'c4', author: 'Dr. Sarah Chen', role: 'Chemist', content: 'This confirms our hypothesis for the new series. We need to target the allosteric site.', timestamp: '08:45 AM', votes: 4, annotation: { targetText: 'C797S mutation' } }
    ],
    approvals: ['Dr. Sarah Chen', 'Dr. Marcus Webb']
  }
];

const CollaborativeReviewDashboard: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>(MOCK_REVIEWS);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(MOCK_REVIEWS[0].id);
  const [newComment, setNewComment] = useState('');
  const [annotatingText, setAnnotatingText] = useState<string | null>(null);

  const selectedReview = reviews.find(r => r.id === selectedReviewId);

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
      case 'REJECTED': return 'bg-red-900/30 text-red-400 border-red-800';
      case 'CHANGES_REQUESTED': return 'bg-orange-900/30 text-orange-400 border-orange-800';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getIconForType = (type: ReviewItem['type']) => {
    switch (type) {
      case 'MOLECULE': return <Beaker size={16} />;
      case 'PROTOCOL': return <Bot size={16} />;
      case 'LITERATURE': return <FileText size={16} />;
    }
  };

  const handleStatusChange = (id: string, newStatus: ReviewStatus) => {
    setReviews(prev => prev.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    ));
  };

  const handleAddComment = () => {
    if (!newComment || !selectedReview) return;
    
    const comment: ReviewComment = {
      id: Math.random().toString(36).substr(2, 9),
      author: 'You',
      role: 'Reviewer',
      content: newComment,
      timestamp: 'Just now',
      votes: 0,
      annotation: annotatingText ? { targetText: annotatingText } : undefined
    };

    setReviews(prev => prev.map(r => 
      r.id === selectedReview.id ? { ...r, comments: [...r.comments, comment] } : r
    ));
    setNewComment('');
    setAnnotatingText(null);
  };

  const handleVote = (reviewId: string, commentId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      return {
        ...r,
        comments: r.comments.map(c => 
          c.id === commentId ? { ...c, votes: c.votes + 1 } : c
        )
      };
    }));
  };

  // Simulate highlighting/annotating text (simplified interaction)
  const handleSimulateSelection = (text: string) => {
      setAnnotatingText(text);
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <MessageSquare className="text-indigo-400" />
            Collaborative Review Hub
          </h2>
          <p className="text-slate-400 text-sm">
            Centralized approval workflow and annotation for scientific artifacts.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left: Review Queue */}
        <div className="w-80 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <History size={16}/> Review Queue
            </h3>
            <span className="bg-slate-800 px-2 py-0.5 rounded-full text-xs text-slate-400 border border-slate-700">{reviews.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {reviews.map(review => (
              <button
                key={review.id}
                onClick={() => setSelectedReviewId(review.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all group ${
                  selectedReviewId === review.id 
                  ? 'bg-slate-800 border-indigo-500/50 shadow-md' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400 group-hover:text-white transition-colors`}>
                        {getIconForType(review.type)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${getStatusColor(review.status)}`}>
                        {review.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">{review.createdDate.split(' ')[0]}</span>
                </div>
                <h4 className={`text-sm font-medium mb-1 truncate ${selectedReviewId === review.id ? 'text-white' : 'text-slate-300'}`}>{review.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                   <User size={12}/> {review.owner}
                   <span className="mx-1">•</span>
                   <MessageSquare size={12}/> {review.comments.length}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center & Right: Review Workspace */}
        {selectedReview ? (
          <div className="flex-1 flex gap-6 overflow-hidden">
            
            {/* Center: Context / Evidence */}
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">{selectedReview.title}</h3>
                        <p className="text-sm text-slate-400">{selectedReview.description}</p>
                    </div>
                    {/* Simulated Document Toolbar */}
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-700 rounded text-slate-400" title="Highlight"><Edit3 size={16}/></button>
                        <button className="p-2 hover:bg-slate-700 rounded text-slate-400" title="Zoom"><Search size={16}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Content Renderer based on Type */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-inner font-serif text-slate-300 leading-relaxed text-lg">
                        {selectedReview.type === 'MOLECULE' && (
                            <div className="space-y-4 font-sans">
                                <div className="p-4 bg-slate-800 rounded border border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={() => handleSimulateSelection('scores: potency 8.9')}>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase">Candidate Name</div>
                                        <div className="text-xl font-bold text-white">{selectedReview.data.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500 uppercase">Potency Score</div>
                                        <div className="text-xl font-mono text-emerald-400">8.9</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-800 rounded border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase mb-2">Molecular Structure</div>
                                    <div className="font-mono text-xs text-slate-400 bg-slate-950 p-2 rounded break-all border border-slate-800">
                                        {selectedReview.data.smiles}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-800 rounded border border-slate-700 cursor-text group" onClick={() => handleSimulateSelection(selectedReview.data.evidence)}>
                                    <div className="text-xs text-slate-500 uppercase mb-2">Rationale Evidence</div>
                                    <p className="group-hover:text-white transition-colors decoration-indigo-500/50 underline-offset-4 group-hover:underline">
                                        "{selectedReview.data.evidence}"
                                    </p>
                                    <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2">Click to annotate</span>
                                </div>
                            </div>
                        )}

                        {selectedReview.type === 'PROTOCOL' && (
                            <div className="space-y-4 font-sans">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-800 rounded border border-slate-700" onClick={() => handleSimulateSelection('Platform: Hamilton STAR')}>
                                        <div className="text-xs text-slate-500">Platform</div>
                                        <div className="font-mono text-slate-200">{selectedReview.data.platform}</div>
                                    </div>
                                    <div className="p-3 bg-slate-800 rounded border border-slate-700">
                                        <div className="text-xs text-slate-500">Steps</div>
                                        <div className="font-mono text-slate-200">{selectedReview.data.steps}</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-800 rounded border border-slate-700 cursor-pointer group" onClick={() => handleSimulateSelection(selectedReview.data.criticalStep)}>
                                    <div className="text-xs text-slate-500 uppercase mb-2">Critical Parameter Change</div>
                                    <p className="font-mono text-sm text-yellow-100 bg-yellow-900/20 p-2 rounded border border-yellow-900/50 group-hover:border-yellow-500/50 transition-colors">
                                        {selectedReview.data.criticalStep}
                                    </p>
                                    <span className="text-[10px] text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1 block">Click to annotate</span>
                                </div>
                            </div>
                        )}

                        {selectedReview.type === 'LITERATURE' && (
                            <div className="cursor-text selection:bg-indigo-500/30" onClick={() => handleSimulateSelection(selectedReview.data.snippet)}>
                                <div className="text-xs font-sans text-slate-500 mb-4 border-b border-slate-800 pb-2">
                                    Source: {selectedReview.data.source}
                                </div>
                                <p className="italic">
                                    "...{selectedReview.data.snippet}..."
                                </p>
                                <span className="text-[10px] font-sans text-indigo-400 mt-2 block opacity-50">Click text to add annotation</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleStatusChange(selectedReview.id, 'APPROVED')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <CheckCircle size={16}/> Approve
                        </button>
                        <button 
                            onClick={() => handleStatusChange(selectedReview.id, 'CHANGES_REQUESTED')}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <AlertCircle size={16}/> Request Changes
                        </button>
                        <button 
                            onClick={() => handleStatusChange(selectedReview.id, 'REJECTED')}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <XCircle size={16}/> Reject
                        </button>
                    </div>
                    <div className="text-xs text-slate-500">
                        Version 1.0 • Last updated {selectedReview.createdDate}
                    </div>
                </div>
            </div>

            {/* Right: Discussion Thread */}
            <div className="w-80 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                    <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                        <MessageSquare size={16}/> Discussion & Audit
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Status Log */}
                    <div className="flex items-center gap-2 justify-center my-4">
                        <div className="h-px bg-slate-800 flex-1"></div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Timeline</span>
                        <div className="h-px bg-slate-800 flex-1"></div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400 flex-shrink-0">
                            <Bot size={14}/>
                        </div>
                        <div className="flex-1">
                            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-800 text-xs text-slate-400">
                                <span className="font-bold text-slate-300">System</span> created this review item.
                                <div className="mt-1 text-[10px] opacity-60">{selectedReview.createdDate}</div>
                            </div>
                        </div>
                    </div>

                    {selectedReview.comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold flex-shrink-0 ${
                                comment.author === 'You' ? 'bg-indigo-600 border-indigo-500 text-white' : 
                                comment.role === 'Automated Agent' ? 'bg-rose-900/50 border-rose-700 text-rose-400' :
                                'bg-slate-700 border-slate-600 text-slate-300'
                            }`}>
                                {comment.author === 'You' ? 'ME' : comment.author.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className="text-xs font-bold text-slate-200">{comment.author}</span>
                                    <span className="text-[10px] text-slate-500">{comment.timestamp}</span>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-sm text-slate-300 relative group">
                                    {comment.annotation && (
                                        <div className="mb-2 pl-2 border-l-2 border-indigo-500 text-xs text-indigo-300 italic bg-indigo-900/10 p-1 rounded-r">
                                            <Quote size={10} className="inline mr-1"/>
                                            "{comment.annotation.targetText}"
                                        </div>
                                    )}
                                    {comment.content}
                                    
                                    <div className="absolute -bottom-2 right-2 flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleVote(selectedReview.id, comment.id)} className="hover:text-emerald-400 transition-colors">
                                            <ThumbsUp size={10}/>
                                        </button>
                                        <span className="text-[10px] font-mono">{comment.votes}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-slate-800 border-t border-slate-700">
                    {annotatingText && (
                        <div className="mb-2 flex items-center justify-between text-xs bg-indigo-900/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">
                            <span className="truncate max-w-[200px] flex items-center gap-1"><Quote size={10}/> Annotating: "{annotatingText}"</span>
                            <button onClick={() => setAnnotatingText(null)}><XCircle size={12}/></button>
                        </div>
                    )}
                    <div className="relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={annotatingText ? "Add annotation note..." : "Add a comment..."}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pr-10 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none h-20"
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); }}}
                        />
                        <button 
                            onClick={handleAddComment}
                            disabled={!newComment}
                            className="absolute bottom-3 right-3 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={14}/>
                        </button>
                    </div>
                </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 flex-col">
             <MessageSquare size={48} className="mb-4 opacity-20"/>
             <p>Select an item to review</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeReviewDashboard;
