import React, { useState } from 'react';
import { Task } from '../types';
import { PlusCircle, Sparkles, AlertCircle } from 'lucide-react';

interface TaskFormProps {
  onAddTask: (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'autoPlan'>) => void;
}

export default function TaskForm({ onAddTask }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Set default due date to tomorrow
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(getTomorrowString());
  const [dueTime, setDueTime] = useState('18:00');
  const [urgency, setUrgency] = useState<Task['urgency']>('medium');
  const [category, setCategory] = useState<Task['category']>('Work');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task Title is required');
      return;
    }
    setError('');

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      dueTime,
      urgency,
      category,
    });

    // Reset inputs but keep category/urgency defaults
    setTitle('');
    setDescription('');
    setDueDate(getTomorrowString());
    setDueTime('18:00');
  };

  // Custom Quick Pre-Sets to make inputs ultra-fast
  const applyPreset = (presetTitle: string, presetCat: Task['category'], presetUrgency: Task['urgency']) => {
    setTitle(presetTitle);
    setCategory(presetCat);
    setUrgency(presetUrgency);
  };

  return (
    <form 
      id="task-creation-form"
      onSubmit={handleSubmit} 
      className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <PlusCircle className="w-5 h-5 text-blue-400" />
        <h2 className="text-base font-semibold text-white tracking-tight font-display">
          Register New Deadline
        </h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/60 text-red-400 text-xs rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="task-title-input" className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
            Task Objective
          </label>
          <input
            id="task-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g., File Q2 Quarterly Taxes, Study for Midterm Exam"
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="task-desc-input" className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
            Context / Specifics (Optional)
          </label>
          <textarea
            id="task-desc-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key materials needed, sub-goals, or critical outcomes..."
            rows={2}
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
          />
        </div>

        {/* Due Date & Time with Interactive Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="task-date-input" className="block text-xs font-mono text-gray-400 uppercase tracking-wider">
              Due Date
            </label>
            <input
              id="task-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <div className="flex flex-wrap gap-1">
              <button
                id="btn-date-today"
                type="button"
                onClick={() => {
                  const today = new Date();
                  setDueDate(today.toISOString().split('T')[0]);
                }}
                className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                  dueDate === new Date().toISOString().split('T')[0]
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                id="btn-date-tomorrow"
                type="button"
                onClick={() => {
                  setDueDate(getTomorrowString());
                }}
                className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                  dueDate === getTomorrowString()
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                }`}
              >
                Tomorrow
              </button>
              <button
                id="btn-date-3days"
                type="button"
                onClick={() => {
                  const in3Days = new Date();
                  in3Days.setDate(in3Days.getDate() + 3);
                  setDueDate(in3Days.toISOString().split('T')[0]);
                }}
                className="text-[9px] bg-slate-950 text-gray-500 border border-slate-850 hover:text-white px-2 py-0.5 rounded transition-colors"
              >
                +3 Days
              </button>
              <button
                id="btn-date-1week"
                type="button"
                onClick={() => {
                  const in1Week = new Date();
                  in1Week.setDate(in1Week.getDate() + 7);
                  setDueDate(in1Week.toISOString().split('T')[0]);
                }}
                className="text-[9px] bg-slate-950 text-gray-500 border border-slate-850 hover:text-white px-2 py-0.5 rounded transition-colors"
              >
                +1 Week
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="task-time-input" className="block text-xs font-mono text-gray-400 uppercase tracking-wider">
              Due Time
            </label>
            <input
              id="task-time-input"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <div className="flex flex-wrap gap-1">
              <button
                id="btn-time-1hr"
                type="button"
                onClick={() => {
                  const now = new Date();
                  const target = new Date(now.getTime() + 60 * 60 * 1000);
                  const hrs = String(target.getHours()).padStart(2, '0');
                  const mins = String(target.getMinutes()).padStart(2, '0');
                  setDueTime(`${hrs}:${mins}`);
                }}
                className="text-[9px] bg-slate-950 text-gray-500 border border-slate-850 hover:text-white px-2 py-0.5 rounded transition-colors"
              >
                +1 Hour
              </button>
              <button
                id="btn-time-4hr"
                type="button"
                onClick={() => {
                  const now = new Date();
                  const target = new Date(now.getTime() + 4 * 60 * 60 * 1000);
                  const hrs = String(target.getHours()).padStart(2, '0');
                  const mins = String(target.getMinutes()).padStart(2, '0');
                  setDueTime(`${hrs}:${mins}`);
                }}
                className="text-[9px] bg-slate-950 text-gray-500 border border-slate-850 hover:text-white px-2 py-0.5 rounded transition-colors"
              >
                +4 Hours
              </button>
              <button
                id="btn-time-eod"
                type="button"
                onClick={() => setDueTime('18:00')}
                className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                  dueTime === '18:00'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                }`}
              >
                18:00
              </button>
              <button
                id="btn-time-night"
                type="button"
                onClick={() => setDueTime('22:00')}
                className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                  dueTime === '22:00'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                }`}
              >
                22:00
              </button>
            </div>
          </div>
        </div>

        {/* Category & Urgency */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-category-select" className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
              Category
            </label>
            <select
              id="task-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as Task['category'])}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="Work">Work</option>
              <option value="Study">Study</option>
              <option value="Finance">Finance</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-urgency-select" className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
              Consequence Scale
            </label>
            <select
              id="task-urgency-select"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as Task['urgency'])}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="low">Low (Trivial Snooze)</option>
              <option value="medium">Medium (Moderate Setback)</option>
              <option value="high">High (Painful Failure)</option>
              <option value="critical">Critical (Catastrophic Fallout)</option>
            </select>
          </div>
        </div>

        {/* Presets List */}
        <div>
          <span className="block text-[11px] font-mono text-gray-500 mb-1.5 uppercase tracking-wider">
            Quick-load Common Threats
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              id="btn-preset-taxes"
              type="button"
              onClick={() => applyPreset('File Quarterly Estimated Taxes', 'Finance', 'critical')}
              className="text-[10px] bg-slate-950 text-gray-400 hover:text-white border border-slate-800 px-2 py-1 rounded transition-colors"
            >
              💸 File Taxes
            </button>
            <button
              id="btn-preset-exam"
              type="button"
              onClick={() => applyPreset('Study for Machine Learning Final', 'Study', 'high')}
              className="text-[10px] bg-slate-950 text-gray-400 hover:text-white border border-slate-800 px-2 py-1 rounded transition-colors"
            >
              🧠 ML Final Exam
            </button>
            <button
              id="btn-preset-bill"
              type="button"
              onClick={() => applyPreset('Pay Server Hosting & Rent Invoices', 'Finance', 'critical')}
              className="text-[10px] bg-slate-950 text-gray-400 hover:text-white border border-slate-800 px-2 py-1 rounded transition-colors"
            >
              💳 Pay Invoices
            </button>
            <button
              id="btn-preset-pitch"
              type="button"
              onClick={() => applyPreset('Revise Venture Capital Pitch Deck', 'Work', 'high')}
              className="text-[10px] bg-slate-950 text-gray-400 hover:text-white border border-slate-800 px-2 py-1 rounded transition-colors"
            >
              🚀 VC Pitch Deck
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          id="btn-submit-task"
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg p-2.5 transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
          <span>Lock In Target Deadline</span>
        </button>
      </div>
    </form>
  );
}
