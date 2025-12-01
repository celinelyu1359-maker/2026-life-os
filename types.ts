export type View = 'dashboard' | 'annual' | 'monthly' | 'reading';
export type Language = 'en' | 'zh';

export interface ScoreboardItem {
  id: string;
  goal: string;
  normal: string;
  silver: string;
  golden: string;
  current: number; 
  max: number; 
  unit: string;
  lastWeek: number; // Value achieved in the previous week for trend comparison
}

export interface ToDoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DimensionItem {
  id: string;
  text: string;
  completed: boolean;
  actualResult?: string; // Added for reflection
}

export interface Dimension {
  id: string;
  title: string;
  items: DimensionItem[];
}

export interface NoteCard {
  id: string;
  title: string;
  date: string; // ISO string YYYY-MM-DD
  content: string;
  type: 'week' | 'note';
}

export interface ChallengeItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ReadingItem {
  id: string;
  title: string;
  type: 'book' | 'movie';
  rating: number; // 1-5
  tags: string[];
  review: string;
  dateFinished: string;
}

export interface MonthlyGoal {
    id: string;
    text: string;
    completed: boolean;
}