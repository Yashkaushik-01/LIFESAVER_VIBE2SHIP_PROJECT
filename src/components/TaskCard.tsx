import React, { useState, useEffect } from 'react';
import { Task, SubTask } from '../types';
import { Calendar, AlertTriangle, CheckSquare, Square, Trash2, ChevronDown, ChevronUp, Cpu, Sparkles, Volume2, Clock } from 'lucide-react';

interface TaskCardProps {
  key?: string | number;
  task: Task;
  onCompleteToggle: (taskId: string) => void;
  onDeleteRequest: (task: Task) => void;
  onAutoPlanRequest: (task: Task) => void;
  onSubtaskToggle: (taskId: string, subtaskIndex: number) => void;
}

export default function TaskCard({
  task,
  onCompleteToggle,
  onDeleteRequest,
  onAutoPlanRequest,
  onSubtaskToggle
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState<boolean>(false);

  // Calculate relative time left
  useEffect(() => {
    const calculateTime = () => {
      if (!task.dueDate) return;
      const [year, month, day] = task.dueDate.split('-').map(Number);
      const [hours, minutes] = (task.dueTime || '23:59').split(':').map(Number);
      const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();

      if (diffMs < 0) {
        setIsOverdue(true);
        const absDiff = Math.abs(diffMs);
        const hours = Math.floor(absDiff / (1000 * 60 * 60));
        if (hours < 24) {
          setTimeLeft(`Overdue by ${hours} hours`);
        } else {
          setTimeLeft(`Overdue by ${Math.floor(hours / 24)} days`);
        }
      } else {
        setIsOverdue(false);
        const mins = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
          setTimeLeft(`In ${days} ${days === 1 ? 'day' : 'days'}`);
        } else if (hours > 0) {
          setTimeLeft(`In ${hours} ${hours === 1 ? 'hour' : 'hours'}`);
        } else {
          setTimeLeft(`In ${mins} ${mins === 1 ? 'min' : 'mins'}`);
        }
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [task.dueDate, task.dueTime]);

  // Voice announcement of warning
  const speakWarning = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance();
      const warningText = task.consequenceAnalysis 
        ? `${task.consequenceAnalysis.intelligent_question}. Why it matters: ${task.consequenceAnalysis.thought_provoking_context}`
        : `Task "${task.title}" is flagged as ${task.urgency} urgency. Avoid the trap of procrastination.`;
      
      u.text = warningText;
      u.lang = 'en-US';
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    }
  };

  const getUrgencyStyles = (urgency: Task['urgency']) => {
    switch (urgency) {
      case 'critical':
        return {
          bg: 'bg-red-950/40 border-red-800 text-red-300',
          badge: 'bg-red-500/10 text-red-400 border-red-500/20',
          indicator: 'bg-red-500 shadow-red-glow animate-pulse'
        };
      case 'high':
        return {
          bg: 'bg-orange-950/20 border-orange-800/80 text-orange-200',
          badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          indicator: 'bg-orange-500 shadow-orange-glow animate-pulse-slow'
        };
      case 'medium':
        return {
          bg: 'bg-slate-900 border-slate-800 text-gray-200',
          badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          indicator: 'bg-yellow-500 shadow-orange-glow'
        };
      case 'low':
        return {
          bg: 'bg-slate-900/60 border-slate-800/60 text-gray-400',
          badge: 'bg-green-500/10 text-green-400 border-green-500/20',
          indicator: 'bg-green-500 shadow-green-glow'
        };
    }
  };

  const getCategoryColor = (cat: Task['category']) => {
    switch (cat) {
      case 'Work': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      case 'Study': return 'text-purple-400 border-purple-500/20 bg-purple-500/5';
      case 'Finance': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'Personal': return 'text-pink-400 border-pink-500/20 bg-pink-500/5';
      case 'Health': return 'text-teal-400 border-teal-500/20 bg-teal-500/5';
      default: return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
    }
  };

  const styles = getUrgencyStyles(task.urgency);

  return (
    <div 
      id={`task-card-${task.id}`}
      className={`border rounded-xl p-5 mb-4 transition-all duration-300 hover:scale-[1.01] ${task.completed ? 'opacity-60 bg-slate-950/40 border-slate-800/40' : styles.bg}`}
    >
      {/* Header Info */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${styles.indicator}`}></span>
          <span className={`text-xs font-mono border rounded px-2 py-0.5 uppercase tracking-wider ${styles.badge}`}>
            {task.urgency}
          </span>
          <span className={`text-xs font-medium border rounded px-2 py-0.5 ${getCategoryColor(task.category)}`}>
            {task.category}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          <span>{task.dueDate}</span>
          <Clock className="w-3.5 h-3.5 text-gray-500 ml-1" />
          <span>{task.dueTime || '23:59'}</span>
        </div>
      </div>

      {/* Main Row */}
      <div className="flex items-start gap-3 justify-between">
        <div className="flex-1">
          <h3 className={`text-base font-semibold tracking-tight ${task.completed ? 'text-gray-500 font-medium' : 'text-white'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-2xl">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          {/* Voice warning reading */}
          <button 
            id={`btn-voice-warning-${task.id}`}
            onClick={speakWarning}
            title="Listen to psychological alert warning"
            className="p-1.5 rounded bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Complete button */}
          <button
            id={`btn-complete-task-${task.id}`}
            onClick={() => onCompleteToggle(task.id)}
            className={`p-1.5 rounded transition-all ${
              task.completed 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
            title={task.completed ? "Mark incomplete" : "Mark task complete"}
          >
            {task.completed ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          {/* Delete button */}
          <button
            id={`btn-delete-task-${task.id}`}
            onClick={() => onDeleteRequest(task)}
            className="p-1.5 rounded bg-slate-800/60 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Warning Indicator Banner */}
      {!task.completed && (
        <div className="mt-3 flex items-center justify-between text-xs bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 px-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-400 animate-bounce' : 'text-orange-400'}`} />
            <span className={isOverdue ? 'text-red-400 font-semibold' : 'text-orange-300'}>
              {timeLeft}
            </span>
          </div>
          
          {!task.autoPlan && (
            <button
              id={`btn-autoplan-${task.id}`}
              onClick={() => onAutoPlanRequest(task)}
              className="flex items-center gap-1.5 text-blue-400 font-mono hover:text-blue-300 hover:underline text-[11px] font-medium bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10"
            >
              <Cpu className="w-3 h-3" />
              <span>Agentic Breakdown</span>
            </button>
          )}
        </div>
      )}

      {/* Expand/Collapse subtasks trigger */}
      {task.autoPlan && (
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <button
            id={`btn-expand-plan-${task.id}`}
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-xs font-mono text-blue-400 hover:text-blue-300"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>AI Action Blueprint ({(task.autoPlan.subtasks || []).length} tactical milestones)</span>
            </span>
            <span className="text-gray-500">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 pl-1">
              <p className="text-[11px] text-gray-400 italic mb-2">
                " {task.autoPlan.suggested_timeline_summary} "
              </p>
              
              {(task.autoPlan.subtasks || []).map((sub, idx) => (
                <div 
                  key={idx}
                  onClick={() => onSubtaskToggle(task.id, idx)}
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                    sub.completed 
                      ? 'bg-slate-950/40 opacity-50' 
                      : 'bg-slate-950/60 hover:bg-slate-900 border border-slate-850'
                  }`}
                >
                  <div className="mt-0.5 text-blue-400">
                    {sub.completed ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium ${sub.completed ? 'text-gray-500 italic' : 'text-gray-200'}`}>
                        {sub.title}
                      </span>
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">
                        {sub.estimated_duration}
                      </span>
                    </div>
                    {sub.consequence_if_skipped && !sub.completed && (
                      <p className="text-[10px] text-red-400/80 mt-0.5 font-sans leading-tight">
                        ⚠️ Skip danger: {sub.consequence_if_skipped}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
