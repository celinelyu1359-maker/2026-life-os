import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnnualSettings from './components/AnnualSettings';
import MonthlyNotebook from './components/MonthlyNotebook';
import ReadingMovies from './components/ReadingMovies';
import { View, NoteCard, ChallengeItem, MonthlyGoal, Language } from './types';
import { X, Plus, Save } from 'lucide-react';
// ✅ 关键导入：确保 utils 路径正确，且 getCurrentWeekNumber 在 utils.ts 中
import { getCurrentWeekNumber } from './utils';

// LocalStorage Keys (需要与 Dashboard.tsx 中使用的保持一致)
const CURRENT_WEEK_KEY = 'current-week-num-2026';
const NOTES_KEY = 'monthly-notes-2026'; // ✅ Shared with MonthlyNotebook
const TARGET_YEAR = 2026; // 定义你的规划年份

// ✅ Default notes data
const defaultNotes: NoteCard[] = [
    { id: '1', title: 'Example Note', date: '2026-01-01', content: 'Welcome to your Life OS', type: 'note'}
];

// ✅ 核心函数：决定 currentWeek 的初始值
const getInitialWeek = (): number => {
    // 1. 确保代码在浏览器环境中运行
    if (typeof window === 'undefined') {
        return 1; 
    }
    
    // 2. 尝试从 LocalStorage 读取上次保存的周数
    const savedWeek = window.localStorage.getItem(CURRENT_WEEK_KEY);
    if (savedWeek !== null) {
        const weekNum = Number(savedWeek);
        // 如果读取到了一个有效的周数（1-52），就用它
        if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 52) {
            return weekNum;
        }
    }
    
    // 3. 如果 LocalStorage 没有记录或记录无效，则计算并返回当前自然周数
    // 如果你在 2025 年运行，查看 2026 年的项目，这可能会返回 Week 1
    return getCurrentWeekNumber(TARGET_YEAR);
};


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  
  // Navigation State
  // ✅ 修正点：使用 getInitialWeek() 确保初始周数正确加载
  const [currentWeek, setCurrentWeek] = useState<number>(getInitialWeek());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0); // 0 = Jan

  // --- Data State (Lifted) ---
  const [notes, setNotes] = useState<NoteCard[]>(defaultNotes);
  const [isLoaded, setIsLoaded] = useState(false); // ✅ Safety lock for localStorage

  // Record<MonthIndex, Items[]>
  const [monthlyGoalsData, setMonthlyGoalsData] = useState<Record<number, MonthlyGoal[]>>({
      0: [{ id: 'mg1', text: 'Finish 4 weekly reviews on time', completed: false }]
  });

  // ✅ Load notes from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedNotes = window.localStorage.getItem(NOTES_KEY);
        if (savedNotes) {
          const parsed = JSON.parse(savedNotes);
          if (Array.isArray(parsed)) {
            setNotes(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load notes from localStorage', e);
      } finally {
        setIsLoaded(true);
      }
    }
  }, []);

  // ✅ Save notes to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      } catch (e) {
        console.error('Failed to save notes to localStorage', e);
      }
    }
  }, [notes, isLoaded]);

  // --- Logic for Monthly Goals (保留，未修改) ---
  const getCurrentMonthlyGoals = () => monthlyGoalsData[currentMonthIndex] || [];

  const handleAddMonthlyGoal = (text: string) => {
      setMonthlyGoalsData(prev => ({
          ...prev,
          [currentMonthIndex]: [...(prev[currentMonthIndex] || []), { id: Date.now().toString(), text, completed: false }]
      }));
  };

  const handleToggleMonthlyGoal = (id: string) => {
      setMonthlyGoalsData(prev => ({
          ...prev,
          [currentMonthIndex]: prev[currentMonthIndex]?.map(g => g.id === id ? {...g, completed: !g.completed} : g) || []
      }));
  };

  const handleDeleteMonthlyGoal = (id: string) => {
       setMonthlyGoalsData(prev => ({
          ...prev,
          [currentMonthIndex]: prev[currentMonthIndex]?.filter(g => g.id !== id) || []
      }));
  };

  const handleDeferMonthlyGoal = (id: string) => {
      const itemToDefer = monthlyGoalsData[currentMonthIndex]?.find(g => g.id === id);
      if(!itemToDefer) return;

      setMonthlyGoalsData(prev => {
          const nextMonth = currentMonthIndex + 1;
          if(nextMonth > 11) return prev; 
          
          return {
              ...prev,
              [currentMonthIndex]: prev[currentMonthIndex].filter(g => g.id !== id),
              [nextMonth]: [...(prev[nextMonth] || []), itemToDefer]
          };
      });
  };

  // --- Modal State (保留，未修改) ---
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteCard | null>(null);

  const handleNavigateToWeek = (weekNum: number) => {
      setCurrentWeek(weekNum);
      setActiveView('dashboard');
  };

  const handleSaveNote = (note: NoteCard) => {
    if(editingNote && notes.find(n => n.id === editingNote.id)) {
        // Update existing
        setNotes(prev => prev.map(n => n.id === note.id ? note : n));
    } else {
        // Add new
        setNotes(prev => [note, ...prev]);
    }
    closeModal();
  };

  const openQuickNote = () => {
      setEditingNote(null); // Clear for new
      setIsNoteModalOpen(true);
  };

  const openEditNote = (note: NoteCard) => {
      setEditingNote(note);
      setIsNoteModalOpen(true);
  }

  const closeModal = () => {
      setIsNoteModalOpen(false);
      setEditingNote(null);
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
            weekNumber={currentWeek} 
            setWeekNumber={setCurrentWeek} 
        />;
      case 'annual':
        return <AnnualSettings />;
      case 'monthly':
        return <MonthlyNotebook 
            navigateToWeek={handleNavigateToWeek} 
            currentMonthIndex={currentMonthIndex}
            setCurrentMonthIndex={setCurrentMonthIndex}
            notes={notes}
            onEditNote={openEditNote}
            goals={getCurrentMonthlyGoals()}
            onAddGoal={handleAddMonthlyGoal}
            onToggleGoal={handleToggleMonthlyGoal}
            onDeleteGoal={handleDeleteMonthlyGoal}
            onDeferGoal={handleDeferMonthlyGoal}
            language={language}
        />;
      case 'reading':
        return <ReadingMovies language={language} />;
      default:
        return <Dashboard 
            weekNumber={currentWeek} 
            setWeekNumber={setCurrentWeek} 
        />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onOpenQuickNote={openQuickNote}
        currentWeek={currentWeek}
        language={language}
        setLanguage={setLanguage}
      />
      
      {/* Mobile Header / Nav Placeholder (Could be added for full mobile support, currently leveraging responsive main) */}
      
      <main className="md:ml-64 flex-1 p-0 overflow-y-auto h-screen pb-20 md:pb-0">
        {renderContent()}
      </main>

       {/* Mobile Bottom Nav (Optional, but good for mobile access if Sidebar is hidden) */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around z-20">
          <button onClick={() => setActiveView('dashboard')} className={`p-2 rounded-lg ${activeView === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button onClick={() => setActiveView('monthly')} className={`p-2 rounded-lg ${activeView === 'monthly' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </button>
          <button onClick={() => openQuickNote()} className="bg-slate-900 text-white p-3 rounded-full -mt-6 shadow-lg">
              <Plus size={24} />
          </button>
          <button onClick={() => setActiveView('reading')} className={`p-2 rounded-lg ${activeView === 'reading' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </button>
           <button onClick={() => setActiveView('annual')} className={`p-2 rounded-lg ${activeView === 'annual' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
       </div>

      {/* Note Editor Modal */}
      {isNoteModalOpen && (
          <NoteModal 
            onClose={closeModal} 
            onSave={handleSaveNote} 
            initialData={editingNote} 
            language={language}
          />
      )}
    </div>
  );
};

// "Boring Office" Typewriter Paper Modal
const NoteModal: React.FC<{onClose: () => void, onSave: (n: NoteCard) => void, initialData: NoteCard | null, language: Language}> = ({ onClose, onSave, initialData, language }) => {
    const [title, setTitle] = useState(initialData?.title || (language === 'en' ? 'Quick Note' : '随手记'));
    const [content, setContent] = useState(initialData?.content || '');
    const [noteDate, setNoteDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const handleSave = () => {
        onSave({
            id: initialData?.id || Date.now().toString(),
            title,
            content,
            date: noteDate,
            type: 'note'
        });
    };

    const dateStr = noteDate.replace(/-/g, '.');

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            {/* Paper Sheet Container */}
            <div 
                className="bg-[#F6F4EB] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300 relative overflow-hidden"
                style={{
                    borderRadius: '2px', // Slight rounding like paper
                    minHeight: '600px',
                    boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
            >
                {/* Paper Header Section */}
                <div className="pt-12 px-10 pb-4">
                    <div className="flex justify-between items-end font-typewriter text-xs text-slate-800 opacity-80 mb-1">
                        <button 
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="hover:opacity-100 hover:underline cursor-pointer transition-opacity"
                        >
                            omont.{dateStr}
                        </button>
                        <span>{language === 'en' ? 'boring office' : '日常记录'}</span>
                    </div>
                    {/* Date Picker (For Testing) */}
                    {showDatePicker && (
                        <div className="mb-3 pb-3 border-b border-dashed border-slate-300">
                            <input 
                                type="date"
                                value={noteDate}
                                onChange={(e) => setNoteDate(e.target.value)}
                                className="text-xs px-2 py-1 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                            />
                            <p className="text-[9px] text-slate-400 mt-1 font-light">💡 Tip: Change date to test monthly notes (use 2026 dates)</p>
                        </div>
                    )}
                    {/* The hard line */}
                    <div className="w-full h-px bg-slate-800"></div>
                </div>

                {/* Content Section */}
                <div className="px-10 pb-10 flex flex-col h-full font-typewriter">
                    
                    {/* Title Input */}
                    <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-transparent text-slate-900 font-bold text-lg mb-6 outline-none placeholder:text-slate-400"
                        placeholder="Title..."
                        autoFocus
                    />

                    {/* Body Textarea */}
                    <textarea 
                        value={content} 
                        onChange={e => setContent(e.target.value)}
                        className="w-full flex-1 bg-transparent text-slate-800 text-sm leading-relaxed resize-none outline-none placeholder:text-slate-400 h-64"
                        placeholder={language === 'en' ? "old memory of new time ...." : "写下你的想法...."}
                        spellCheck={false}
                    ></textarea>

                    {/* Footer / Actions */}
                    <div className="mt-8 pt-6 border-t border-dashed border-slate-300 flex justify-between items-center">
                         <button 
                            onClick={onClose}
                            className="text-xs text-slate-500 hover:text-red-500 hover:underline transition-colors"
                        >
                            [ {language === 'en' ? 'discard' : '丢弃'} ]
                        </button>
                        
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                            [ {language === 'en' ? 'save_record' : '保存记录'} ]
                        </button>
                    </div>
                </div>
                
                {/* Visual Texture Hint (Optional corner fold or similar could go here) */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-black/5 rounded-bl-xl pointer-events-none"></div>
            </div>
        </div>
    )
}

export default App;