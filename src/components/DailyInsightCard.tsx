import React, { useState, useEffect } from 'react';
import { Task, DailyInsight } from '../types';
import { Sparkles, RefreshCw, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface DailyInsightCardProps {
  tasks: Task[];
  onInsightsUpdated?: (insight: DailyInsight) => void;
}

export default function DailyInsightCard({ tasks = [], onInsightsUpdated }: DailyInsightCardProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<DailyInsight | null>(null);

  const fetchInsights = () => {
    setLoading(true);
    fetch('/api/tasks/daily-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        return res.json();
      })
      .then((data: DailyInsight) => {
        setInsights(data);
        if (onInsightsUpdated) {
          onInsightsUpdated(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching insights:', err);
        // Realistic client-side fallback
        const totalPending = tasks.filter(t => !t.completed).length;
        const criticalCount = tasks.filter(t => !t.completed && t.urgency === 'critical').length;
        const highCount = tasks.filter(t => !t.completed && t.urgency === 'high').length;
        
        const calculatedScore = totalPending === 0 ? 5 : Math.min((criticalCount * 30) + (highCount * 15) + (totalPending * 5), 98);
        
        let calculatedAnalysis = "All systems clear. You have successfully managed your schedule, preventing sudden stressors. Protect this momentum.";
        if (calculatedScore > 75) {
          calculatedAnalysis = "WARNING: You are operating in high cognitive deficit mode. Compound critical deadlines are clustered together. Postponing work today is a choice to trigger intense stress tomorrow.";
        } else if (calculatedScore > 40) {
          calculatedAnalysis = "Your pipeline has multiple active threats. Although manageable, delayed execution on your high-consequence tasks will rapidly compound your load.";
        }

        setInsights({
          risk_score: calculatedScore,
          risk_analysis: calculatedAnalysis,
          recommendations: [
            "Initiate work immediately on your highest-consequence task. Delaying creates a powerful cognitive block.",
            "Schedule a solid, distraction-free 45-minute sprint. Put your communication devices completely offline.",
            "Consolidate similar tasks together (e.g. pay all bills in one 15-minute batch) to conserve mental energy."
          ]
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Run on mount or when tasks list size changes
  useEffect(() => {
    fetchInsights();
  }, [tasks?.length]);

  if (!insights) return null;

  // Gauge color based on risk score
  const getRiskColor = (score: number) => {
    if (score > 75) return { stroke: 'stroke-red-500', text: 'text-red-400', glow: 'shadow-red-glow', label: 'CRITICAL OVERLOAD' };
    if (score > 40) return { stroke: 'stroke-amber-500', text: 'text-amber-400', glow: 'shadow-orange-glow', label: 'ELEVATED RISK' };
    return { stroke: 'stroke-green-500', text: 'text-green-400', glow: 'shadow-green-glow', label: 'OPTIMAL SYSTEM STATE' };
  };

  const risk = getRiskColor(insights.risk_score);
  const strokeDashoffset = 157 - (157 * insights.risk_score) / 100;

  return (
    <div 
      id="daily-insights-panel"
      className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
    >
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl"></div>
      
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-white tracking-tight font-display">
            Threat & Consequence Audit
          </h2>
        </div>

        <button
          id="btn-recalculate-threat"
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-750 transition-all text-gray-400 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Audit Pipeline</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Ring Gauge Visualization */}
        <div className="flex flex-col items-center justify-center p-3 border-r border-slate-800/60 md:col-span-1">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG circle gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
              <circle
                className="stroke-slate-800"
                strokeWidth="4.5"
                fill="transparent"
                r="25"
                cx="32"
                cy="32"
              />
              <circle
                className={`transition-all duration-1000 ease-out ${risk.stroke}`}
                strokeWidth="4.5"
                strokeDasharray="157"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                r="25"
                cx="32"
                cy="32"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-2xl font-bold tracking-tight font-display ${risk.text}`}>
                {insights.risk_score}%
              </span>
              <span className="text-[8px] text-gray-500 font-mono tracking-widest mt-0.5">THREAT</span>
            </div>
          </div>
          
          <span className={`text-[10px] font-mono tracking-widest mt-3.5 text-center px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-semibold ${risk.text}`}>
            {risk.label}
          </span>
        </div>

        {/* Tactical Breakdown Analysis */}
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
              Cognitive Assessment
            </span>
            <p className="text-xs text-gray-300 leading-relaxed italic">
              " {insights.risk_analysis} "
            </p>
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
              Proactive Safeguards for Today
            </span>
            <div className="space-y-2">
              {insights.recommendations.map((rec, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2 text-xs text-gray-300"
                >
                  <div className="mt-0.5 p-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                    <Zap className="w-3 h-3" />
                  </div>
                  <p className="leading-snug">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
