import React, { useState, useEffect, useRef } from 'react';
import { Task, SubTask, DailyInsight } from './types';
import TaskForm from './components/TaskForm';
import TaskCard from './components/TaskCard';
import DailyInsightCard from './components/DailyInsightCard';
import PsychologicalModal from './components/PsychologicalModal';
import { 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  Plus, 
  Mic, 
  MicOff, 
  Flame, 
  Info,
  CalendarCheck2,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  Play,
  CheckSquare,
  Trash2
} from 'lucide-react';

// Web Audio API Synthesizer variables for high-urgency alarms
let audioCtx: AudioContext | null = null;
let sirenOsc1: OscillatorNode | null = null;
let sirenOsc2: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let lfoOsc: OscillatorNode | null = null;

const startSirenSynth = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Stop existing oscillators first
    stopSirenSynth();

    // Gain node for safe volumes
    sirenGain = audioCtx.createGain();
    sirenGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    sirenGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1); // gentle fade-in, still alarming

    // Oscillator 1 (sawtooth) for a cyber alert feel
    sirenOsc1 = audioCtx.createOscillator();
    sirenOsc1.type = 'sawtooth';
    sirenOsc1.frequency.setValueAtTime(350, audioCtx.currentTime);

    // Oscillator 2 (triangle) for a deeper tone pairing
    sirenOsc2 = audioCtx.createOscillator();
    sirenOsc2.type = 'triangle';
    sirenOsc2.frequency.setValueAtTime(354, audioCtx.currentTime); // slight detune

    // LFO to sweep frequencies up and down periodically (alarm effect)
    lfoOsc = audioCtx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.setValueAtTime(1.8, audioCtx.currentTime); // 1.8 Hz modulation rate

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(120, audioCtx.currentTime); // sweep frequency by 120Hz

    // Connect LFO
    lfoOsc.connect(lfoGain);
    lfoGain.connect(sirenOsc1.frequency);
    lfoGain.connect(sirenOsc2.frequency);

    // Connect audio path
    sirenOsc1.connect(sirenGain);
    sirenOsc2.connect(sirenGain);
    sirenGain.connect(audioCtx.destination);

    // Start everything
    lfoOsc.start();
    sirenOsc1.start();
    sirenOsc2.start();
  } catch (err) {
    console.error('Failed to trigger audio siren synthesizer:', err);
  }
};

const stopSirenSynth = () => {
  try {
    if (sirenOsc1) {
      sirenOsc1.stop();
      sirenOsc1.disconnect();
      sirenOsc1 = null;
    }
    if (sirenOsc2) {
      sirenOsc2.stop();
      sirenOsc2.disconnect();
      sirenOsc2 = null;
    }
    if (lfoOsc) {
      lfoOsc.stop();
      lfoOsc.disconnect();
      lfoOsc = null;
    }
    if (sirenGain) {
      sirenGain.disconnect();
      sirenGain = null;
    }
  } catch (err) {
    console.error('Error stopping siren synth:', err);
  }
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');
  
  // Psychological Modal intervention state
  const [activeIntervention, setActiveIntervention] = useState<{
    task: Task;
    actionType: 'complete' | 'delete';
  } | null>(null);

  // Goal / Habit Tracker State
  const [habits, setHabits] = useState<Array<{ id: string; title: string; streak: number; lastDone: string | null }>>([
    { id: '1', title: 'Distraction-free Deep Work (45 mins)', streak: 3, lastDone: '2026-06-24' },
    { id: '2', title: 'Morning high-consequence planning', streak: 5, lastDone: '2026-06-25' },
    { id: '3', title: 'Daily invoice & mailbox purge', streak: 1, lastDone: '2026-06-23' },
  ]);
  const [newHabitTitle, setNewHabitTitle] = useState('');

  // Voice command state
  const [isListening, setIsListening] = useState(false);
  const [voiceResult, setVoiceResult] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showArchives, setShowArchives] = useState<boolean>(false);

  // Alarming and Background Notifications State
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);
  const [alarmSnoozeReflection, setAlarmSnoozeReflection] = useState('');
  const [alarmError, setAlarmError] = useState('');
  
  // Interactive Alarm Step/Praise states
  const [alarmViewMode, setAlarmViewMode] = useState<'ringing' | 'snooze_question' | 'done_praise' | null>(null);
  const [intelligentSnoozeQuestion, setIntelligentSnoozeQuestion] = useState<string>('');
  const [snoozeResponse, setSnoozeResponse] = useState<string>('');
  const [doneResponse, setDoneResponse] = useState<string>('');
  const [loadingAlarmQuestion, setLoadingAlarmQuestion] = useState<boolean>(false);
  
  // 3-step Snooze MCQ state
  const [snoozeMcqs, setSnoozeMcqs] = useState<{ question: string; options: string[] }[]>([]);
  const [snoozeMcqIndex, setSnoozeMcqIndex] = useState<number>(0);
  const [selectedSnoozeOption, setSelectedSnoozeOption] = useState<string | null>(null);

  // Truth check completed MCQ state
  const [truthMcq, setTruthMcq] = useState<{ question: string; options: string[] } | null>(null);
  const [selectedTruthOption, setSelectedTruthOption] = useState<string | null>(null);
  const [loadingTruthQuestion, setLoadingTruthQuestion] = useState<boolean>(false);

  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;

  // Persistent dismissed alarms list (persists across refreshes so the user is forced to finish the interrogation)
  const dismissedAlarmsRef = useRef<string[]>([]);
  const activeAlarmIdRef = useRef<string | null>(null);

  // Load initial tasks & dismissed alarms from localStorage
  useEffect(() => {
    const savedDismissed = localStorage.getItem('dismissed_alarms');
    if (savedDismissed) {
      try {
        dismissedAlarmsRef.current = JSON.parse(savedDismissed);
      } catch (e) {
        console.error('Failed to parse saved dismissed alarms', e);
      }
    }
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem('last_minute_lifesaver_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved tasks', e);
      }
    } else {
      // Seed initial representative tasks
      const defaultTasks: Task[] = [
        {
          id: '101',
          title: 'File Q2 Business Quarterly Taxes',
          description: 'Calculate total consulting revenue, write-offs, and submit estimated state/federal files to IRS dashboard to prevent 5% failure-to-file monthly penalties.',
          dueDate: new Date(Date.now() + 86400000 * 1.5).toISOString().split('T')[0], // 1.5 days from now
          dueTime: '15:00',
          urgency: 'critical',
          category: 'Finance',
          completed: false,
          completedAt: null,
          autoPlan: {
            suggested_timeline_summary: "A robust mitigation path designed to isolate documents, compute accurate brackets, and file securely under IRS guidelines.",
            subtasks: [
              { title: "Consolidate 1099 invoices & corporate bank logs", estimated_duration: "45 mins", consequence_if_skipped: "Tax calculation errors will trigger audit risks.", completed: false },
              { title: "Input values into IRS direct-file estimator tool", estimated_duration: "30 mins", consequence_if_skipped: "Late estimation delays final verification.", completed: false },
              { title: "Review banking ACH routing numbers and execute transfer", estimated_duration: "15 mins", consequence_if_skipped: "Bounced transactions trigger immediately painful compounding fines.", completed: false }
            ]
          }
        },
        {
          id: '102',
          title: 'Revise Machine Learning Final Examination Paper',
          description: 'Submit proof of neural network optimization research including custom weight pruning results to professor.',
          dueDate: new Date(Date.now() + 86400000 * 2.5).toISOString().split('T')[0],
          dueTime: '23:59',
          urgency: 'high',
          category: 'Study',
          completed: false,
          completedAt: null,
          autoPlan: null
        }
      ];
      setTasks(defaultTasks);
      localStorage.setItem('last_minute_lifesaver_tasks', JSON.stringify(defaultTasks));
    }

    // Check Speech Recognition capability
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
    }
  }, []);

  // Register Service Worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered:', reg);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }
  }, []);

  // Sync deadlines with Service Worker on tasks change
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'SYNC_DEADLINES',
            deadlines: tasks
          });
        }
      });
    }
  }, [tasks]);

  // Foreground exact-second monitor for active alarms
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentTasks = tasksRef.current || [];

      currentTasks.forEach((task) => {
        if (task.completed) return;

        // Construct exact deadline in local time robustly
        if (!task.dueDate) return;
        const [year, month, day] = task.dueDate.split('-').map(Number);
        const [hours, minutes] = (task.dueTime || '23:59').split(':').map(Number);
        const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

        // If deadline is reached/passed AND not already dismissed in this session
        if (targetDate <= now && !dismissedAlarmsRef.current.includes(task.id)) {
          // Guard against multiple simultaneous triggers or continuous re-triggers
          if (activeAlarmIdRef.current) return;
          activeAlarmIdRef.current = task.id;

          // Trigger alarm active state
          setActiveAlarmTask(task);
          setAlarmViewMode('ringing');
          startSirenSynth();

          // Push standard notification if allowed
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification('🚨 CRITICAL DEADLINE STRIKE!', {
                body: `"${task.title}" has reached its scheduled deadline! Take action now or suffer the cascading consequence.`,
                requireInteraction: true,
                tag: task.id
              });
            } catch (err) {
              console.warn('Notification construction error:', err);
            }
          }
        }
      });
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      stopSirenSynth();
    };
  }, []);

  const requestNotificationPermission = () => {
    if (typeof Notification !== 'undefined') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          // Play a gentle confirm audio synth beep
          try {
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            const tempCtx = new AudioCtxClass();
            const osc = tempCtx.createOscillator();
            const gain = tempCtx.createGain();
            osc.frequency.setValueAtTime(880, tempCtx.currentTime);
            gain.gain.setValueAtTime(0.05, tempCtx.currentTime);
            osc.connect(gain);
            gain.connect(tempCtx.destination);
            osc.start();
            osc.stop(tempCtx.currentTime + 0.15);
          } catch (_) {}
        }
      });
    }
  };

  // Save to localStorage when state changes
  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('last_minute_lifesaver_tasks', JSON.stringify(updatedTasks));
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'autoPlan'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      completedAt: null,
      autoPlan: null,
    };
    saveTasks([newTask, ...tasks]);
  };

  // Triggered when completing/deleting - Intercept with psychological popup
  const handleCompleteToggleRequest = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.completed) {
      // Uncompleting doesn't require a cognitive warning, execute immediately
      const updated = tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, completed: false, completedAt: null };
        }
        return t;
      });
      saveTasks(updated);
    } else {
      // Completing requires psychological challenge
      setActiveIntervention({
        task,
        actionType: 'complete'
      });
    }
  };

  const handleDeleteRequest = (task: Task) => {
    // Deleting requires psychological challenge
    setActiveIntervention({
      task,
      actionType: 'delete'
    });
  };

  // Confirm action once psychological challenge is cleared
  const handleConfirmIntervention = () => {
    if (!activeIntervention) return;
    const { task, actionType } = activeIntervention;

    if (actionType === 'complete') {
      const updated = tasks.map(t => {
        if (t.id === task.id) {
          return { ...t, completed: true, completedAt: new Date().toISOString() };
        }
        return t;
      });
      saveTasks(updated);
    } else if (actionType === 'delete') {
      const updated = tasks.filter(t => t.id !== task.id);
      saveTasks(updated);
    }

    setActiveIntervention(null);
  };

  const fetchSnoozeMcqs = (task: Task) => {
    setLoadingAlarmQuestion(true);
    setAlarmError('');
    setSnoozeMcqIndex(0);
    setSelectedSnoozeOption(null);
    setSnoozeMcqs([]);
    fetch('/api/alarms/snooze-mcqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        urgency: task.urgency,
        description: task.description
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.questions && data.questions.length === 3) {
          setSnoozeMcqs(data.questions);
        } else {
          throw new Error("Invalid format");
        }
      })
      .catch(err => {
        console.warn("Failed to fetch snooze MCQs:", err);
        // Instant high-quality client-side fallback
        setSnoozeMcqs([
          {
            question: `Which cognitive bias is currently rationalizing your postponement of "${task.title}"?`,
            options: [
              "Hyperbolic Discounting: Trading long-term peace for immediate transient comfort.",
              "Ideal-State Fallacy: Intending to execute only when 'conditions are perfect'.",
              "Anxiety Avoidance: Rebranding psychological friction as 'strategic delay'.",
              "Temporal Disconnection: Treating your future-self as an anonymous stranger."
            ]
          },
          {
            question: `What is the technical consequence of delaying "${task.title}" for another cycle?`,
            options: [
              "Anxiety Compounding: Stress levels scale exponentially as the deadline compresses.",
              "Willpower Depletion: Your evening executive reserve will be severely degraded.",
              "Parkinson's Law: The task will bloat, consuming twice the required energy later.",
              "Sunk Momentum Loss: Sacrificing any current cognitive alignment built up today."
            ]
          },
          {
            question: `Which existential trade-off are you actively accepting by pressing snooze?`,
            options: [
              "Erosion of self-trust: Teaching your subconscious that your commitments are optional.",
              "The Midnight Tax: Exchanging peaceful sleep for a rushed, panic-fueled sprint.",
              "Degraded Quality: Accepting a sub-optimal outcome over a disciplined, polished craft.",
              "Prolonged Low-Grade Dread: Carrying this mental payload through your entire break."
            ]
          }
        ]);
      })
      .finally(() => {
        setLoadingAlarmQuestion(false);
      });
  };

  const fetchTruthMcq = (task: Task) => {
    setLoadingTruthQuestion(true);
    setAlarmError('');
    setSelectedTruthOption(null);
    setTruthMcq(null);
    fetch('/api/alarms/truth-mcq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        description: task.description
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.question && data.options) {
          setTruthMcq(data);
        } else {
          throw new Error("Invalid format");
        }
      })
      .catch(err => {
        console.warn("Failed to fetch truth MCQ:", err);
        setTruthMcq({
          question: `Which statement represents the absolute truth of your execution for "${task.title}"?`,
          options: [
            "Uncompromised Quality: Fully completed, validated, and polished to standard.",
            "Superficial Compliance: Checked it off, but bypassed actual cognitive depth.",
            "Auditory Escape: Declaring done primarily to silence this alarming siren.",
            "Deferred Execution: The checkbox is marked, but the heavy lifting is postponed."
          ]
        });
      })
      .finally(() => {
        setLoadingTruthQuestion(false);
      });
  };

  // Handle agentic breakdown request
  const handleAutoPlanRequest = (task: Task) => {
    // Optimistically show planning state
    fetch('/api/tasks/auto-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate
      })
    })
      .then(res => res.json())
      .then(data => {
        const updated = tasks.map(t => {
          if (t.id === task.id) {
            return {
              ...t,
              autoPlan: data
            };
          }
          return t;
        });
        saveTasks(updated);
      })
      .catch(err => {
        console.error('Error generating plan:', err);
      });
  };

  // Toggle subtask completion inside active plan
  const handleSubtaskToggle = (taskId: string, subtaskIndex: number) => {
    const updated = tasks.map(t => {
      if (t.id === taskId && t.autoPlan) {
        const subtasks = [...t.autoPlan.subtasks];
        subtasks[subtaskIndex] = {
          ...subtasks[subtaskIndex],
          completed: !subtasks[subtaskIndex].completed
        };
        return {
          ...t,
          autoPlan: {
            ...t.autoPlan,
            subtasks
          }
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Habit trigger logic
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const newHabit = {
      id: Date.now().toString(),
      title: newHabitTitle.trim(),
      streak: 1,
      lastDone: new Date().toISOString().split('T')[0]
    };
    setHabits([...habits, newHabit]);
    setNewHabitTitle('');
  };

  const incrementStreak = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id === habitId) {
        if (h.lastDone === today) return h; // already checked in today
        return {
          ...h,
          streak: h.streak + 1,
          lastDone: today
        };
      }
      return h;
    });
    setHabits(updated);
  };

  // Voice Input command listener
  const toggleListening = () => {
    if (!speechSupported) return;
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    if (!isListening) {
      setIsListening(true);
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceResult(text);
        
        // Parse simple commands e.g., "Add task Study for Biology"
        if (text.toLowerCase().startsWith('add task')) {
          const title = text.substring(8).trim();
          if (title) {
            handleAddTask({
              title,
              description: 'Created via Voice Command prompt.',
              dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              dueTime: '17:00',
              urgency: 'medium',
              category: 'Other'
            });
          }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      setIsListening(false);
    }
  };

  // Stats calculation
  const pendingTasks = tasks.filter(t => !t.completed);
  const criticalCount = pendingTasks.filter(t => t.urgency === 'critical').length;
  const highCount = pendingTasks.filter(t => t.urgency === 'high').length;
  const completedCount = tasks.filter(t => t.completed).length;

  // Filter tasks (remove completed tasks from the list entirely)
  const filteredTasks = tasks.filter(t => {
    if (t.completed) return false;
    const categoryMatch = selectedCategory === 'All' || t.category === selectedCategory;
    const urgencyMatch = selectedUrgency === 'All' || t.urgency === selectedUrgency;
    return categoryMatch && urgencyMatch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col">
      {/* Visual Identity top status board */}
      <header id="main-header" className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-red-glow">
            <ShieldAlert className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-display flex items-center gap-2">
              The Last-Minute Life Saver
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-widest animate-pulse-slow">
                Proactive Guardian Active
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Agentic productivity companion tailored to dismantle procrastination and avoid failure cascades.
            </p>
          </div>
        </div>

        {/* Dynamic System Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-gray-500 text-[10px] block leading-none">THREAT LEVEL</span>
              <span className={`font-semibold ${criticalCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {criticalCount > 0 ? '⚠️ SEVERE CRISIS' : 'OPTIMAL'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-gray-500 text-[10px] block leading-none">PENDING THREATS</span>
              <span className="font-semibold text-white">
                {pendingTasks.length} deadlines
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Permission alert bar */}
      {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
        <div className="bg-blue-950/40 border-b border-blue-900/60 px-6 py-2.5 flex items-center justify-between text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400 animate-bounce animate-pulse" />
            <span><strong>Enable background reminders and alarm notifications:</strong> Ensure the guardian triggers sound and desktop notifications even if you switch browser tabs or minimize the window.</span>
          </div>
          <button
            id="btn-request-notifications"
            onClick={requestNotificationPermission}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1 rounded transition-colors text-[11px] cursor-pointer"
          >
            Activate Guardian Alerts
          </button>
        </div>
      )}

      {/* Main Container */}
      <main id="main-content-area" className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 md:px-6 space-y-8">
        
        {/* TASK EDITOR INTERFACE: REGISTER NEW DEADLINE (AT THE VERY TOP) */}
        <div id="top-task-editor" className="bg-slate-900/40 border border-slate-900/80 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Plus className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">Register New Deadline</h3>
          </div>
          <TaskForm onAddTask={handleAddTask} />
        </div>

        {/* UPPER PORTION: Only Task Portion (Quick Filters & Active Deadlines) */}
        <div className="space-y-4">
          
          {/* Category Quick Filter Grid */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/20 border border-slate-900 rounded-xl p-3">
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Work', 'Study', 'Finance', 'Personal', 'Health'].map(cat => (
                <button
                  id={`btn-filter-category-${cat}`}
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Impact:</span>
              <select
                id="filter-urgency-select"
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Consequence Levels</option>
                <option value="critical">Critical Only</option>
                <option value="high">High & Critical</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Active Tasks list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400 font-mono">
                Active Targets ({filteredTasks.length})
              </h2>
              <span className="text-xs text-gray-500">
                Sorted chronologically by nearest threat
              </span>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-900/60 rounded-xl p-6">
                <p className="text-sm text-gray-500">No deadlines detected matching the current filter filters.</p>
                <p className="text-xs text-gray-600 mt-1">Register tasks to activate your cognitive firewall.</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onCompleteToggle={handleCompleteToggleRequest}
                  onDeleteRequest={handleDeleteRequest}
                  onAutoPlanRequest={handleAutoPlanRequest}
                  onSubtaskToggle={handleSubtaskToggle}
                />
              ))
            )}
          </div>

          {/* Archived Tasks (Completed) - Microsoft To-Do Style Collapsible List */}
          {tasks.filter(t => t.completed).length > 0 && (
            <div id="archived-completed-tasks" className="border-t border-slate-900/80 pt-5 space-y-3">
              <button
                id="btn-toggle-archives"
                onClick={() => setShowArchives(!showArchives)}
                className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 font-mono tracking-wider hover:text-gray-300 transition-colors cursor-pointer"
              >
                <span>{showArchives ? "▼" : "▶"} Archived Completed Tasks ({tasks.filter(t => t.completed).length})</span>
              </button>

              {showArchives && (
                <div className="space-y-2 mt-2 animate-fade-in pl-1">
                  {tasks.filter(t => t.completed).map(task => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 hover:border-slate-800 transition-all text-xs opacity-75 hover:opacity-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          id={`btn-unarchive-${task.id}`}
                          onClick={() => {
                            const updated = tasks.map(t => {
                              if (t.id === task.id) {
                                return { ...t, completed: false, completedAt: undefined };
                              }
                              return t;
                            });
                            saveTasks(updated);
                            // Also clean from dismissed so it can trigger again if needed
                            dismissedAlarmsRef.current = dismissedAlarmsRef.current.filter(id => id !== task.id);
                            localStorage.setItem('dismissed_alarms', JSON.stringify(dismissedAlarmsRef.current));
                          }}
                          className="text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Restore task to active"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-400 line-through truncate">{task.title}</p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            Completed at: {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'Recently'}
                          </p>
                        </div>
                      </div>

                      <button
                        id={`btn-delete-archive-${task.id}`}
                        onClick={() => handleDeleteRequest(task)}
                        className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-1"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Information Notice about Psychological Prevention */}
          <div className="bg-slate-900/10 border border-slate-900 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-300">Psychological Anti-Snooze Protocol:</span> Marking any active target complete or requesting deletion triggers an intensive cognitive validation challenge. You must resolve the question honestly to bypass the prompt. Procrastination is a response to stress; we neutralize it with objective reality.
            </div>
          </div>

        </div>

        {/* BOTTOM PORTION: Collapsible Diagnostics & Configuration */}
        <div className="border-t border-slate-900 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
                System Diagnostics & Controls
              </h3>
              <p className="text-[10px] text-gray-500">
                Review automated insights, manage custom safeguard habits, or activate voice companion.
              </p>
            </div>
            
            <button
              id="btn-toggle-diagnostics-drawer"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white border border-slate-800 transition-all font-mono text-xs cursor-pointer"
            >
              <span>{showDiagnostics ? "Hide Optional View Tools" : "Show Optional View Tools"}</span>
              <span className="text-[10px] text-gray-500">
                {showDiagnostics ? "▲" : "▼"}
              </span>
            </button>
          </div>

          {showDiagnostics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 mt-4 animate-fade-in">
              
              {/* Column 1: Daily Insights & Threat Gauge */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-red-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Guardian Threat Diagnostics</h3>
                </div>
                <DailyInsightCard tasks={tasks} />
              </div>

              {/* Column 2: System Diagnostics & Proactive Tools */}
              <div className="space-y-6">
                
                {/* Goal & Habit Streaks */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4.5 h-4.5 text-orange-400" />
                      <h3 className="text-sm font-semibold text-white tracking-tight font-display">
                        Daily Proactive Habits
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">STREAK MULTIPLIER</span>
                  </div>

                  <div className="space-y-2.5">
                    {habits.map(h => (
                      <div 
                        key={h.id} 
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-850"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-200 truncate">{h.title}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            Last logged: {h.lastDone || 'Never'}
                          </p>
                        </div>
                        <button
                          id={`btn-habit-streak-${h.id}`}
                          onClick={() => incrementStreak(h.id)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all font-mono text-xs cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>{h.streak} days</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddHabit} className="flex gap-2 mt-4 pt-3 border-t border-slate-850">
                    <input
                      id="habit-input-field"
                      type="text"
                      value={newHabitTitle}
                      onChange={(e) => setNewHabitTitle(e.target.value)}
                      placeholder="Add custom safeguard habit..."
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      id="btn-add-habit"
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer"
                    >
                      Create
                    </button>
                  </form>
                </div>

                {/* Voice assistance console */}
                <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest block">Voice Companion</span>
                    <p className="text-xs text-gray-300 truncate">
                      {isListening ? "Listening for command..." : voiceResult || "Say 'Add task [Your Task Title]'"}
                    </p>
                  </div>
                  
                  <button
                    id="btn-toggle-voice"
                    onClick={toggleListening}
                    className={`p-2 rounded-lg shrink-0 transition-all cursor-pointer ${
                      isListening 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' 
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white'
                    }`}
                    title={speechSupported ? "Talk to Assistant" : "Speech recognition unsupported on browser"}
                  >
                    {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                </div>

              </div>

            </div>
          )}
        </div>

      </main>

      {/* Psychological modal challenge prompt overlay */}
      {activeIntervention && (
        <PsychologicalModal
          task={activeIntervention.task}
          actionType={activeIntervention.actionType}
          isOpen={true}
          onClose={() => setActiveIntervention(null)}
          onConfirm={handleConfirmIntervention}
        />
      )}

      {/* Active Alarm Take-over Overlay */}
      {activeAlarmTask && (
        <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border-2 border-red-500 rounded-2xl p-6 md:p-8 shadow-2xl shadow-red-900/50 relative overflow-hidden animate-shake">
            
            {/* Decorative flashing hazard lines */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
            
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-red-500/15 border border-red-500/30 text-red-500 animate-pulse">
                <AlertTriangle className="w-10 h-10" />
              </div>
              
              <h2 className="text-2xl font-black text-white font-display uppercase tracking-tight">
                ⚠️ CRITICAL DEADLINE STRIKE!
              </h2>
              
              <p className="text-xs text-gray-400 font-mono">
                THE APPOINTED HOUR HAS ARRIVED. EXECUTION DELAY IS NO LONGER POSSIBLE.
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 mt-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    {activeAlarmTask.urgency.toUpperCase()} CONSEQUENCE
                  </span>
                  <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" /> {activeAlarmTask.dueTime || '23:59'}
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-white leading-snug">
                  {activeAlarmTask.title}
                </h3>
                
                {activeAlarmTask.description && (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {activeAlarmTask.description}
                  </p>
                )}
              </div>

              {/* RETAINED DEFAULT STATE: OPTIONS CHOSEN */}
              {(!alarmViewMode || alarmViewMode === 'ringing') && (
                <div className="space-y-4 pt-4">
                  <p className="text-xs text-slate-300 font-sans">
                    The defensive siren is currently active. Decide your immediate pathway. You cannot close this alert without providing an unskippable conscious reflection.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <button
                      id="btn-trigger-alarm-done"
                      onClick={() => {
                        setAlarmViewMode('done_praise');
                        setAlarmError('');
                        setDoneResponse('');
                        fetchTruthMcq(activeAlarmTask);
                      }}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      I COMPLETED IT!
                    </button>
                    
                    <button
                      id="btn-trigger-alarm-snooze"
                      onClick={() => {
                        setAlarmViewMode('snooze_question');
                        setSnoozeResponse('');
                        setAlarmError('');
                        fetchSnoozeMcqs(activeAlarmTask);
                      }}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/35 text-red-400 font-semibold text-xs transition-all border border-red-500/30 cursor-pointer"
                    >
                      <VolumeX className="w-4.5 h-4.5" />
                      SNOOZE DEADLINE
                    </button>
                  </div>
                </div>
              )}

              {/* SNOOZE INTELLIGENT QUESTION STATE */}
              {alarmViewMode === 'snooze_question' && (
                <div className="space-y-4 text-left pt-4">
                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold text-red-400 font-mono uppercase tracking-wider">
                        🧠 PSYCHOLOGICAL INTERROGATION:
                      </label>
                      {snoozeMcqs.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                          STAGE {snoozeMcqIndex + 1} OF 3
                        </span>
                      )}
                    </div>

                    {loadingAlarmQuestion ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] text-gray-400 font-mono animate-pulse uppercase tracking-wider">INITIATING CONSCIOUS INTEGRITY SCAN...</p>
                      </div>
                    ) : snoozeMcqs.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-red-400">Unable to generate cognitive challenge. Please proceed safely.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Progress bar */}
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-red-500 h-full transition-all duration-300"
                            style={{ width: `${((snoozeMcqIndex + 1) / 3) * 100}%` }}
                          />
                        </div>

                        <p className="text-xs font-medium text-slate-200 bg-slate-950 border border-slate-850 rounded-xl p-3.5 italic leading-relaxed text-blue-300">
                          "{snoozeMcqs[snoozeMcqIndex]?.question}"
                        </p>

                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold block mb-1">
                            Acknowledge the psychological truth below to proceed:
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {snoozeMcqs[snoozeMcqIndex]?.options.map((option, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedSnoozeOption(option)}
                                className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                                  selectedSnoozeOption === option
                                    ? 'bg-red-500/10 text-red-300 border-red-500 shadow-md shadow-red-950/40 font-semibold'
                                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>

                        {alarmError && (
                          <p className="text-xs text-red-400 font-mono">{alarmError}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <button
                            id="btn-back-to-alarm"
                            onClick={() => {
                              setAlarmViewMode('ringing');
                              setAlarmError('');
                            }}
                            className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-xs transition-colors cursor-pointer text-center"
                          >
                            Cancel Interrogation
                          </button>

                          {snoozeMcqIndex < 2 ? (
                            <button
                              id="btn-next-snooze-question"
                              disabled={!selectedSnoozeOption}
                              onClick={() => {
                                setSnoozeMcqIndex(prev => prev + 1);
                                setSelectedSnoozeOption(null);
                              }}
                              className={`py-2.5 px-3 rounded-lg font-bold text-xs transition-all text-center ${
                                selectedSnoozeOption 
                                  ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer' 
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                              }`}
                            >
                              Next Challenge
                            </button>
                          ) : (
                            <button
                              id="btn-confirm-snooze-with-mcq"
                              disabled={!selectedSnoozeOption}
                              onClick={() => {
                                // Add to dismissed list to suppress alarm for this session
                                dismissedAlarmsRef.current.push(activeAlarmTask.id);
                                localStorage.setItem('dismissed_alarms', JSON.stringify(dismissedAlarmsRef.current));
                                activeAlarmIdRef.current = null;
                                
                                stopSirenSynth();
                                setActiveAlarmTask(null);
                                setAlarmViewMode(null);
                                setSnoozeMcqIndex(0);
                                setSelectedSnoozeOption(null);
                                setAlarmError('');
                              }}
                              className={`py-2.5 px-3 rounded-lg font-bold text-xs transition-all text-center ${
                                selectedSnoozeOption 
                                  ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-lg shadow-red-900/40' 
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                              }`}
                            >
                              Bypass Siren & Snooze
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DONE PRAISING VICTORY STATE */}
              {alarmViewMode === 'done_praise' && (
                <div className="space-y-4 text-left pt-4">
                  <div className="border-t border-slate-800 pt-4">
                    <label className="block text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider mb-2">
                      🧠 SYSTEM INTEGRITY CHECK: TRUTH-VALUATION
                    </label>

                    {loadingTruthQuestion ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] text-gray-400 font-mono animate-pulse uppercase tracking-wider">DIAGNOSING REALITY VS COMPLIANCE...</p>
                      </div>
                    ) : !truthMcq ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-red-400">Loading integrity checks...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs font-medium text-slate-200 bg-slate-950 border border-slate-850 rounded-xl p-3.5 italic leading-relaxed text-emerald-300">
                          "{truthMcq.question}"
                        </p>

                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold block mb-1">
                            Acknowledge your exact completion state:
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {truthMcq.options.map((option, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedTruthOption(option)}
                                className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                                  selectedTruthOption === option
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950/40 font-semibold'
                                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>

                        {alarmError && (
                          <p className="text-xs text-red-400 font-mono">{alarmError}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <button
                            id="btn-back-to-alarm-from-done"
                            onClick={() => {
                              setAlarmViewMode('ringing');
                              setAlarmError('');
                            }}
                            className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-xs transition-colors cursor-pointer text-center"
                          >
                            Back
                          </button>

                          <button
                            id="btn-confirm-done-with-praise"
                            disabled={!selectedTruthOption}
                            onClick={() => {
                              // Mark task as completed
                              const updated = tasks.map(t => {
                                if (t.id === activeAlarmTask.id) {
                                  return { ...t, completed: true, completedAt: new Date().toISOString() };
                                }
                                return t;
                              });
                              saveTasks(updated);

                              // Dismiss to prevent re-trigger
                              dismissedAlarmsRef.current.push(activeAlarmTask.id);
                              localStorage.setItem('dismissed_alarms', JSON.stringify(dismissedAlarmsRef.current));
                              activeAlarmIdRef.current = null;
                              
                              stopSirenSynth();
                              setActiveAlarmTask(null);
                              setAlarmViewMode(null);
                              setSelectedTruthOption(null);
                              setAlarmError('');
                            }}
                            className={`py-2.5 px-3 rounded-lg font-bold text-xs transition-all text-center ${
                              selectedTruthOption 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-950/40' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                            }`}
                          >
                            Validate Execution & Clear Alarm
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-[10px] font-mono text-gray-600">
        The Last-Minute Life Saver. Powered by Gemini Agentic Reasoning and Psychological Stress Prevention.
      </footer>
    </div>
  );
}
