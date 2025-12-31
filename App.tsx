import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MobileMenu from './components/MobileMenu';
import Dashboard from './components/Dashboard';
import AnnualSettings from './components/AnnualSettings';
import MonthlyNotebook from './components/MonthlyNotebook';
import ReadingMovies from './components/ReadingMovies';
import AuthScreen from './components/AuthScreen';
import PrivacyPolicy from './components/PrivacyPolicy';
import OnboardingTour from './components/OnboardingTour';
import { ToastContainer, useToast } from './components/Toast';
import { View, NoteCard, MonthlyGoal, Achievement, Language } from './types';
import { Plus } from 'lucide-react';
import { getCurrentWeekNumber } from './utils';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useDeviceDetect } from './hooks/useDeviceDetect';

// **已删除：LocalStorage Keys**
// const CURRENT_WEEK_KEY = 'current-week-num-2026'; // 不再使用 localStorage
// const NOTES_KEY = 'monthly-notes-2026'; // 不再使用 localStorage
// const MONTHLY_THEMES_KEY = 'monthly-themes-2026'; // 已改为用户专属 key

const TARGET_YEAR = 2026;

// Default notes data: 仅作为未登录/加载失败时的 fallback
const defaultNotes: NoteCard[] = [];

// **已修改：获取初始周数 - 自动定位到当前实际周数**
const getInitialWeek = (): number => {
  // 获取当前的真实周数（支持2025年和2026年）
  const now = new Date();
  const wk = getCurrentWeekNumber();
  // 体验优化：若仍在公历 2025 年的最后几天，但算入 2026 的第 1 周，则默认展示 2025 的 Week 52
  if (now.getFullYear() === 2025 && wk === 1) return 52;
  return wk;
};

// **获取初始月份索引 - 自动定位到当前月份**
const getInitialMonthIndex = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
  // 如果是2025年12月，返回索引0
  if (year === 2025 && month === 11) {
    return 0;
  }
  
  // 如果是2026年，返回月份+1（因为索引0是2025年12月）
  if (year === 2026) {
    return month + 1; // 0(Jan)→1, 1(Feb)→2, ..., 11(Dec)→12
  }
  
  // 其他情况默认返回1（2026年1月）
  return 1;
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [language, setLanguage] = useState<Language>('en');

  // Device detection
  const device = useDeviceDetect();

  // Toast notifications
  const toast = useToast();

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Navigation State
  const [currentWeek, setCurrentWeek] = useState<number>(getInitialWeek());
  // 月份索引：0=2025年12月, 1=2026年1月, ..., 12=2026年12月
  const [currentMonthIndex, setCurrentMonthIndex] = useState(getInitialMonthIndex());

  // Data State
  const [notes, setNotes] = useState<NoteCard[]>(defaultNotes);
  const [isLoaded, setIsLoaded] = useState(false);
  const [monthlyGoalsLoaded, setMonthlyGoalsLoaded] = useState(false);
  const [motto, setMotto] = useState<string>(''); // 将从 annual_settings 加载，每个用户独立
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check for onboarding status
  useEffect(() => {
    if (user || isGuestMode) {
      const userId = user ? user.id : 'guest';
      const key = `has-seen-onboarding-2026-${userId}`;
      const hasSeen = localStorage.getItem(key);
      if (!hasSeen) {
        // Small delay to ensure UI is ready
        const timer = setTimeout(() => setShowOnboarding(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isGuestMode]);

  const handleCloseOnboarding = () => {
    const userId = user ? user.id : 'guest';
    const key = `has-seen-onboarding-2026-${userId}`;
    localStorage.setItem(key, 'true');
    setShowOnboarding(false);
  };

  // 月度目标数据：key是monthIndex（0=2025年12月, 1=2026年1月, ..., 12=2026年12月）
  const [monthlyGoalsData, setMonthlyGoalsData] = useState<Record<number, MonthlyGoal[]>>({});
  
  // 月度主题数据：key是monthIndex
  // ⚠️ 不从 localStorage 初始化，等待从 Supabase 加载（避免用户间数据串号）
  const [monthlyThemes, setMonthlyThemes] = useState<Record<number, string>>({});

  // My 100 Achievements - 在 App 级别管理，确保跨页面可用
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoaded, setAchievementsLoaded] = useState(false);

  // 加载 achievements（从 Supabase 或 localStorage）
  useEffect(() => {
    const loadAchievements = async () => {
      if (achievementsLoaded) return;
      
      if (isSupabaseConfigured && user) {
        try {
          const { data, error } = await supabase
            .from('annual_settings')
            .select('achievements')
            .eq('user_id', user.id)
            .eq('year', 2026)
            .single();
          
          if (!error && data?.achievements) {
            setAchievements(data.achievements);
          }
        } catch (e) {
          console.error('Failed to load achievements:', e);
        }
      } else if (typeof window !== 'undefined') {
        // Fallback to localStorage
        const saved = localStorage.getItem('annual-achievements-2026');
        if (saved) {
          try {
            setAchievements(JSON.parse(saved));
          } catch (e) {}
        }
      }
      setAchievementsLoaded(true);
    };
    
    if (user || isGuestMode) {
      loadAchievements();
    }
  }, [user, isGuestMode, achievementsLoaded]);

  // Handler: Add to My 100 from Dashboard challenges
  const handleAddToMy100 = useCallback(async (content: string, date: string) => {
    const newAchievement: Achievement = {
      id: Date.now().toString() + Math.random(),
      date,
      content,
      linkedTodoId: null,
    };
    
    const updatedAchievements = [...achievements, newAchievement];
    setAchievements(updatedAchievements);
    
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('annual-achievements-2026', JSON.stringify(updatedAchievements));
    }
    
    // 云端同步由 AnnualSettings 组件统一处理，避免并发写入冲突
    
    toast.success(language === 'en' ? `✨ Added to My 100!` : `✨ 已添加到 My 100！`);
  }, [achievements, user, language, toast]);

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
  const syncMonthlyGoalsToCloud = useCallback(async (goalsData: Record<number, MonthlyGoal[]>, themesData: Record<number, string>, userId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      // 创建所有月份的记录（包括空数组）
      const rows = Object.keys({ ...goalsData, ...themesData }).map(monthIndex => {
        const idx = parseInt(monthIndex);
        const rowYear = idx === 0 ? 2025 : 2026;
        return {
          id: `${userId}-${monthIndex}-2026`,
          user_id: userId,
          month_index: idx,
          year: rowYear,
          goals: Array.isArray(goalsData[idx]) ? goalsData[idx] : [],
          theme: themesData[idx] || null,
        };
      });

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
        // 未配置或未登录，清空数据（不从 localStorage 加载，避免串号）
        setMonthlyGoalsData({});
        setMonthlyGoalsLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('monthly_goals')
          .select('*')
          .eq('user_id', user.id)
          .in('year', [2025, 2026])
          .order('month_index', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // 转换数据库格式到应用格式
          const convertedGoals: Record<number, MonthlyGoal[]> = {};
          const convertedThemes: Record<number, string> = {};
          data.forEach(row => {
            convertedGoals[row.month_index] = Array.isArray(row.goals) ? row.goals : [];
            if (row.theme) {
              convertedThemes[row.month_index] = row.theme;
            }
          });
          setMonthlyGoalsData(convertedGoals);
          setMonthlyThemes(convertedThemes);
        } else {
          // 云端没有数据，尝试从用户专属的 localStorage 加载并同步
          if (typeof window !== 'undefined') {
            try {
              const userSpecificKey = `monthly-goals-2026-${user.id}`;
              const saved = window.localStorage.getItem(userSpecificKey);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                  setMonthlyGoalsData(parsed);
                  // 尝试加载用户专属的themes数据
                  const userSpecificThemesKey = `monthly-themes-2026-${user.id}`;
                  const savedThemes = window.localStorage.getItem(userSpecificThemesKey);
                  const parsedThemes = savedThemes ? JSON.parse(savedThemes) : {};
                  setMonthlyThemes(parsedThemes);
                  // 同步到云端（延迟执行，避免在加载时触发）
                  setTimeout(() => syncMonthlyGoalsToCloud(parsed, parsedThemes, user.id), 100);
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
        // 失败时不再从 localStorage 加载（避免串号）
        setMonthlyGoalsData({});
        setMonthlyThemes({});
      } finally {
        setMonthlyGoalsLoaded(true);
      }
    };

    load();
  }, [user, syncMonthlyGoalsToCloud]);

  // **新增：保存 Monthly Goals 和 Themes 到 localStorage 和 Supabase**
  useEffect(() => {
    if (!monthlyGoalsLoaded) return; // 等待加载完成后再保存

    // 1. 只有登录用户才保存到 localStorage（使用用户专属 key）
    if (user && typeof window !== 'undefined') {
      try {
        const userSpecificGoalsKey = `monthly-goals-2026-${user.id}`;
        const userSpecificThemesKey = `monthly-themes-2026-${user.id}`;
        window.localStorage.setItem(userSpecificGoalsKey, JSON.stringify(monthlyGoalsData));
        window.localStorage.setItem(userSpecificThemesKey, JSON.stringify(monthlyThemes));
      } catch (e) {
        console.error('Failed to save monthly data to localStorage', e);
      }
    }

    // 2. 如果配置了 Supabase 且用户已登录，同步到云端
    if (isSupabaseConfigured && user) {
      // 同步所有月份，包括空数组（确保云端正确删除任务）
      syncMonthlyGoalsToCloud(monthlyGoalsData, monthlyThemes, user.id);
    }
  }, [monthlyGoalsData, monthlyThemes, monthlyGoalsLoaded, user, syncMonthlyGoalsToCloud]);

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
    setMonthlyGoalsData(prev => {
      const currentGoals = prev[currentMonthIndex] || [];
      const updated = currentGoals.map(g => (g.id === id ? { ...g, completed: !g.completed } : g));
      // 完成的goal自动移到底部
      const completed = updated.filter(g => g.completed);
      const uncompleted = updated.filter(g => !g.completed);
      return {
        ...prev,
        [currentMonthIndex]: [...uncompleted, ...completed]
      };
    });
  };

  const handleEditMonthlyGoal = (id: string, newText: string) => {
    setMonthlyGoalsData(prev => ({
      ...prev,
      [currentMonthIndex]: (prev[currentMonthIndex] || []).map(g => g.id === id ? { ...g, text: newText } : g)
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
      // 索引范围：0(2025年12月) -> 12(2026年12月)，所以最多延迟到12
      if (nextMonth > 12) return prev;

      return {
        ...prev,
        // 从当前月删除
        [currentMonthIndex]: (prev[currentMonthIndex] || []).filter(g => g.id !== id),
        // 添加到下个月
        [nextMonth]: [...(prev[nextMonth] || []), itemToDefer]
      };
    });
  };
  
  // 月度主题处理
  const handleUpdateMonthlyTheme = (theme: string) => {
    setMonthlyThemes(prev => {
      const updated = {
        ...prev,
        [currentMonthIndex]: theme
      };
      return updated;
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

  const handleDeleteNote = async (id: string) => {
    // 从本地状态删除
    setNotes(prev => prev.filter(n => n.id !== id));

    // 从 Supabase 删除
    if (isSupabaseConfigured && user) {
      try {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting note from Supabase:', error);
        }
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard weekNumber={currentWeek} setWeekNumber={setCurrentWeek} user={user} language={language} onAddToMy100={handleAddToMy100} />;
      case 'annual':
        return <AnnualSettings user={user} language={language} motto={motto} onMottoChange={setMotto} achievements={achievements} onAchievementsChange={setAchievements} />;
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
            onEditGoal={handleEditMonthlyGoal}
            onDeleteGoal={handleDeleteMonthlyGoal}
            onDeferGoal={handleDeferMonthlyGoal}
            monthlyTheme={monthlyThemes[currentMonthIndex] || ''}
            onUpdateTheme={handleUpdateMonthlyTheme}
            language={language}
          />
        );
      case 'reading':
        return <ReadingMovies language={language} user={user} />;
      case 'privacy':
        return <PrivacyPolicy language={language} onBack={() => setActiveView('dashboard')} />;
      default:
        return <Dashboard weekNumber={currentWeek} setWeekNumber={setCurrentWeek} language={language} onAddToMy100={handleAddToMy100} />;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      if (isGuestMode) {
        setIsGuestMode(false);
      } else {
        const { error } = await supabase.auth.signOut();
        // Ignore "Auth session missing!" error as it means we are already logged out
        if (error && !error.message?.includes('Auth session missing')) {
          throw error;
        }
      }
      
      // Clear local state
      setUser(null);
      setNotes(defaultNotes);
      setMonthlyGoalsData({});
      setMonthlyThemes({});
      
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

  // 导出数据功能
  const handleExportData = () => {
    try {
      // 收集所有数据
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        user: user ? { email: user.email, id: user.id } : null,
        data: {
          notes: notes,
          monthlyGoals: monthlyGoalsData,
          // 从localStorage读取其他数据
          dashboardData: localStorage.getItem('annual-weekly-dashboards-2026'),
          annualDimensions: localStorage.getItem('annual-dimensions-2026'),
          annualTodos: localStorage.getItem('annual-todos-2026'),
          readingMovies: localStorage.getItem('reading-movies-items-2026'),
        }
      };

      // 创建并下载JSON文件
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `life-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const successMsg = language === 'en' ? 'Data exported successfully!' : '数据导出成功！';
      toast.success(successMsg, 2000);
    } catch (e: any) {
      console.error('Export error:', e);
      const errorMsg = language === 'en' 
        ? `Failed to export data: ${e?.message || 'Unknown error'}`
        : `导出数据失败: ${e?.message || '未知错误'}`;
      toast.error(errorMsg);
    }
  };

  // Google Form URL for feedback
  const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeZOkEocPS7UeURmQYWAhyhKyq3tYRw0ReHYLjNpC260_EI1w/viewform?usp=dialog';

  // 未登录且非访客模式时显示登录界面
  if (isSupabaseConfigured && !user && !isGuestMode) {
    return <AuthScreen onEnterGuestMode={() => setIsGuestMode(true)} />;
  }

  // 主应用 UI 结构 (保持不变)
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      {/* 桌面端侧边栏 - 只在桌面端显示 */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenQuickNote={openQuickNote}
        currentWeek={currentWeek}
        language={language}
        setLanguage={setLanguage}
        user={user}
        onLogout={handleLogout}
        onExportData={handleExportData}
        feedbackFormUrl={FEEDBACK_FORM_URL}
        motto={motto}
        onMottoChange={setMotto}
      />

      {/* 移动端菜单 - 只在移动端和平板显示 */}
      {(device.isMobile || device.isTablet) && (
        <MobileMenu
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenQuickNote={openQuickNote}
          currentWeek={currentWeek}
          language={language}
          setLanguage={setLanguage}
          user={user}
          onLogout={handleLogout}
          onExportData={handleExportData}
          feedbackFormUrl={FEEDBACK_FORM_URL}
          motto={motto}
        />
      )}

      {/* 主内容区 - 添加顶部和底部padding给移动端导航栏留空间 */}
      <main className={`md:ml-64 flex-1 p-0 overflow-y-auto h-screen ${device.isMobile || device.isTablet ? 'pt-16 pb-20' : 'pb-0'}`}>
        {renderContent()}
      </main>


      {isNoteModalOpen && (
        <NoteModal 
          onClose={closeModal} 
          onSave={handleSaveNote} 
          onDelete={handleDeleteNote}
          initialData={editingNote} 
          language={language} 
        />
      )}

      <OnboardingTour 
        isOpen={showOnboarding} 
        onClose={handleCloseOnboarding} 
        language={language}
      />
    </div>
  );
};

// Note Modal (保持不变)
const NoteModal: React.FC<{
  onClose: () => void;
  onSave: (n: NoteCard) => void;
  onDelete?: (id: string) => void;
  initialData: NoteCard | null;
  language: Language;
}> = ({ onClose, onSave, onDelete, initialData, language }) => {
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
              <p className="text-xs text-slate-400 mt-1 font-light">
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
            <div className="flex gap-4">
              <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-900 hover:underline transition-colors">
                [ {language === 'en' ? 'cancel' : '取消'} ]
              </button>
              {initialData && onDelete && (
                <button 
                  onClick={() => {
                    if (confirm(language === 'en' ? 'Delete this note?' : '确认删除这条笔记？')) {
                      onDelete(initialData.id);
                      onClose();
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-red-500 hover:underline transition-colors"
                >
                  [ {language === 'en' ? 'delete' : '删除'} ]
                </button>
              )}
            </div>

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