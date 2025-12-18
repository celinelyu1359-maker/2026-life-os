import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, CheckSquare, Square, CalendarClock, RotateCcw, Edit2, Save, TrendingUp, TrendingDown, Minus, Copy, Target, Lightbulb, X } from 'lucide-react';
import { ScoreboardItem, ChallengeItem, Language } from '../types';
import { getWeekRange, getCurrentWeekNumber } from '../utils';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import Modal from './Modal';

// =======================================================
// ✅ 1. LocalStorage Keys & Internal Data Structure
// =======================================================
const ALL_WEEKS_DATA_KEY = 'annual-weekly-dashboards-2026';
const CURRENT_WEEK_KEY = 'current-week-num-2026'; // 用于保存最后一次浏览的周数

// 内部存储结构：包含一个周的所有自治数据
export interface WeeklyData {
    weekNum: number;
    scoreboard: ScoreboardItem[];
    challenges: ChallengeItem[];
    happyHours: ChallengeItem[];
}

// 默认的 Scoreboard 初始化数据
const defaultScoreboardItems: ScoreboardItem[] = [];

// ------------------------------------------------------------------------
// ✅ 创建初始周数据（空白状态）
// ------------------------------------------------------------------------
const createInitialWeek1Data = (): WeeklyData => {
    return {
        weekNum: 1,
        scoreboard: [],
        challenges: [],
        happyHours: [],
    };
};

// ------------------------------------------------------------------------
// ✅ FIX 2: 用于创建新周数据 (W2+ 或 W1 重置)
// ------------------------------------------------------------------------
const createDefaultWeekData = (weekNum: number, previousWeekData?: WeeklyData): WeeklyData => {
    let initialScoreboard = defaultScoreboardItems.map(item => ({ ...item }));

    // 数据继承 (Carry-over)
    if (previousWeekData && Array.isArray(previousWeekData.scoreboard)) {
        initialScoreboard = initialScoreboard.map(defaultItem => {
            const prevItem = previousWeekData.scoreboard.find(p => p.id === defaultItem.id); 
            if (prevItem) {
                // 新的一周 progress 归零 (current: defaultItem.current), lastWeek 继承上一周的 current
                return { 
                    ...defaultItem, 
                    current: 0, 
                    lastWeek: prevItem.current 
                };
            }
            return defaultItem;
        });
    }

    return {
        weekNum: weekNum,
        scoreboard: initialScoreboard,
        challenges: [], 
        happyHours: [],
    };
};

// ------------------------------------------------------------------------
// ✅ FIX 3: 初始状态使用具有示例数据的 Week 1
// ------------------------------------------------------------------------
const defaultAllWeeksData: WeeklyData[] = [
    createInitialWeek1Data() 
];


// =======================================================
// ✅ 2. Props
// =======================================================
interface DashboardProps {
    weekNumber: number;
    setWeekNumber: (n: number) => void;
    user?: any; // Supabase user object
    language?: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    weekNumber, 
    setWeekNumber,
    user,
    language = 'en',
}) => {
    // =======================================================
    // ✅ 3. 内部状态定义
    // =======================================================
    // 动态年份：week 52是2025年，week 1-51是2026年
    const year = weekNumber === 52 ? 2025 : 2026;
    const [dateRange, setDateRange] = useState('');
    const [isEditingScoreboard, setIsEditingScoreboard] = useState(false);
    const [showScoreboardQuickAdd, setShowScoreboardQuickAdd] = useState(true);
    
    // 核心状态：存储所有周的数据
    const [allWeeksData, setAllWeeksData] = useState<WeeklyData[]>(defaultAllWeeksData);
    const [isLoaded, setIsLoaded] = useState(false); // 安全锁

    const [newChallenge, setNewChallenge] = useState('');
    const [newHappyHour, setNewHappyHour] = useState('');
    const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
    const [editingChallengeText, setEditingChallengeText] = useState('');
    const [editingHappyHourId, setEditingHappyHourId] = useState<string | null>(null);
    const [editingHappyHourText, setEditingHappyHourText] = useState('');
    const [deferredTaskText, setDeferredTaskText] = useState<string | null>(null);

    // Modal 状态
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'info' | 'warning' | 'success' | 'confirm';
        title?: string;
        message: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'info',
        message: '',
    });

    // 辅助函数：同步所有周数据到云端
    const syncAllWeeksToCloud = useCallback(async (weeksData: WeeklyData[], userId: string) => {
        if (!isSupabaseConfigured) return;

        try {
            const rows = weeksData.map(week => ({
                id: `${userId}-${week.weekNum}-2026`,
                user_id: userId,
                week_num: week.weekNum,
                year: 2026,
                scoreboard: week.scoreboard,
                challenges: week.challenges,
                happy_hours: week.happyHours,
            }));

            const { error } = await supabase.from('dashboard_data').upsert(rows, {
                onConflict: 'id',
            });

            if (error) throw error;
        } catch (e) {
            console.error('Failed to sync dashboard data to cloud', e);
        }
    }, []);

    // =======================================================
    // ✅ 4. 数据加载：优先从 Supabase，fallback 到 localStorage
    // =======================================================
    useEffect(() => {
        const load = async () => {
            // 如果配置了 Supabase 且用户已登录，从云端加载
            if (isSupabaseConfigured && user) {
                try {
                    const { data, error } = await supabase
                        .from('dashboard_data')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('year', 2026)
                        .order('week_num', { ascending: true });

                    if (error) throw error;

                    if (data && data.length > 0) {
                        // 转换数据库格式到应用格式
                        const converted: WeeklyData[] = data.map(row => ({
                            weekNum: row.week_num,
                            scoreboard: row.scoreboard || [],
                            challenges: row.challenges || [],
                            happyHours: row.happy_hours || [],
                        }));
                        setAllWeeksData(converted);
                    } else {
                        // 云端没有数据，尝试从 localStorage 加载
                        if (typeof window !== 'undefined') {
                            try {
                                const savedData = window.localStorage.getItem(ALL_WEEKS_DATA_KEY);
                                if (savedData) {
                                    const parsed = JSON.parse(savedData);
                                    if (Array.isArray(parsed)) {
                                        setAllWeeksData(parsed);
                                        // 将 localStorage 数据同步到云端
                                        syncAllWeeksToCloud(parsed, user.id);
                                    }
                                }
                            } catch (e) {
                                console.error('Failed to load from localStorage', e);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Failed to load dashboard data from Supabase', e);
                    // 失败时 fallback 到 localStorage
                    if (typeof window !== 'undefined') {
                        try {
                            const savedData = window.localStorage.getItem(ALL_WEEKS_DATA_KEY);
                            if (savedData) {
                                const parsed = JSON.parse(savedData);
                                if (Array.isArray(parsed)) {
                                    setAllWeeksData(parsed);
                                }
                            }
                        } catch (err) {
                            console.error('Failed to load from localStorage', err);
                        }
                    }
                } finally {
                    setIsLoaded(true);
                }
            } else {
                // 未配置 Supabase 或未登录，只从 localStorage 加载
                if (typeof window !== 'undefined') {
                    try {
                        const savedData = window.localStorage.getItem(ALL_WEEKS_DATA_KEY);
                        if (savedData) {
                            const parsed = JSON.parse(savedData);
                            if (Array.isArray(parsed)) {
                                setAllWeeksData(parsed);
                            }
                        }
                    } catch (e) {
                        console.error('Failed to load dashboard data from localStorage', e);
                    } finally {
                        setIsLoaded(true);
                    }
                }
            }
        };

        load();
    }, [user, syncAllWeeksToCloud]);

    // =======================================================
    // ✅ 5. 数据保存：同时保存到 localStorage 和 Supabase
    // =======================================================
    useEffect(() => {
        if (!isLoaded) return;

        // 1. 始终保存到 localStorage（作为 fallback）
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(ALL_WEEKS_DATA_KEY, JSON.stringify(allWeeksData));
                window.localStorage.setItem(CURRENT_WEEK_KEY, String(weekNumber));
            }
        } catch (e) {
            console.error('Failed to save data to localStorage', e);
        }

        // 2. 如果配置了 Supabase 且用户已登录，同步到云端
        if (isSupabaseConfigured && user) {
            syncAllWeeksToCloud(allWeeksData, user.id);
        }
    }, [allWeeksData, isLoaded, weekNumber, user, syncAllWeeksToCloud]); 

    
    // =======================================================
    // ✅ 6. 核心逻辑：获取当前周的数据 (READ ONLY)
    // =======================================================
    const currentWeekData = useMemo(() => {
        const data = allWeeksData.find(d => d.weekNum === weekNumber);
        
        // 如果数据未找到，返回一个临时的安全默认结构
        if (!data) {
             return { 
                weekNum: weekNumber,
                // 注意: 如果找不到，这里应该使用通用的默认数据（current: 0），而不是示例数据
                scoreboard: defaultScoreboardItems.map(item => ({...item, lastWeek: 0})), 
                challenges: [], 
                happyHours: [],
             };
        }

        return data;
    }, [allWeeksData, weekNumber]); 
    
    // ✅ 7. 实时创建缺失的周数据 (WRITE)
    useEffect(() => {
        // 只有当数据已加载且当前周数据在 allWeeksData 中确实不存在时才创建
        const isNewWeek = !allWeeksData.find(d => d.weekNum === weekNumber) && isLoaded;
        
        if (isNewWeek) {
            const previousWeekData = allWeeksData.find(d => d.weekNum === weekNumber - 1);
            // 确保使用通用的创建函数，因为它会正确处理数据继承和将 current 重置为 0
            const newData = createDefaultWeekData(weekNumber, previousWeekData); 

            // 通过 setAllWeeksData 更新状态，这将触发 useEffect 5 进行持久化存储
            setAllWeeksData(prev => [...prev.filter(d => d.weekNum !== weekNumber), newData!].sort((a, b) => a.weekNum - b.weekNum));
        }
    }, [allWeeksData, weekNumber, isLoaded]);


    // 安全地解构当前周数据
    const scoreboard = currentWeekData.scoreboard || [];
    const challenges = currentWeekData.challenges || [];
    const happyHours = currentWeekData.happyHours || [];


    // =======================================================
    // ✅ 8. Handlers
    // =======================================================
    
    // Update date range when week changes
    useEffect(() => {
        setDateRange(getWeekRange(year, weekNumber));
    }, [weekNumber, year]);

    // Helper to calculate points number (unchanged)
    const getPoints = (current: number, max: number) => {
        if (max === 0) return 0;
        const pct = current / max;
        if (pct >= 1) return 3;
        if (pct >= 0.7) return 2;
        if (pct >= 0.4) return 1;
        return 0;
    };

    const calculateScoreLabel = (item: ScoreboardItem) => {
        const pts = getPoints(item.current, item.max);
        return `${pts} ${pts === 1 ? 'pt' : 'pts'}`;
    };

    // --- 封装更新当前周数据的函数 (保证周数据隔离的核心) ---
    const updateCurrentWeekData = useCallback((updater: (data: WeeklyData) => WeeklyData) => {
        setAllWeeksData(prev => prev.map(d => 
            // 只有 weekNum 匹配的数据会被修改
            d.weekNum === weekNumber ? updater(d) : d 
        ));
    }, [weekNumber]);

    // --- Scoreboard Handlers ---
    
    const handleProgressChange = (id: string, val: string) => {
        updateCurrentWeekData(data => ({
            ...data,
            scoreboard: data.scoreboard.map(item => 
              item.id === id ? { ...item, current: Number(val) } : item
            )
        }));
    };

    const handleScoreboardEdit = (id: string, field: keyof ScoreboardItem, val: string | number) => {
        updateCurrentWeekData(data => ({
            ...data,
            scoreboard: data.scoreboard.map(item => 
              item.id === id ? { ...item, [field]: val } : item
            )
        }));
    };

    const handleResetScoreboard = () => {
        // Reset all progress to the minimum (0)
        updateCurrentWeekData(data => ({
            ...data,
            scoreboard: data.scoreboard.map(item => ({...item, current: 0}))
        }));
    };

    const handleCopyFromLastWeek = () => {
        const lastWeekNum = weekNumber - 1;
        if (lastWeekNum < 1) {
            setModalState({
                isOpen: true,
                type: 'warning',
                message: language === 'en' ? 'No previous week available' : '没有上一周的数据',
            });
            return;
        }

        const lastWeekData = allWeeksData.find(d => d.weekNum === lastWeekNum);
        if (!lastWeekData || !lastWeekData.scoreboard || lastWeekData.scoreboard.length === 0) {
            setModalState({
                isOpen: true,
                type: 'warning',
                message: language === 'en' ? 'No goals found in last week' : '上周没有找到目标设置',
            });
            return;
        }

        // 复制上周的scoreboard设置（Goal、Normal、Silver、Golden、Max、Unit），但重置进度
        const copiedScoreboard = lastWeekData.scoreboard.map(item => ({
            ...item,
            id: Date.now().toString() + Math.random().toString(), // 生成新ID
            current: 0, // 重置当前进度
            lastWeek: 0, // 重置上周数据
        }));

        updateCurrentWeekData(data => ({
            ...data,
            scoreboard: copiedScoreboard
        }));
    };

    const handleAddScoreboardItem = () => {
        const newItem: ScoreboardItem = {
            id: Date.now().toString(),
            goal: 'New Goal',
            normal: '1',
            silver: '2',
            golden: '3',
            current: 0,
            max: 5,
            unit: '',
            lastWeek: 0
        };
        updateCurrentWeekData(data => ({
            ...data,
            scoreboard: [...data.scoreboard, newItem]
        }));
    };

    const handleDeleteScoreboardItem = (id: string) => {
        setModalState({
            isOpen: true,
            type: 'confirm',
            title: language === 'en' ? 'Delete Goal' : '删除目标',
            message: language === 'en' ? 'Are you sure you want to delete this goal?' : '确定要删除这个目标吗？',
            onConfirm: () => {
                updateCurrentWeekData(data => ({
                    ...data,
                    scoreboard: data.scoreboard.filter(item => item.id !== id)
                }));
            }
        });
    };

    // --- Challenge Handlers ---
    
    const handleAddChallenge = () => {
        if(!newChallenge.trim()) return;
        const newC: ChallengeItem = { id: Date.now().toString(), text: newChallenge, completed: false };
        updateCurrentWeekData(data => ({
            ...data,
            challenges: [...data.challenges, newC]
        }));
        setNewChallenge('');
    }
    
    const onToggleChallenge = (id: string) => {
        updateCurrentWeekData(data => ({
            ...data,
            challenges: data.challenges.map(c => 
                c.id === id ? { ...c, completed: !c.completed } : c
            )
        }));
    };
    
    const onDeleteChallenge = (id: string) => {
        updateCurrentWeekData(data => ({
            ...data,
            challenges: data.challenges.filter(c => c.id !== id)
        }));
    };
    
    const onEditChallenge = (id: string, text: string) => {
        setEditingChallengeId(id);
        setEditingChallengeText(text);
    };
    
    const onSaveChallenge = () => {
        if (!editingChallengeId || !editingChallengeText.trim()) return;
        updateCurrentWeekData(data => ({
            ...data,
            challenges: data.challenges.map(c => 
                c.id === editingChallengeId ? { ...c, text: editingChallengeText } : c
            )
        }));
        setEditingChallengeId(null);
        setEditingChallengeText('');
    };
    
    const onDeferChallenge = (id: string) => {
        const challengeToDefer = challenges.find(c => c.id === id);
        if (!challengeToDefer) return;

        const nextWeekNum = weekNumber + 1;
        
        // 显示rollover提示
        setDeferredTaskText(challengeToDefer.text);
        setTimeout(() => setDeferredTaskText(null), 3000);

        // 一次性更新：从当前周删除，添加到下一周
        setAllWeeksData(prev => {
            // 找到当前周和下一周的数据
            const currentWeekData = prev.find(d => d.weekNum === weekNumber);
            let nextWeekData = prev.find(d => d.weekNum === nextWeekNum);
            
            if (!currentWeekData) return prev;

            // 从当前周删除该 challenge
            const updatedCurrentWeekData = {
                ...currentWeekData,
                challenges: currentWeekData.challenges.filter(c => c.id !== id)
            };

            // 如果下一周数据不存在，先创建它
            if (!nextWeekData) {
                nextWeekData = createDefaultWeekData(nextWeekNum, currentWeekData);
            }

            // 添加延期的 Challenge 到下一周（重置为未完成状态）
            const updatedNextWeekData = {
                ...nextWeekData,
                challenges: [...nextWeekData.challenges, { ...challengeToDefer, id: Date.now().toString(), completed: false }]
            };

            // 更新数据数组
            const result = prev.map(d => {
                if (d.weekNum === weekNumber) return updatedCurrentWeekData;
                if (d.weekNum === nextWeekNum) return updatedNextWeekData;
                return d;
            });

            // 如果下一周原本不存在，需要添加进去
            if (!prev.find(d => d.weekNum === nextWeekNum)) {
                result.push(updatedNextWeekData);
            }

            return result.sort((a, b) => a.weekNum - b.weekNum);
        });
    };

    // --- Happy Hour Handlers ---
    
    const addHappyHour = () => {
        if(!newHappyHour.trim()) return;
        const newHH: ChallengeItem = { id: Date.now().toString(), text: newHappyHour, completed: false};
        updateCurrentWeekData(data => ({
            ...data,
            happyHours: [...data.happyHours, newHH]
        }));
        setNewHappyHour('');
    }
    
    const deleteHappyHour = (id: string) => {
        updateCurrentWeekData(data => ({
            ...data,
            happyHours: data.happyHours.filter(c => c.id !== id)
        }));
    };
    
    const onEditHappyHour = (id: string, text: string) => {
        setEditingHappyHourId(id);
        setEditingHappyHourText(text);
    };
    
    const onSaveHappyHour = () => {
        if (!editingHappyHourId || !editingHappyHourText.trim()) return;
        updateCurrentWeekData(data => ({
            ...data,
            happyHours: data.happyHours.map(c => 
                c.id === editingHappyHourId ? { ...c, text: editingHappyHourText } : c
            )
        }));
        setEditingHappyHourId(null);
        setEditingHappyHourText('');
    };

    // 分数计算 (现在保证 scoreboard 是一个数组)
    const currentTotalScore = scoreboard.reduce((acc, item) => acc + getPoints(item.current, item.max), 0);
    const lastWeekTotalScore = scoreboard.reduce((acc, item) => acc + getPoints(item.lastWeek, item.max), 0);
    const scoreDiff = currentTotalScore - lastWeekTotalScore;


    if (!isLoaded) {
        return <div className="p-4 text-center text-slate-500">{language === 'en' ? 'Loading...' : '加载中...'}</div>;
    }


    // =======================================================
    // ✅ 9. JSX 结构
    // =======================================================
    return (
        <>
        <div className="p-2 md:p-4 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col animate-fade-in">
            
            {/* Main Paper Container */}
            <div className="bg-[#FDFCF6] flex-1 rounded-3xl shadow-sm p-4 md:p-6 overflow-y-auto relative mx-1 md:mx-0">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4 border-b border-slate-200 pb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold tracking-widest uppercase">
                                {language === 'en' ? 'Weekly Review' : '每周回顾'}
                            </span>
                            <div className="h-px w-8 bg-slate-900/20"></div>
                        </div>
                        <div className="flex items-baseline justify-between w-full">
                            <div className="flex items-baseline gap-3">
                                <h2 className="font-serif text-2xl md:text-3xl text-slate-900 tracking-tight min-w-[120px]">Week {weekNumber}</h2>
                                <div className="flex items-center gap-1.5">
                                    <div className="flex bg-white border border-slate-200 rounded-md p-0.5 shadow-sm">
                                        {/* 支持2025年week52-53和2026年week1-52的切换 */}
                                        <button 
                                            onClick={() => {
                                                if (weekNumber === 1) {
                                                    setWeekNumber(53); // 从2026 week1往前到2025 week53
                                                } else {
                                                    setWeekNumber(weekNumber - 1);
                                                }
                                            }} 
                                            className="p-0.5 hover:bg-slate-50 rounded text-slate-500"
                                        >
                                            <ChevronLeft size={12}/>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (weekNumber === 53) {
                                                    setWeekNumber(1); // 从2025 week53往后到2026 week1
                                                } else if (weekNumber === 52) {
                                                    setWeekNumber(53); // 2025 week52 -> week53
                                                } else {
                                                    setWeekNumber(Math.min(52, weekNumber + 1)); // 2026年最多到52周
                                                }
                                            }} 
                                            className="p-0.5 hover:bg-slate-50 rounded text-slate-500"
                                        >
                                            <ChevronRight size={12}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setWeekNumber(getCurrentWeekNumber())}
                                    disabled={weekNumber === getCurrentWeekNumber()}
                                    className={`p-1 rounded-md transition-colors ${
                                        weekNumber === getCurrentWeekNumber() 
                                            ? 'text-slate-300 cursor-default' 
                                            : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                                    }`}
                                    title={language === 'en' ? 'Go to current week' : '回到当前周'}
                                >
                                    <Target size={12}/>
                                </button>
                                <span className={`text-[9px] font-light whitespace-nowrap ${
                                    weekNumber === getCurrentWeekNumber() 
                                        ? 'text-slate-300 italic' 
                                        : 'text-slate-400'
                                }`}>
                                    {weekNumber === getCurrentWeekNumber() 
                                        ? (language === 'en' ? 'Current week' : '本周')
                                        : (language === 'en' ? 'Back to current' : '回到本周')
                                    }
                                </span>
                            </div>
                        </div>
                        <p className="text-slate-500 font-mono text-[10px] mt-0.5">{dateRange} · {year}</p>
                    </div>
                </div>

                {/* Scoreboard */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-serif text-lg text-slate-900">{language === 'en' ? 'Scoreboard' : '计分板'}</h3>
                            {/* Trend Summary */}
                            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Total:' : '总分:'}</span>
                                <span className="font-serif font-bold text-slate-900">{currentTotalScore}</span>
                                <div className={`flex items-center text-[10px] font-medium ${scoreDiff >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {scoreDiff > 0 ? <TrendingUp size={12} className="mr-0.5"/> : scoreDiff < 0 ? <TrendingDown size={12} className="mr-0.5"/> : <Minus size={12} className="mr-0.5"/>}
                                    {Math.abs(scoreDiff)} {language === 'en' ? 'vs last week' : '相比上周'}
                                </div>
                            </div>
                            {isEditingScoreboard && (
                                <button
                                    onClick={() => setShowScoreboardQuickAdd(!showScoreboardQuickAdd)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                        showScoreboardQuickAdd 
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                    }`}
                                    title={language === 'en' ? 'Toggle quick add' : '切换快速添加'}
                                >
                                    <Lightbulb size={14} />
                                    <span>{language === 'en' ? 'Ideas' : '灵感'}</span>
                                </button>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={handleCopyFromLastWeek}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title={language === 'en' ? 'Copy from last week' : '从上周复制设置'}
                            >
                                <Copy size={14} />
                            </button>
                            <button 
                                onClick={handleResetScoreboard}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                title={language === 'en' ? 'Reset progress' : '重置进度'}
                            >
                                <RotateCcw size={14} />
                            </button>
                            <button 
                                onClick={() => setIsEditingScoreboard(!isEditingScoreboard)}
                                className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 ${isEditingScoreboard ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                                title={isEditingScoreboard ? (language === 'en' ? 'Save changes' : '保存修改') : (language === 'en' ? 'Edit goals' : '编辑目标')}
                            >
                                {isEditingScoreboard ? <Save size={14} /> : <Edit2 size={14} />}
                                {isEditingScoreboard && <span className="text-[10px] font-bold uppercase tracking-wider pr-1">{language === 'en' ? 'Save' : '保存'}</span>}
                            </button>
                        </div>
                    </div>

                    {/* Quick Add Suggestions - Only show in edit mode */}
                    {isEditingScoreboard && showScoreboardQuickAdd && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 relative">
                            <button
                                onClick={() => setShowScoreboardQuickAdd(false)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-slate-900 transition-colors"
                                title={language === 'en' ? 'Close' : '关闭'}
                            >
                                <X size={14} />
                            </button>
                            <p className="text-xs text-slate-600 mb-3 font-medium">
                                {language === 'en' ? '💡 Quick add goals:' : '💡 快速添加目标：'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(language === 'en' ? [
                                    { goal: 'Study hours', normal: '2h', silver: '4h', golden: '6h', max: 10, unit: 'h' },
                                    { goal: 'Exercise', normal: '2 times', silver: '3 times', golden: '4 times', max: 7, unit: '' },
                                    { goal: 'Reading', normal: '30min', silver: '1h', golden: '2h', max: 5, unit: 'h' },
                                    { goal: 'Water intake', normal: '6 cups', silver: '8 cups', golden: '10 cups', max: 15, unit: '' },
                                    { goal: 'Sleep quality', normal: '6h', silver: '7h', golden: '8h', max: 12, unit: 'h' },
                                    { goal: 'Social time', normal: '1 meetup', silver: '2 meetups', golden: '3 meetups', max: 5, unit: '' },
                                ] : [
                                    { goal: '学习时长', normal: '2小时', silver: '4小时', golden: '6小时', max: 10, unit: '小时' },
                                    { goal: '运动次数', normal: '2次', silver: '3次', golden: '4次', max: 7, unit: '次' },
                                    { goal: '阅读时长', normal: '30分钟', silver: '1小时', golden: '2小时', max: 5, unit: '小时' },
                                    { goal: '喝水量', normal: '6杯', silver: '8杯', golden: '10杯', max: 15, unit: '杯' },
                                    { goal: '睡眠时长', normal: '6小时', silver: '7小时', golden: '8小时', max: 12, unit: '小时' },
                                    { goal: '社交活动', normal: '1次', silver: '2次', golden: '3次', max: 5, unit: '次' },
                                ]).map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            const newItem: ScoreboardItem = {
                                                id: Date.now().toString() + Math.random(),
                                                goal: suggestion.goal,
                                                normal: suggestion.normal,
                                                silver: suggestion.silver,
                                                golden: suggestion.golden,
                                                max: suggestion.max,
                                                unit: suggestion.unit,
                                                current: 0,
                                                lastWeek: 0,
                                            };
                                            updateCurrentWeekData(data => ({
                                                ...data,
                                                scoreboard: [...data.scoreboard, newItem]
                                            }));
                                        }}
                                        className="text-left px-3 py-2 bg-white border border-slate-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white rounded-lg text-xs transition-all group"
                                    >
                                        <div className="font-medium">{suggestion.goal}</div>
                                        <div className="text-[9px] opacity-60 group-hover:opacity-90 mt-0.5">
                                            {suggestion.normal} → {suggestion.silver} → {suggestion.golden}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        {scoreboard.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <p className="text-sm text-slate-400 font-light mb-2">
                                    {language === 'en' ? 'No goals set yet' : '还没有设置目标'}
                                </p>
                                <p className="text-[10px] text-slate-300">
                                    {language === 'en' ? 'Click edit button to add your weekly goals' : '点击编辑按钮开始添加你的weekly goals'}
                                </p>
                            </div>
                        ) : (
                        <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-left min-w-[600px]">
                            <thead>
                            <tr className="text-slate-400 font-mono text-[9px] uppercase tracking-wider border-b border-slate-100">
                                <th className="py-2 px-3 font-normal">{language === 'en' ? 'Goal' : '目标'}</th>
                                <th className="py-2 px-3 font-normal">{language === 'en' ? 'Normal (1pt)' : '及格 (1分)'}</th>
                                <th className="py-2 px-3 font-normal">{language === 'en' ? 'Silver (2pts)' : '良好 (2分)'}</th>
                                <th className="py-2 px-3 font-normal">{language === 'en' ? 'Golden (3pts)' : '优秀 (3分)'}</th>
                                <th className="py-2 px-3 font-normal">
                                    {isEditingScoreboard ? (language === 'en' ? 'Max / Unit' : '上限/单位') : (language === 'en' ? 'Progress' : '进度')}
                                </th>
                                <th className="py-2 px-3 font-normal text-center w-16">
                                    {isEditingScoreboard ? (language === 'en' ? 'Action' : '操作') : (language === 'en' ? 'Score' : '分数')}
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                            {scoreboard.map((item) => (
                                <tr key={item.id} className={`transition-colors ${isEditingScoreboard ? 'bg-slate-50/30' : 'hover:bg-slate-50/50'}`}>
                                
                                {/* GOAL */}
                                <td className="py-2 px-3 font-medium text-slate-800 text-xs">
                                    {isEditingScoreboard ? (
                                        <input 
                                            type="text" 
                                            value={item.goal} 
                                            onChange={(e) => handleScoreboardEdit(item.id, 'goal', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-slate-400 outline-none"
                                        />
                                    ) : item.goal}
                                </td>
                                
                                {/* NORMAL */}
                                <td className="py-2 px-3 text-slate-500 font-light text-[10px]">
                                    {isEditingScoreboard ? (
                                        <input 
                                            type="text" 
                                            value={item.normal} 
                                            onChange={(e) => handleScoreboardEdit(item.id, 'normal', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] focus:ring-1 focus:ring-slate-400 outline-none"
                                        />
                                    ) : item.normal}
                                </td>

                                {/* SILVER */}
                                <td className="py-2 px-3 text-slate-500 font-light text-[10px]">
                                    {isEditingScoreboard ? (
                                        <input 
                                            type="text" 
                                            value={item.silver} 
                                            onChange={(e) => handleScoreboardEdit(item.id, 'silver', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] focus:ring-1 focus:ring-slate-400 outline-none"
                                        />
                                    ) : item.silver}
                                </td>

                                {/* GOLDEN */}
                                <td className="py-2 px-3 text-slate-500 font-light text-[10px]">
                                    {isEditingScoreboard ? (
                                        <input 
                                            type="text" 
                                            value={item.golden} 
                                            onChange={(e) => handleScoreboardEdit(item.id, 'golden', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] focus:ring-1 focus:ring-slate-400 outline-none"
                                        />
                                    ) : item.golden}
                                </td>

                                {/* PROGRESS OR CONFIG */}
                                <td className="py-2 px-3">
                                    {isEditingScoreboard ? (
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" 
                                                value={item.max} 
                                                onChange={(e) => handleScoreboardEdit(item.id, 'max', Number(e.target.value))}
                                                className="w-12 bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] focus:ring-1 focus:ring-slate-400 outline-none"
                                                placeholder={language === 'en' ? 'Max' : '上限'}
                                            />
                                            <input 
                                                type="text" 
                                                value={item.unit} 
                                                onChange={(e) => handleScoreboardEdit(item.id, 'unit', e.target.value)}
                                                className="w-8 bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] focus:ring-1 focus:ring-slate-400 outline-none"
                                                placeholder={language === 'en' ? 'Unit' : '单位'}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max={item.max} 
                                                step="0.5"
                                                value={item.current}
                                                onChange={(e) => handleProgressChange(item.id, e.target.value)}
                                                className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                            />
                                            <span className="text-[9px] font-mono text-slate-400 w-6 text-right">{item.current}{item.unit}</span>
                                        </div>
                                    )}
                                </td>

                                {/* SCORE or DELETE ACTION */}
                                <td className="py-2 px-3 text-center">
                                    {isEditingScoreboard ? (
                                        <button 
                                            onClick={() => handleDeleteScoreboardItem(item.id)}
                                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title={language === 'en' ? 'Delete goal' : '删除目标'}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border border-slate-200 bg-slate-50 text-slate-600">
                                        {calculateScoreLabel(item)}
                                        </span>
                                    )}
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                        )}
                        
                        {/* Add Button Area in Edit Mode */}
                        {isEditingScoreboard && (
                            <div className="border-t border-slate-100 bg-slate-50 p-2 flex justify-center">
                                <button 
                                    onClick={handleAddScoreboardItem}
                                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                                >
                                    <Plus size={14} /> {language === 'en' ? 'Add Goal' : '添加目标'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Weekly Challenges */}
                    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col h-auto relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-200"></div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-serif text-base text-slate-900">{language === 'en' ? 'One Thing to Try This Week' : '本周想尝试的一件事'}</h3>
                        </div>
                        
                        <div className="space-y-2 mb-3 flex-1">
                            {challenges.length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-[10px] text-slate-400 font-light">
                                        {language === 'en' ? 'Anything fun to try this week? 💪' : '本周有什么想要尝试的有趣事情吗?'}
                                    </p>
                                    <p className="text-[9px] text-slate-300 mt-1">
                                        💡 {language === 'en' ? 'Click' : '可以点击'} <CalendarClock className="inline" size={10}/> {language === 'en' ? 'to delay to next week' : '延迟到下周'}
                                    </p>
                                </div>
                            )}
                            {deferredTaskText && (
                                <div className="py-2.5 px-4 bg-slate-50/50 border-l-2 border-slate-300 rounded-lg animate-fade-in mb-3 shadow-sm">
                                    <p className="text-[9px] text-slate-500 font-light italic tracking-wide">
                                        {language === 'en' ? 'Unfinished tasks can be rolled over with one click.' : '未完成的任务可以一键延期。'}
                                    </p>
                                </div>
                            )}
                            {challenges.map(c => (
                                <div key={c.id} className="flex items-start justify-between group">
                                    {editingChallengeId === c.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editingChallengeText}
                                                onChange={(e) => setEditingChallengeText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') onSaveChallenge();
                                                    if (e.key === 'Escape') setEditingChallengeId(null);
                                                }}
                                                className="flex-1 bg-white border border-slate-300 text-xs px-2 py-1 rounded-md outline-none focus:ring-2 focus:ring-slate-400"
                                                autoFocus
                                            />
                                            <button onClick={onSaveChallenge} className="p-1 text-slate-400 hover:text-green-600 rounded-md transition-colors" title={language === 'en' ? 'Save' : '保存'}><Save size={12}/></button>
                                            <button onClick={() => setEditingChallengeId(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors" title={language === 'en' ? 'Cancel' : '取消'}><Minus size={12}/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start gap-2 flex-1">
                                                <button onClick={() => onToggleChallenge(c.id)} className="mt-0.5 text-slate-400 hover:text-slate-900 transition-colors">
                                                    {c.completed ? <CheckSquare size={14} className="text-slate-900"/> : <Square size={14}/>}
                                                </button>
                                                <span className={`text-xs leading-snug ${c.completed ? 'line-through text-slate-300' : 'text-slate-700'}`}>{c.text}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                <button onClick={() => onEditChallenge(c.id, c.text)} className="p-1 text-slate-400 hover:text-slate-900 rounded-md transition-colors" title={language === 'en' ? 'Edit' : '编辑'}><Edit2 size={12}/></button>
                                                <button onClick={() => onDeferChallenge(c.id)} className="p-1 text-slate-400 hover:text-blue-500 rounded-md transition-colors" title={language === 'en' ? 'Defer to next week' : '推迟到下周'}><CalendarClock size={12}/></button>
                                                <button onClick={() => onDeleteChallenge(c.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors" title={language === 'en' ? 'Delete' : '删除'}><Trash2 size={12}/></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-50 mt-auto">
                            <input 
                                type="text" 
                                value={newChallenge}
                                onChange={(e) => setNewChallenge(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddChallenge()}
                                placeholder={language === 'en' ? "Is there something you are curious to try this week?" : "本周想挑战什么？"}
                                className="flex-1 bg-slate-50 text-[10px] px-2 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-slate-200 placeholder:text-slate-400"
                            />
                            <button onClick={handleAddChallenge} className="bg-slate-900 text-white p-1.5 rounded-md hover:bg-slate-700 transition-colors"><Plus size={12}/></button>
                        </div>
                    </div>

                    {/* Happy Hour Tracker */}
                    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col h-auto relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-200"></div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-serif text-base text-slate-900">{language === 'en' ? 'Happy Hours' : '记录本周的美好瞬间'}</h3>
                        </div>

                        <div className="space-y-2 mb-3 flex-1">
                            {happyHours.length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-[10px] text-slate-400 font-light">
                                        {language === 'en' ? 'Capture the little things that felt good this week ✨' : '记录这周的美好时刻 ✨'}
                                    </p>
                                </div>
                            )}
                            {happyHours.map(c => (
                                <div key={c.id} className="flex items-center justify-between group">
                                    {editingHappyHourId === c.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editingHappyHourText}
                                                onChange={(e) => setEditingHappyHourText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') onSaveHappyHour();
                                                    if (e.key === 'Escape') setEditingHappyHourId(null);
                                                }}
                                                className="flex-1 bg-white border border-slate-300 text-xs px-2 py-1 rounded-md outline-none focus:ring-2 focus:ring-slate-400"
                                                autoFocus
                                            />
                                            <button onClick={onSaveHappyHour} className="p-1 text-slate-400 hover:text-green-600 rounded-md transition-colors" title={language === 'en' ? 'Save' : '保存'}><Save size={12}/></button>
                                            <button onClick={() => setEditingHappyHourId(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors" title={language === 'en' ? 'Cancel' : '取消'}><Minus size={12}/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0"></div>
                                                <span className="text-xs text-slate-700">{c.text}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onEditHappyHour(c.id, c.text)} className="p-1 text-slate-400 hover:text-slate-900 rounded-md transition-colors" title={language === 'en' ? 'Edit' : '编辑'}><Edit2 size={10}/></button>
                                                <button onClick={() => deleteHappyHour(c.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors" title={language === 'en' ? 'Delete' : '删除'}><Trash2 size={10}/></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-50 mt-auto">
                            <input 
                                type="text" 
                                value={newHappyHour}
                                onChange={(e) => setNewHappyHour(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addHappyHour()}
                                placeholder={language === 'en' ? "What made you happy?" : "有什么开心的事？"}
                                className="flex-1 bg-slate-50 text-[10px] px-2 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-slate-200 placeholder:text-slate-400"
                            />
                            <button onClick={addHappyHour} className="bg-slate-900 text-white p-1.5 rounded-md hover:bg-slate-700 transition-colors"><Plus size={12}/></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Modal */}
        <Modal
            isOpen={modalState.isOpen}
            onClose={() => setModalState({ ...modalState, isOpen: false })}
            type={modalState.type}
            title={modalState.title}
            message={modalState.message}
            onConfirm={modalState.onConfirm}
            confirmText={language === 'en' ? 'OK' : '确定'}
            cancelText={language === 'en' ? 'Cancel' : '取消'}
        />
        </>
    );
};

export default Dashboard;