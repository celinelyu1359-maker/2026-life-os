import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnnualSettings from './components/AnnualSettings';
import MonthlyNotebook from './components/MonthlyNotebook';
import ReadingMovies from './components/ReadingMovies';
import AuthScreen from './components/AuthScreen';
import { ToastContainer, useToast } from './components/Toast';
import { View, NoteCard, MonthlyGoal, Language } from './types';
import { Plus } from 'lucide-react';
import { getCurrentWeekNumber } from './utils';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// **已删除：LocalStorage Keys**
// const CURRENT_WEEK_KEY = 'current-week-num-2026'; // 不再使用 localStorage
// const NOTES_KEY = 'monthly-notes-2026'; // 不再使用 localStorage

const TARGET_YEAR = 2026;

// Default notes data: 仅作为未登录/加载失败时的 fallback
const defaultNotes: NoteCard[] = [
  { id: '1', title: 'Example Note (Local Fallback)', date: '2026-01-01', content: 'Welcome to your Life OS. Please log in to sync your data.', type: 'note' }
];

// **已修改：获取初始周数 - 不再从 localStorage 读取**
const getInitialWeek = (): number => {
  // 不再从 localStorage 读取，仅获取当前的实际周数
  return getCurrentWeekNumber(TARGET_YEAR);
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [language, setLanguage] = useState<Language>('en');

  // Toast notifications
  const toast = useToast();

  // Auth State
  const [user, setUser] = useState<any>(null);

  // Navigation State
  const [currentWeek, setCurrentWeek] = useState<number>(getInitialWeek());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // Data State
  const [notes, setNotes] = useState<NoteCard[]>(defaultNotes);
  const [isLoaded, setIsLoaded] = useState(false);
  const [monthlyGoalsLoaded, setMonthlyGoalsLoaded] = useState(false);

  const [monthlyGoalsData, setMonthlyGoalsData] = useState<Record<number, MonthlyGoal[]>>({
    0: [{ id: 'mg1', text: 'Finish 4 weekly reviews on time', completed: false }]
  });

  // Supabase auth boot (逻辑保持不变)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoaded(true);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // **已修改：从 Supabase 加载 notes**
  useEffect(() => {
    const load = async () => {
      // 如果未配置 Supabase 或用户未登录，则只显示默认笔记，并标记为已加载
      if (!isSupabaseConfigured || !user) {
        setNotes(defaultNotes);
        setIsLoaded(true);
        return;
      }

      // 从云端加载数据
      try {
        console.log('📥 Loading notes from Supabase for user:', user.id);
        
        const { data, error } = await supabase
          .from('notes')
          .select('id,title,content,date,type') 
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Error loading notes:', error);
          throw error;
        }
        
        console.log('📋 Loaded notes:', data?.length || 0, 'notes');
        
        if (data && data.length > 0) {
          setNotes(data);
        } else {
          // 如果没有数据，设置为空数组而不是默认笔记
          console.log('ℹ️ No notes found, starting with empty array');
          setNotes([]);
        }
      } catch (e: any) {
        console.error('❌ Failed to load notes from Supabase:', e);
        console.error('Error details:', JSON.stringify(e, null, 2));
        // 加载失败时仍显示默认笔记
        setNotes(defaultNotes);
      } finally {
        setIsLoaded(true);
      }
    };

    load();
  }, [user]);

  // 辅助函数：同步 Monthly Goals 到云端
  const syncMonthlyGoalsToCloud = useCallback(async (goalsData: Record<number, MonthlyGoal[]>, userId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const rows = Object.entries(goalsData).map(([monthIndex, goals]) => ({
        id: `${userId}-${monthIndex}-2026`,
        user_id: userId,
        month_index: parseInt(monthIndex),
        year: 2026,
        goals: Array.isArray(goals) ? goals : [], // 确保是数组
      }));

      if (rows.length > 0) {
        const { error } = await supabase.from('monthly_goals').upsert(rows, {
          onConflict: 'id',
        });

        if (error) {
          console.error('Monthly goals sync error:', error);
          throw error;
        }
      }
    } catch (e) {
      console.error('Failed to sync monthly goals to cloud', e);
    }
  }, []);

  // **新增：从 Supabase 加载 Monthly Goals**
  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !user) {
        // 未配置或未登录，尝试从 localStorage 加载
        if (typeof window !== 'undefined') {
          try {
            const saved = window.localStorage.getItem('monthly-goals-2026');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && typeof parsed === 'object') {
                setMonthlyGoalsData(parsed);
              } else {
                setMonthlyGoalsData({});
              }
            } else {
              setMonthlyGoalsData({});
            }
          } catch (e) {
            console.error('Failed to load monthly goals from localStorage', e);
            setMonthlyGoalsData({});
          }
        } else {
          setMonthlyGoalsData({});
        }
        setMonthlyGoalsLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('monthly_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', 2026)
          .order('month_index', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // 转换数据库格式到应用格式
          const converted: Record<number, MonthlyGoal[]> = {};
          data.forEach(row => {
            converted[row.month_index] = Array.isArray(row.goals) ? row.goals : [];
          });
          setMonthlyGoalsData(converted);
        } else {
          // 云端没有数据，尝试从 localStorage 加载并同步
          if (typeof window !== 'undefined') {
            try {
              const saved = window.localStorage.getItem('monthly-goals-2026');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                  setMonthlyGoalsData(parsed);
                  // 同步到云端（延迟执行，避免在加载时触发）
                  setTimeout(() => syncMonthlyGoalsToCloud(parsed, user.id), 100);
                } else {
                  setMonthlyGoalsData({});
                }
              } else {
                setMonthlyGoalsData({});
              }
            } catch (e) {
              console.error('Failed to load from localStorage', e);
              setMonthlyGoalsData({});
            }
          } else {
            setMonthlyGoalsData({});
          }
        }
      } catch (e) {
        console.error('Failed to load monthly goals from Supabase', e);
        // 失败时 fallback 到 localStorage
        if (typeof window !== 'undefined') {
          try {
            const saved = window.localStorage.getItem('monthly-goals-2026');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && typeof parsed === 'object') {
                setMonthlyGoalsData(parsed);
              } else {
                setMonthlyGoalsData({});
              }
            } else {
              setMonthlyGoalsData({});
            }
          } catch (err) {
            console.error('Failed to load from localStorage', err);
            setMonthlyGoalsData({});
          }
        } else {
          setMonthlyGoalsData({});
        }
      } finally {
        setMonthlyGoalsLoaded(true);
      }
    };

    load();
  }, [user, syncMonthlyGoalsToCloud]);

  // **新增：保存 Monthly Goals 到 localStorage 和 Supabase**
  useEffect(() => {
    if (!monthlyGoalsLoaded) return; // 等待加载完成后再保存

    // 1. 始终保存到 localStorage
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('monthly-goals-2026', JSON.stringify(monthlyGoalsData));
      }
    } catch (e) {
      console.error('Failed to save monthly goals to localStorage', e);
    }

    // 2. 如果配置了 Supabase 且用户已登录，同步到云端
    if (isSupabaseConfigured && user) {
      // 过滤掉空数组的月份，只同步有数据的月份
      const nonEmptyGoals = Object.entries(monthlyGoalsData).reduce((acc, [monthIndex, goals]) => {
        const goalsArray = Array.isArray(goals) ? goals : [];
        if (goalsArray.length > 0) {
          acc[parseInt(monthIndex)] = goalsArray;
        }
        return acc;
      }, {} as Record<number, MonthlyGoal[]>);
      
      if (Object.keys(nonEmptyGoals).length > 0) {
        syncMonthlyGoalsToCloud(nonEmptyGoals, user.id);
      } else {
        // 如果没有数据，也同步一个空对象（确保云端状态正确）
        syncMonthlyGoalsToCloud({}, user.id);
      }
    }
  }, [monthlyGoalsData, monthlyGoalsLoaded, user, syncMonthlyGoalsToCloud]);

  // **已删除：保存 notes 到 localStorage 的 useEffect**
  /* useEffect(() => {
    if (!isLoaded) return;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      }
    } catch (e) {
      console.error('Failed to save notes to localStorage', e);
    }
  }, [notes, isLoaded]);
  */


  const getCurrentMonthlyGoals = () => monthlyGoalsData[currentMonthIndex] || [];

  const handleAddMonthlyGoal = (text: string) => {
    setMonthlyGoalsData(prev => ({
      ...prev,
      [currentMonthIndex]: [...(prev[currentMonthIndex] || []), { id: Date.now().toString(), text, completed: false }]
    }));
  };
  // (其他 Goal handlers 保持不变，假设 Monthly Goals 的数据同步未来会实现，目前保持在内存中)
  
  const handleToggleMonthlyGoal = (id: string) => {
    setMonthlyGoalsData(prev => ({
      ...prev,
      [currentMonthIndex]:
        prev[currentMonthIndex]?.map(g => (g.id === id ? { ...g, completed: !g.completed } : g)) || []
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
    if (!itemToDefer) return;

    setMonthlyGoalsData(prev => {
      const nextMonth = currentMonthIndex + 1;
      if (nextMonth > 11) return prev;

      return {
        ...prev,
        [currentMonthIndex]: prev[currentMonthIndex].filter(g => g.id !== id),
        [nextMonth]: [...(prev[nextMonth] || []), itemToDefer]
      };
    });
  };
  
  // Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteCard | null>(null);

  const handleNavigateToWeek = (weekNum: number) => {
    setCurrentWeek(weekNum);
    setActiveView('dashboard');
  };

  // **已修改：笔记保存逻辑 - 始终先更新本地状态，然后同步到 Supabase**
// App.tsx

const handleSaveNote = async (note: NoteCard) => {
    console.log('💾 Saving note:', { id: note.id, title: note.title, date: note.date, user: user?.id });
    
    // 1. Optimistic UI: 更新内存中的 notes 状态
    if (editingNote && notes.find(n => n.id === editingNote.id)) {
      setNotes(prev => prev.map(n => (n.id === note.id ? note : n)));
    } else {
      setNotes(prev => [note, ...prev]);
    }

    // 2. Cloud sync
    if (isSupabaseConfigured && user) {
      try {
        const noteData = {
          id: note.id,
          user_id: user.id,
          title: note.title || '',
          content: note.content || '',
          date: note.date,
          type: note.type || 'note'
        };
        
        console.log('📤 Upserting to Supabase:', noteData);
        
        const { data, error } = await supabase
          .from('notes')
          .upsert(noteData, {
            onConflict: 'id'
          })
          .select(); // 返回插入/更新的数据用于验证
        
        if (error) {
          console.error('❌ Supabase upsert note error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          const errorMsg = language === 'en' 
            ? `Failed to save note: ${error.message}`
            : `保存失败: ${error.message}`;
          toast.error(errorMsg);
          throw error;
        }
        
        console.log('✅ Note saved successfully:', data);
        const successMsg = language === 'en' ? 'Note saved successfully' : '笔记保存成功';
        toast.success(successMsg, 3000);
      } catch (e: any) {
        console.error('❌ Supabase upsert note failed:', e);
        console.error('Error object:', e);
        
        const errorMsg = language === 'en'
          ? `Failed to save note: ${e?.message || 'Unknown error'}. Please check console for details.`
          : `保存笔记失败: ${e?.message || '未知错误'}。请查看控制台获取详细信息。`;
        toast.error(errorMsg);
      }
    } else {
      console.warn('⚠️ Supabase not configured or user not logged in');
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured');
      }
      if (!user) {
        console.warn('User is not logged in');
      }
    }

    closeModal();
};

  const openQuickNote = () => {
    setEditingNote(null);
    setIsNoteModalOpen(true);
  };

  const openEditNote = (note: NoteCard) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const closeModal = () => {
    setIsNoteModalOpen(false);
    setEditingNote(null);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard weekNumber={currentWeek} setWeekNumber={setCurrentWeek} user={user} />;
      case 'annual':
        return <AnnualSettings user={user} />;
      case 'monthly':
        return (
          <MonthlyNotebook
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
          />
        );
      case 'reading':
        return <ReadingMovies language={language} user={user} />;
      default:
        return <Dashboard weekNumber={currentWeek} setWeekNumber={setCurrentWeek} />;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setNotes(defaultNotes);
      setMonthlyGoalsData({});
      
      const successMsg = language === 'en' ? 'Logged out successfully' : '已成功退出登录';
      toast.success(successMsg, 2000);
    } catch (e: any) {
      console.error('Logout error:', e);
      const errorMsg = language === 'en' 
        ? `Failed to logout: ${e?.message || 'Unknown error'}`
        : `退出登录失败: ${e?.message || '未知错误'}`;
      toast.error(errorMsg);
    }
  };

  // 未登录时显示登录界面
  if (isSupabaseConfigured && !user) {
    return <AuthScreen />;
  }

  // 主应用 UI 结构 (保持不变)
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenQuickNote={openQuickNote}
        currentWeek={currentWeek}
        language={language}
        setLanguage={setLanguage}
        user={user}
        onLogout={handleLogout}
      />

      <main className="md:ml-64 flex-1 p-0 overflow-y-auto h-screen pb-20 md:pb-0">{renderContent()}</main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around z-20">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`p-2 rounded-lg ${activeView === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
        >
          {/* icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </button>

        <button
          onClick={() => setActiveView('monthly')}
          className={`p-2 rounded-lg ${activeView === 'monthly' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
        >
          {/* icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>

        <button onClick={() => openQuickNote()} className="bg-slate-900 text-white p-3 rounded-full -mt-6 shadow-lg">
          <Plus size={24} />
        </button>

        <button
          onClick={() => setActiveView('reading')}
          className={`p-2 rounded-lg ${activeView === 'reading' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
        >
          {/* icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        </button>

        <button
          onClick={() => setActiveView('annual')}
          className={`p-2 rounded-lg ${activeView === 'annual' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
        >
          {/* icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>

      {isNoteModalOpen && (
        <NoteModal onClose={closeModal} onSave={handleSaveNote} initialData={editingNote} language={language} />
      )}
    </div>
  );
};

// Note Modal (保持不变)
const NoteModal: React.FC<{
  onClose: () => void;
  onSave: (n: NoteCard) => void;
  initialData: NoteCard | null;
  language: Language;
}> = ({ onClose, onSave, initialData, language }) => {
  const [title, setTitle] = useState(initialData?.title || (language === 'en' ? 'Quick Note' : '随手记'));
  const [content, setContent] = useState(initialData?.content || '');
  const [noteDate, setNoteDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    // 确保 ID 的唯一性
    const newId =
      initialData?.id ||
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

    onSave({
      id: newId, 
      title,
      content,
      date: noteDate,
      type: 'note'
    });
  };

  const dateStr = noteDate.replace(/-/g, '.');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        className="bg-[#F6F4EB] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300 relative overflow-hidden"
        style={{
          borderRadius: '2px',
          minHeight: '600px',
          boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
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

          {showDatePicker && (
            <div className="mb-3 pb-3 border-b border-dashed border-slate-300">
              <input
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                className="text-xs px-2 py-1 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <p className="text-[9px] text-slate-400 mt-1 font-light">
                💡 Tip: Change date to test monthly notes (use 2026 dates)
              </p>
            </div>
          )}

          <div className="w-full h-px bg-slate-800"></div>
        </div>

        <div className="px-10 pb-10 flex flex-col h-full font-typewriter">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-slate-900 font-bold text-lg mb-6 outline-none placeholder:text-slate-400"
            placeholder="Title..."
            autoFocus
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full flex-1 bg-transparent text-slate-800 text-sm leading-relaxed resize-none outline-none placeholder:text-slate-400 h-64"
            placeholder={language === 'en' ? 'old memory of new time ....' : '写下你的想法....'}
            spellCheck={false}
          ></textarea>

          <div className="mt-8 pt-6 border-t border-dashed border-slate-300 flex justify-between items-center">
            <button onClick={onClose} className="text-xs text-slate-500 hover:text-red-500 hover:underline transition-colors">
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

        <div className="absolute top-0 right-0 w-8 h-8 bg-black/5 rounded-bl-xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default App;