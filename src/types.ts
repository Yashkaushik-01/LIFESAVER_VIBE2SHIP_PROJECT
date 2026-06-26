export interface SubTask {
  title: string;
  estimated_duration: string;
  consequence_if_skipped: string;
  completed?: boolean;
}

export interface AutoPlan {
  suggested_timeline_summary: string;
  subtasks: SubTask[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: 'Work' | 'Study' | 'Finance' | 'Personal' | 'Health' | 'Other';
  completed: boolean;
  completedAt: string | null;
  autoPlan: AutoPlan | null;
  consequenceAnalysis?: {
    intelligent_question: string;
    thought_provoking_context: string;
  };
}

export interface DailyInsight {
  risk_score: number;
  risk_analysis: string;
  recommendations: string[];
}
