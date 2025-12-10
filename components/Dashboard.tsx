import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, CheckSquare, Square, CalendarClock, RotateCcw, Edit2, Save, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScoreboardItem, ChallengeItem } from '../types';
import { getWeekRange } from '../utils';

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
const defaultScoreboardItems: ScoreboardItem[] = [
    { id: '1', goal: 'Gym', normal: '3hs', silver: '5hs', golden: '7hs', current: 0, max: 7, unit: 'hs', lastWeek: 0 },
    { id: '2', goal: 'Supplements', normal: '5ds', silver: '6ds', golden: '7ds', current: 0, max: 7, unit: 'ds', lastWeek: 0 },
    { id: '3', goal: 'Screen time', normal: '7hpd', silver: '6hs', golden: '5hs', current: 0, max: 7, unit: 'h', lastWeek: 0 },
    { id: '4', goal: 'Connect', normal: '0', silver: '1', golden: '1', current: 0, max: 1, unit: '', lastWeek: 0 },
    { id: '5', goal: 'Deep Focus', normal: '4ds', silver: '5ds', golden: '6ds', current: 0, max: 6, unit: 'ds', lastWeek: 0 },
    { id: '6', goal: 'Sleep 7.5h', normal: '5d', silver: '4d', golden: '3d', current: 0, max: 7, unit: 'd', lastWeek: 0 },
];

// Week 1 示例进度 (用于第一次启动应用时)
const exampleProgress: Record<string, number> = {
    '1': 4,   // Gym
    '2': 5,   // Supplements
    '3': 2.5, // Screen time
    '4': 1,   // Connect
    '5': 3,   // Deep Focus
    '6': 6,   // Sleep 7.5h
};

// ------------------------------------------------------------------------
// ✅ FIX 1: 创建具有示例数据的 Week 1 初始数据
// ------------------------------------------------------------------------
const createInitialWeek1Data = (): WeeklyData => {
    const scoreboardWithExamples = defaultScoreboardItems.map(item => ({ 
        ...item, 
        // 注入示例进度
        current: exampleProgress[item.id] !== undefined ? exampleProgress[item.id] : 0 
    }));
    
    const exampleChallenges: ChallengeItem[] = [
        { id: 'c1', text: 'Complete project proposal draft', completed: false },
        { id: 'c2', text: 'Meditate 4 times this week', completed: true },
    ];
    const exampleHappyHours: ChallengeItem[] = [
        { id: 'h1', text: 'Finished a great book chapter', completed: false },
        { id: 'h2', text: 'Had a fun dinner with friends', completed: false },
    ];

    return {
        weekNum: 1,
        scoreboard: scoreboardWithExamples,
        challenges: exampleChallenges, 
        happyHours: exampleHappyHours,
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
}

const Dashboard: React.FC<DashboardProps> = ({ 
    weekNumber, 
    setWeekNumber,
}) => {
    // =======================================================
    // ✅ 3. 内部状态定义
    // =======================================================
    const [year] = useState(2026);
    const [dateRange, setDateRange] = useState('');
    const [isEditingScoreboard, setIsEditingScoreboard] = useState(false);
    
    // 核心状态：存储所有周的数据
    const [allWeeksData, setAllWeeksData] = useState<WeeklyData[]>(defaultAllWeeksData);
    const [isLoaded, setIsLoaded] = useState(false); // 安全锁

    const [newChallenge, setNewChallenge] = useState('');
    const [newHappyHour, setNewHappyHour] = useState('');


    // =======================================================
    // ✅ 4. LocalStorage 数据加载
    // =======================================================
    useEffect(() => {
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
    }, []);

    // =======================================================
    // ✅ 5. LocalStorage 数据保存 (监听 allWeeksData 和 weekNumber 变化)
    // =======================================================
    useEffect(() => {
        if (isLoaded) {
            try {
                // 保存所有周的数据
                window.localStorage.setItem(ALL_WEEKS_DATA_KEY, JSON.stringify(allWeeksData));
                // 保存当前正在浏览的周数
                window.localStorage.setItem(CURRENT_WEEK_KEY, String(weekNumber));
            } catch (e) {
                console.error('Failed to save data to localStorage', e);
            }
        }
    }, [allWeeksData, isLoaded, weekNumber]); 

    
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
        if(window.confirm('Delete this goal?')) {
            updateCurrentWeekData(data => ({
                ...data,
                scoreboard: data.scoreboard.filter(item => item.id !== id)
            }));
        }
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
    
    const onDeferChallenge = (id: string) => {
        const challengeToDefer = challenges.find(c => c.id === id);
        if (!challengeToDefer) return;

        // 1. 从当前周删除
        updateCurrentWeekData(data => ({
            ...data,
            challenges: data.challenges.filter(c => c.id !== id)
        }));

        // 2. 添加到下一周 (weekNumber + 1)
        const nextWeekNum = weekNumber + 1;

        setAllWeeksData(prev => {
            let nextWeekData = prev.find(d => d.weekNum === nextWeekNum);
            // 过滤掉当前周的数据，因为上面已经修改过了
            let updatedPrev = prev.filter(d => d.weekNum !== nextWeekNum && d.weekNum !== weekNumber);
            // 将更新后的当前周数据重新插入
            const currentData = prev.find(d => d.weekNum === weekNumber);
            if (currentData) {
                 updatedPrev.push(currentData);
            }

            // 如果下一周数据不存在，先创建它 (使用当前周数据进行继承)
            if (!nextWeekData) {
                nextWeekData = createDefaultWeekData(nextWeekNum, currentData);
            }
            
            // 添加延期的 Challenge
            nextWeekData.challenges = [...nextWeekData.challenges, { ...challengeToDefer, completed: false }];

            // 返回新的 allWeeksData
            return [...updatedPrev, nextWeekData].sort((a, b) => a.weekNum - b.weekNum);
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

    // 分数计算 (现在保证 scoreboard 是一个数组)
    const currentTotalScore = scoreboard.reduce((acc, item) => acc + getPoints(item.current, item.max), 0);
    const lastWeekTotalScore = scoreboard.reduce((acc, item) => acc + getPoints(item.lastWeek, item.max), 0);
    const scoreDiff = currentTotalScore - lastWeekTotalScore;


    if (!isLoaded) {
        return <div className="p-4 text-center text-slate-500">Loading Dashboard...</div>;
    }


    // =======================================================
    // ✅ 9. JSX 结构
    // =======================================================
    return (
        <div className="p-2 md:p-4 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col animate-fade-in">
            
            {/* Main Paper Container */}
            <div className="bg-[#FDFCF6] flex-1 rounded-3xl shadow-sm p-4 md:p-6 overflow-y-auto relative mx-1 md:mx-0">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4 border-b border-slate-200 pb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold tracking-widest uppercase">
                                Weekly Review
                            </span>
                            <div className="h-px w-8 bg-slate-900/20"></div>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <h2 className="font-serif text-2xl md:text-3xl text-slate-900 tracking-tight">Week {weekNumber}</h2>
                            <div className="flex bg-white border border-slate-200 rounded-md p-0.5 shadow-sm">
                                {/* 解决不能左右切换的问题：确保 setWeekNumber 被正确调用 */}
                                <button onClick={() => setWeekNumber(Math.max(1, weekNumber - 1))} className="p-0.5 hover:bg-slate-50 rounded text-slate-500"><ChevronLeft size={12}/></button>
                                <button onClick={() => setWeekNumber(Math.min(52, weekNumber + 1))} className="p-0.5 hover:bg-slate-50 rounded text-slate-500"><ChevronRight size={12}/></button>
                            </div>
                        </div>
                        <p className="text-slate-500 font-mono text-[10px] mt-0.5">{dateRange} · {year}</p>
                    </div>
                </div>

                {/* Scoreboard */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-4">
                            <h3 className="font-serif text-lg text-slate-900">Scoreboard</h3>
                            {/* Trend Summary */}
                            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Score:</span>
                                <span className="font-serif font-bold text-slate-900">{currentTotalScore}</span>
                                <div className={`flex items-center text-[10px] font-medium ${scoreDiff >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {scoreDiff > 0 ? <TrendingUp size={12} className="mr-0.5"/> : scoreDiff < 0 ? <TrendingDown size={12} className="mr-0.5"/> : <Minus size={12} className="mr-0.5"/>}
                                    {Math.abs(scoreDiff)} vs last week
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={handleResetScoreboard}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Reset All Progress"
                            >
                                <RotateCcw size={14} />
                            </button>
                            <button 
                                onClick={() => setIsEditingScoreboard(!isEditingScoreboard)}
                                className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 ${isEditingScoreboard ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                                title={isEditingScoreboard ? "Save Changes" : "Edit Goals"}
                            >
                                {isEditingScoreboard ? <Save size={14} /> : <Edit2 size={14} />}
                                {isEditingScoreboard && <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Save</span>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-left min-w-[600px]">
                            <thead>
                            <tr className="text-slate-400 font-mono text-[9px] uppercase tracking-wider border-b border-slate-100">
                                <th className="py-2 px-3 font-normal">Goal</th>
                                <th className="py-2 px-3 font-normal">Normal (1pt)</th>
                                <th className="py-2 px-3 font-normal">Silver (2pts)</th>
                                <th className="py-2 px-3 font-normal">Golden (3pts)</th>
                                <th className="py-2 px-3 font-normal">
                                    {isEditingScoreboard ? 'Max / Unit' : 'Progress'}
                                </th>
                                <th className="py-2 px-3 font-normal text-center w-16">
                                    {isEditingScoreboard ? 'Action' : 'Score'}
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
                                                placeholder="Max"
                                            />
                                            <input 
                                                type="text" 
                                                value={item.unit} 
                                                onChange={(e) => handleScoreboardEdit(item.id, 'unit', e.target.value)}
                                                className="w-8 bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] focus:ring-1 focus:ring-slate-400 outline-none"
                                                placeholder="Unit"
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
                                            title="Delete Goal"
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
                        
                        {/* Add Button Area in Edit Mode */}
                        {isEditingScoreboard && (
                            <div className="border-t border-slate-100 bg-slate-50 p-2 flex justify-center">
                                <button 
                                    onClick={handleAddScoreboardItem}
                                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                                >
                                    <Plus size={14} /> Add Goal
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
                            <h3 className="font-serif text-base text-slate-900">Weekly Challenges</h3>
                        </div>
                        
                        <div className="space-y-2 mb-3 flex-1">
                            {challenges.length === 0 && <p className="text-[10px] text-slate-400 font-light italic">No challenges for this week.</p>}
                            {challenges.map(c => (
                                <div key={c.id} className="flex items-start justify-between group">
                                    <div className="flex items-start gap-2">
                                        <button onClick={() => onToggleChallenge(c.id)} className="mt-0.5 text-slate-400 hover:text-slate-900 transition-colors">
                                            {c.completed ? <CheckSquare size={14} className="text-slate-900"/> : <Square size={14}/>}
                                        </button>
                                        <span className={`text-xs leading-snug ${c.completed ? 'line-through text-slate-300' : 'text-slate-700'}`}>{c.text}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <button onClick={() => onDeferChallenge(c.id)} className="p-1 text-slate-400 hover:text-blue-500 rounded-md transition-colors" title="Defer to next week"><CalendarClock size={12}/></button>
                                        <button onClick={() => onDeleteChallenge(c.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors" title="Delete"><Trash2 size={12}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-50 mt-auto">
                            <input 
                                type="text" 
                                value={newChallenge}
                                onChange={(e) => setNewChallenge(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddChallenge()}
                                placeholder="Add a challenge..."
                                className="flex-1 bg-slate-50 text-[10px] px-2 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-slate-200 placeholder:text-slate-400"
                            />
                            <button onClick={handleAddChallenge} className="bg-slate-900 text-white p-1.5 rounded-md hover:bg-slate-700 transition-colors"><Plus size={12}/></button>
                        </div>
                    </div>

                    {/* Happy Hour Tracker */}
                    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col h-auto relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-200"></div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-serif text-base text-slate-900">Happy Hour Tracker</h3>
                        </div>

                        <div className="space-y-2 mb-3 flex-1">
                            {happyHours.length === 0 && <p className="text-[10px] text-slate-400 font-light italic">No happy moments recorded.</p>}
                            {happyHours.map(c => (
                                <div key={c.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0"></div>
                                        <span className="text-xs text-slate-700">{c.text}</span>
                                    </div>
                                    <button onClick={() => deleteHappyHour(c.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition-opacity"><Trash2 size={10}/></button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-50 mt-auto">
                            <input 
                                type="text" 
                                value={newHappyHour}
                                onChange={(e) => setNewHappyHour(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addHappyHour()}
                                placeholder="Add happy moment..."
                                className="flex-1 bg-slate-50 text-[10px] px-2 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-slate-200 placeholder:text-slate-400"
                            />
                            <button onClick={addHappyHour} className="bg-slate-900 text-white p-1.5 rounded-md hover:bg-slate-700 transition-colors"><Plus size={12}/></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;