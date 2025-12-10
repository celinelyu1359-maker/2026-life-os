import React, { useState, useEffect, useRef } from 'react';
import { Plus, Square, CheckSquare, Trash2, CalendarClock, ArrowRight, PenLine, Search } from 'lucide-react';
import { getWeeksInMonth, formatNiceDate } from '../utils';
import { NoteCard, MonthlyGoal, Language } from '../types';

// ✅ 1. 定义 localStorage 的 Key
const MONTH_INDEX_KEY = 'monthly-notebook-index-2026';
const GOALS_KEY = 'monthly-goals-2026';

// ✅ 2. 定义默认数据 (防止空状态)
const defaultGoals: MonthlyGoal[] = [];

interface MonthlyNotebookProps {
    navigateToWeek: (weekNum: number) => void;
    language: Language;
    notes: NoteCard[]; // ✅ Receive notes from App
    onEditNote: (note: NoteCard) => void;
    currentMonthIndex: number;
    setCurrentMonthIndex: (index: number) => void;
    goals: MonthlyGoal[];
    onAddGoal: (text: string) => void;
    onToggleGoal: (id: string) => void;
    onDeleteGoal: (id: string) => void;
    onDeferGoal: (id: string) => void;
}

const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthsZh = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

const MonthlyNotebook: React.FC<MonthlyNotebookProps> = ({ 
    navigateToWeek, 
    language,
    notes,
    onEditNote,
    currentMonthIndex,
    setCurrentMonthIndex,
    goals,
    onAddGoal,
    onToggleGoal,
    onDeleteGoal,
    onDeferGoal
}) => {
  // --- State Management ---
  
  // 1️⃣ 状态定义：使用默认值初始化
  const [localGoals, setLocalGoals] = useState<MonthlyGoal[]>(defaultGoals);
  
  // 2️⃣ 安全锁
  const [isLoaded, setIsLoaded] = useState(false);

  // 其他 UI 状态
  const [weeks, setWeeks] = useState<{weekNum: number, range: string}[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- LocalStorage Logic ---

  // 3️⃣ 挂载时读取数据
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedGoals = window.localStorage.getItem(GOALS_KEY);

        if (savedGoals) setLocalGoals(JSON.parse(savedGoals));

      } catch (e) {
        console.error('Failed to load notebook data', e);
      } finally {
        setIsLoaded(true); // 打开安全锁
      }
    }
  }, []);

  // 4️⃣ 监听变化并自动保存
  
  // 保存目标
  useEffect(() => {
    if (isLoaded) {
        window.localStorage.setItem(GOALS_KEY, JSON.stringify(localGoals));
    }
  }, [localGoals, isLoaded]);

  // --- Internal Logic ---

  // Generate weeks when month changes
  useEffect(() => {
    setWeeks(getWeeksInMonth(2026, currentMonthIndex, language));
  }, [currentMonthIndex, language]);

  // Scroll active tab into view
  useEffect(() => {
      if(scrollContainerRef.current) {
          const tab = scrollContainerRef.current.children[currentMonthIndex] as HTMLElement;
          if(tab) {
              tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
      }
  }, [currentMonthIndex]);

  // --- Action Handlers (Using Props) ---

  const handleAddGoal = () => {
      if(newGoalText.trim()) {
          onAddGoal(newGoalText);
          setNewGoalText('');
          setIsAddingGoal(false);
      }
  };

  const toggleGoal = (id: string) => {
      onToggleGoal(id);
  };

  const deleteGoal = (id: string) => {
      onDeleteGoal(id);
  };

  const deferGoal = (id: string) => {
      onDeferGoal(id);
  };

  // --- Filtering Logic ---

  // Filter notes for current month AND search term
  const currentMonthNotes = notes.filter(n => {
      const d = new Date(n.date);
      // 注意：确保 n.date 是标准日期格式字符串
      const isCurrentMonth = d.getMonth() === currentMonthIndex && d.getFullYear() === 2026;
      if (!isCurrentMonth) return false;
      
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term);
  });

  // Filter goals for current month (Assuming goals might serve all months, or you filter them locally)
  // ✅ Use goals from props (already filtered by month from App)
  const displayGoals = goals;

  const months = language === 'en' ? monthsEn : monthsZh;
  const currentMonthName = months[currentMonthIndex];

  // Translations
  const t = {
      subtitle: language === 'en' 
        ? 'A mini-season for focus and reflection.' 
        : '专注于当下，记录生活的小季节。',
      goalsTitle: language === 'en' ? 'Priorities & Goals' : '月度优先事项',
      weeksTitle: language === 'en' ? 'Weekly Timeline' : '每周时间线',
      notesTitle: language === 'en' ? 'Field Notes' : '随笔与灵感',
      addGoal: language === 'en' ? 'Add Item' : '添加事项',
      defer: language === 'en' ? 'Defer' : '推迟',
      noGoals: language === 'en' ? 'No goals set for this month yet.' : '本月暂无目标。',
      noNotes: language === 'en' ? 'No notes yet.' : '暂无笔记。',
      openWeek: language === 'en' ? 'Open' : '打开',
      monthLabel: language === 'en' ? 'MONTH' : '月份',
      filter: language === 'en' ? 'Filter...' : '筛选...',
  };

  return (
    <div className="p-2 md:p-4 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col animate-fade-in">
      
      {/* Folder Tabs Navigation */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto no-scrollbar items-end pl-2 md:pl-4 pt-2 gap-1 relative z-10 select-none"
      >
        {months.map((m, idx) => {
            const isActive = currentMonthIndex === idx;
            return (
                <button
                    key={m}
                    onClick={() => setCurrentMonthIndex(idx)}
                    className={`
                        relative rounded-t-xl text-xs font-medium transition-all duration-300 ease-out shrink-0
                        ${isActive 
                            ? 'px-6 pt-3 pb-4 bg-[#FDFCF6] text-slate-900 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20 block' 
                            : 'px-4 py-2 bg-[#E2E8F0] text-slate-500 hover:bg-[#CBD5E1] mt-2 z-0 flex items-center gap-1.5'}
                    `}
                    style={{
                        transform: isActive ? 'translateY(1px)' : 'translateY(0)', 
                    }}
                >
                    <span className={`uppercase tracking-wider text-[9px] opacity-50 ${isActive ? 'block mb-0.5' : ''}`}>
                        {language === 'en' ? (idx + 1 < 10 ? `0${idx+1}` : idx+1) : `${idx+1}月`}
                    </span>
                    <span className={isActive ? 'font-serif text-base font-bold' : ''}>
                        {language === 'zh' ? m.replace('月', '') : m.slice(0,3)}
                    </span>
                </button>
            )
        })}
      </div>

      {/* Main Folder Content */}
      <div className="bg-[#FDFCF6] flex-1 rounded-3xl rounded-tl-none md:rounded-tl-none shadow-sm p-4 md:p-6 overflow-y-auto relative z-20 mx-1 md:mx-0">
        
        {/* Header Section */}
        <div className="mb-5 border-b border-slate-200 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold tracking-widest uppercase">
                            {t.monthLabel} {currentMonthIndex + 1 < 10 ? `0${currentMonthIndex + 1}` : currentMonthIndex + 1}
                        </span>
                        <div className="h-px w-8 bg-slate-900/20"></div>
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl text-slate-900 mb-1 tracking-tight">
                        {currentMonthName}
                    </h1>
                    <p className="text-slate-500 max-w-lg leading-relaxed font-light text-xs">
                        {t.subtitle}
                    </p>
                </div>
                <div className="hidden md:block text-right">
                    <div className="text-[60px] leading-none font-serif text-slate-900/5 select-none pointer-events-none">
                        2026
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
            
            {/* Left Column: Weeks (Timeline) */}
            <div className="lg:col-span-4 space-y-4">
                <h3 className="font-serif text-lg text-slate-900 mb-3 flex items-center gap-2">
                    {t.weeksTitle}
                </h3>
                <div className="space-y-2">
                    {weeks.map((week) => (
                        <div 
                            key={week.weekNum}
                            onClick={() => navigateToWeek(week.weekNum)}
                            className="group relative bg-white border border-slate-100 p-3 rounded-xl hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-slate-900 transition-colors rounded-l-xl"></div>
                            <div className="flex justify-between items-center pl-2">
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-0.5 block">Week {week.weekNum}</span>
                                    <span className="text-xs font-medium text-slate-700 font-mono">{week.range}</span>
                                </div>
                                <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                    <ArrowRight size={10} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Goals & Notes */}
            <div className="lg:col-span-8 grid grid-cols-1 gap-6">
                
                {/* Monthly Goals Section */}
                <div>
                    <div className="flex justify-between items-end mb-3 border-b border-slate-200 pb-2">
                         <h3 className="font-serif text-lg text-slate-900">{t.goalsTitle}</h3>
                         {!isAddingGoal && (
                            <button 
                                onClick={() => setIsAddingGoal(true)} 
                                className="text-slate-500 hover:text-slate-900 text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <Plus size={12} /> {t.addGoal}
                            </button>
                         )}
                    </div>

                    <div className="space-y-1">
                        {displayGoals.length === 0 && !isAddingGoal && (
                            <div className="py-4 text-center bg-white/50 border border-dashed border-slate-200 rounded-xl">
                                <p className="text-slate-400 text-xs font-light italic">{t.noGoals}</p>
                            </div>
                        )}
                        
                        {displayGoals.map(goal => (
                             <div key={goal.id} className="group flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0 hover:bg-white/50 px-2 rounded-lg transition-colors">
                                <button onClick={() => toggleGoal(goal.id)} className="mt-0.5 text-slate-400 hover:text-slate-900 transition-colors">
                                    {goal.completed ? <CheckSquare size={16}/> : <Square size={16}/>}
                                </button>
                                <span className={`flex-1 text-sm font-light leading-relaxed ${goal.completed ? 'line-through text-slate-300' : 'text-slate-800'}`}>
                                    {goal.text}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => deferGoal(goal.id)} className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full" title={t.defer}>
                                        <CalendarClock size={12}/>
                                    </button>
                                    <button onClick={() => deleteGoal(goal.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {isAddingGoal && (
                            <div className="flex items-center gap-2 py-1.5 px-2 bg-white rounded-xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-1">
                                <Square size={16} className="text-slate-300"/>
                                <input 
                                    autoFocus
                                    value={newGoalText}
                                    onChange={e => setNewGoalText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
                                    className="flex-1 bg-transparent text-sm font-light placeholder:text-slate-300 border-none outline-none focus:ring-0"
                                    placeholder={language === 'en' ? "What matters this month?" : "这个月重要的是什么？"}
                                />
                                <button onClick={handleAddGoal} className="bg-slate-900 text-white p-1 rounded-lg hover:bg-slate-700">
                                    <Plus size={12}/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Field Notes Section */}
                <div>
                    <div className="flex justify-between items-end mb-3 border-b border-slate-200 pb-2">
                        <h3 className="font-serif text-lg text-slate-900 flex items-center gap-2">
                            {t.notesTitle} <PenLine size={14} className="text-slate-400"/>
                        </h3>
                        <div className="relative w-24 sm:w-32 md:w-40">
                             <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                             <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t.filter}
                                className="w-full pl-6 pr-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] outline-none focus:border-slate-300 focus:bg-white transition-all placeholder:text-slate-300"
                             />
                        </div>
                    </div>
                    
                    {currentMonthNotes.length === 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="aspect-square bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center opacity-50">
                                    <div className="w-8 h-1 bg-slate-200 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {currentMonthNotes.map((note) => (
                                <div 
                                    key={note.id} 
                                    onClick={() => onEditNote(note)}
                                    className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-100 to-purple-100 opacity-50"></div>
                                    <h4 className="font-bold text-slate-900 mb-1 line-clamp-1 text-xs">{note.title}</h4>
                                    <p className="text-[10px] text-slate-500 font-light leading-relaxed line-clamp-4 mb-2">
                                        {note.content || "Empty note..."}
                                    </p>
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 uppercase tracking-widest font-medium border-t border-slate-50 pt-2">
                                        <span>{formatNiceDate(note.date, language)}</span>
                                        <span className="opacity-0 group-hover:opacity-100 text-slate-900 transition-opacity">Edit &rarr;</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyNotebook;