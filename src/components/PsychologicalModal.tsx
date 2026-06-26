import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { ShieldAlert, AlertTriangle, Cpu, HelpCircle, Check, X, Sparkles } from 'lucide-react';

interface PsychologicalModalProps {
  task: Task;
  actionType: 'complete' | 'delete';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface AnalysisResult {
  intelligent_question: string;
  thought_provoking_context: string;
}

export default function PsychologicalModal({
  task,
  actionType,
  isOpen,
  onClose,
  onConfirm,
}: PsychologicalModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset state
    setData(null);
    setUserResponse('');
    setError('');
    setLoading(true);

    // Call backend psychological analysis API
    fetch('/api/tasks/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: task.title }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then((resData: AnalysisResult) => {
        setData(resData);
      })
      .catch((err) => {
        console.error('Failed to get dynamic consequence query:', err);
        // Fallback default dynamic question matching guidelines
        setData({
          intelligent_question: `What will tomorrow-you feel when they inherit the compound consequences of delaying "${task.title}"?`,
          thought_provoking_context: `Postponing this "${task.category}" task immediately transfers the pressure onto your future self, guaranteeing compounding stress.`,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userResponse.trim().length < 8) {
      setError('Your reflection is too short. Be honest with yourself about the real consequence.');
      return;
    }
    
    // Proceed
    onConfirm();
  };

  return (
    <div 
      id="psychological-intervention-overlay"
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity duration-300"
    >
      <div 
        id="psychological-intervention-modal"
        className="bg-slate-950 border border-red-900/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-red-950/20 animate-in fade-in zoom-in duration-200"
      >
        {/* Urgent header */}
        <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 p-4 border-b border-red-900/40 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-mono uppercase tracking-wider text-red-400 font-semibold">
              Cognitive Guardian Alert
            </h3>
            <p className="text-[11px] text-gray-400">
              Anti-Dismissal Consequence Audit
            </p>
          </div>
        </div>

        {/* Inner Content */}
        <div className="p-6 space-y-5">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
              Target Task Under Review
            </span>
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-xs text-gray-400 font-mono block">[{task.category.toUpperCase()}]</span>
              <h4 className="text-sm font-semibold text-white mt-0.5">{task.title}</h4>
            </div>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin"></div>
              <p className="text-xs font-mono text-gray-400 flex items-center gap-1.5 animate-pulse">
                <Cpu className="w-3.5 h-3.5 text-red-400" />
                Analyzing real-world cascade risks...
              </p>
            </div>
          ) : (
            data && (
              <div className="space-y-4">
                {/* Unexpected dynamic consequence question */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 shadow-red-glow">
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-200 leading-snug">
                        "{data.intelligent_question}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Context explanation */}
                <div className="text-xs text-gray-400 leading-relaxed pl-1.5 border-l-2 border-red-500/30">
                  <span className="font-semibold text-gray-300">Consequence Warning:</span> {data.thought_provoking_context}
                </div>

                {/* User validation form */}
                <form onSubmit={handleOverrideSubmit} className="space-y-3 pt-2">
                  <div>
                    <label htmlFor="reflection-input" className="block text-xs font-mono text-gray-400 mb-1.5 uppercase tracking-wider">
                      Provide Your Objective Response / Reflection to Dismiss:
                    </label>
                    <textarea
                      id="reflection-input"
                      value={userResponse}
                      onChange={(e) => {
                        setUserResponse(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Be honest. Explain why you are delaying this, or write an honest answer to the question..."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-red-500 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 font-mono">
                      * Minimum 8 characters of conscious reflection required to bypass. Current count: {userResponse.length}
                    </p>
                  </div>

                  {error && (
                    <p className="text-[11px] text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg">
                      {error}
                    </p>
                  )}

                  {/* Options */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      id="btn-close-guardian"
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2 px-3 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Nevermind, I'll Do It Now
                    </button>
                    
                    <button
                      id="btn-confirm-guardian-override"
                      type="submit"
                      disabled={userResponse.trim().length < 8}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        userResponse.trim().length >= 8
                          ? 'bg-red-900/80 hover:bg-red-800 text-white shadow-lg shadow-red-950/40 cursor-pointer'
                          : 'bg-slate-900 text-gray-600 border border-slate-850 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{actionType === 'delete' ? 'Confirm Deletion' : 'Mark as Completed'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
