import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Square, CheckSquare, Edit2, Trash2, Lightbulb } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Dimension, ToDoItem, Language } from '../types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Input, Button } from './ui';

// ✅ localStorage 用的 key
const DIMENSIONS_KEY = 'annual-dimensions-2026';
const TODOS_KEY = 'annual-todos-2026';

// ✅ 默认数据
const defaultDimensions: Dimension[] = [];

const defaultTodos: ToDoItem[] = [];

interface AnnualSettingsProps {
  user?: any; // Supabase user object
  language?: Language;
  motto?: string;
  onMottoChange?: (newMotto: string) => void;
}

const AnnualSettings: React.FC<AnnualSettingsProps> = ({ user, language = 'en', motto = 'Responsibility & Nutrition', onMottoChange }) => {
  console.log("🔥 AnnualSettings FILE IS LOADED 🔥");

  // 1️⃣ 状态初始化：先只用默认值，避免服务端/客户端不一致报错
  const [dimensions, setDimensions] = useState<Dimension[]>(defaultDimensions);
  const [todos, setTodos] = useState<ToDoItem[]>(defaultTodos);
  
  // 2️⃣ 安全锁：标记数据是否已经从本地加载完毕
  const [isLoaded, setIsLoaded] = useState(false);

  const [newTodo, setNewTodo] = useState('');
  const [addingToDimId, setAddingToDimId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [editingDimTitleId, setEditingDimTitleId] = useState<string | null>(null);
  const [editingDimTitleText, setEditingDimTitleText] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoText, setEditingTodoText] = useState('');
  
  // 编辑Dimension Item的状态
  const [editingDimItemId, setEditingDimItemId] = useState<string | null>(null);
  const [editingDimItemText, setEditingDimItemText] = useState('');
  const [showDimensionQuickAdd, setShowDimensionQuickAdd] = useState(false);
  const [showTodoQuickAdd, setShowTodoQuickAdd] = useState(false);
  const [customDimension, setCustomDimension] = useState('');
  
  // 建议的维度类别
  const suggestedDimensions = language === 'en' 
    ? ['Academic / Career', 'Hobby', 'Sports / Fitness', 'Support System Building', 'Travel Destination', 'Creative Projects']
    : ['学业/职业', '爱好', '运动/健身', '人际关系建设', '旅行目的地', '创作项目'];
  
  // 建议的20个目标
  const suggestedTodos = language === 'en'
    ? ['Try tennis once', 'Try pottery', 'Cook a meal for family', 'Buy a heated desk pad', 'Learn a new song', 'Finish a classic book', 'Visit a museum', 'Try meditation', 'Plant something', 'Write a thank-you letter']
    : ['尝试一次网球', '尝试做陶瓷', '给家人做顿饭', '买一个加热桌垫', '学一首新歌', '读完一本经典', '去一次博物馆', '尝试冥想', '种点什么', '写一封感谢信'];

  // 辅助函数：同步 Annual Settings 到云端
  const syncAnnualSettingsToCloud = useCallback(async (dims: Dimension[], todosData: ToDoItem[], mottoText: string, userId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase.from('annual_settings').upsert({
        id: `${userId}-2026`,
        user_id: userId,
        year: 2026,
        dimensions: dims,
        todos: todosData,
        motto: mottoText || null,
      }, {
        onConflict: 'id',
      });

      if (error) throw error;
    } catch (e) {
      console.error('Failed to sync annual settings to cloud', e);
    }
  }, []);

  // 3️⃣ 挂载时读取：优先从 Supabase，fallback 到 localStorage
  useEffect(() => {
    const load = async () => {
      // 如果配置了 Supabase 且用户已登录，从云端加载
      if (isSupabaseConfigured && user) {
        try {
          const { data, error } = await supabase
            .from('annual_settings')
            .select('*')
            .eq('user_id', user.id)
            .eq('year', 2026)
            .single();

          if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

          if (data) {
            setDimensions(data.dimensions || defaultDimensions);
            setTodos(data.todos || defaultTodos);
            if (onMottoChange && data.motto) {
              onMottoChange(data.motto);
            }
          } else {
            // 云端没有数据，尝试从 localStorage 加载并同步
            if (typeof window !== 'undefined') {
              try {
                const savedDimensions = window.localStorage.getItem(DIMENSIONS_KEY);
                const savedTodos = window.localStorage.getItem(TODOS_KEY);

                if (savedDimensions) {
                  const parsed = JSON.parse(savedDimensions);
                  if (Array.isArray(parsed)) setDimensions(parsed);
                }
                
                if (savedTodos) {
                  const parsed = JSON.parse(savedTodos);
                  if (Array.isArray(parsed)) setTodos(parsed);
                }

                // 同步到云端
                setTimeout(() => {
                  syncAnnualSettingsToCloud(
                    savedDimensions ? JSON.parse(savedDimensions) : defaultDimensions,
                    savedTodos ? JSON.parse(savedTodos) : defaultTodos,
                    motto,
                    user.id
                  );
                }, 100);
              } catch (e) {
                console.error('Failed to load from localStorage', e);
              }
            }
          }
        } catch (e) {
          console.error('Failed to load annual settings from Supabase', e);
          // 失败时 fallback 到 localStorage
          if (typeof window !== 'undefined') {
            try {
              const savedDimensions = window.localStorage.getItem(DIMENSIONS_KEY);
              const savedTodos = window.localStorage.getItem(TODOS_KEY);

              if (savedDimensions) {
                const parsed = JSON.parse(savedDimensions);
                if (Array.isArray(parsed)) setDimensions(parsed);
              }
              
              if (savedTodos) {
                const parsed = JSON.parse(savedTodos);
                if (Array.isArray(parsed)) setTodos(parsed);
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
            const savedDimensions = window.localStorage.getItem(DIMENSIONS_KEY);
            const savedTodos = window.localStorage.getItem(TODOS_KEY);

            if (savedDimensions) {
              const parsed = JSON.parse(savedDimensions);
              if (Array.isArray(parsed)) setDimensions(parsed);
            }
            
            if (savedTodos) {
              const parsed = JSON.parse(savedTodos);
              if (Array.isArray(parsed)) setTodos(parsed);
            }
          } catch (e) {
            console.error('Failed to load from localStorage', e);
          } finally {
            setIsLoaded(true);
          }
        }
      }
    };

    load();
  }, [user, syncAnnualSettingsToCloud, onMottoChange]);

  // 4️⃣ 保存数据：当 dimensions, todos 或 motto 变化时，同时保存到 localStorage 和 Supabase
  useEffect(() => {
    if (!isLoaded) return;

    // 1. 始终保存到 localStorage
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DIMENSIONS_KEY, JSON.stringify(dimensions));
        window.localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    // 2. 如果配置了 Supabase 且用户已登录，同步到云端
    if (isSupabaseConfigured && user) {
      syncAnnualSettingsToCloud(dimensions, todos, motto, user.id);
    }
  }, [dimensions, todos, motto, isLoaded, user, syncAnnualSettingsToCloud]);

  // --- Dimension Logic ---
  const startAddDimensionItem = (dimId: string) => {
    setAddingToDimId(dimId);
    setNewItemText('');
  };

  const confirmAddDimensionItem = (dimId: string) => {
    if(newItemText.trim()) {
      setDimensions(prev => prev.map(d => 
        d.id === dimId 
          ? {
              ...d, 
              items: [
                ...d.items, 
                { id: Date.now().toString(), text: newItemText, completed: false, actualResult: '' }
              ]
            } 
          : d
      ));
    }
    setAddingToDimId(null);
    setNewItemText('');
  };

  const updateDimensionItemResult = (dimId: string, itemId: string, result: string) => {
    setDimensions(prev => prev.map(d => 
      d.id === dimId 
        ? {
            ...d, 
            items: d.items.map(i => i.id === itemId ? { ...i, actualResult: result } : i)
          } 
        : d
    ));
  };

  const toggleDimensionItem = (dimId: string, itemId: string) => {
    setDimensions(prev => prev.map(d => {
      if (d.id === dimId) {
        const updated = d.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i);
        // 完成的item自动移到底部
        const completed = updated.filter(i => i.completed);
        const uncompleted = updated.filter(i => !i.completed);
        return { ...d, items: [...uncompleted, ...completed] };
      }
      return d;
    }));
  };

  const removeDimensionItem = (dimId: string, itemId: string) => {
    setDimensions(prev => prev.map(d => 
      d.id === dimId 
        ? { ...d, items: d.items.filter(i => i.id !== itemId) } 
        : d
    ));
  };
  
  // 编辑Dimension Item
  const startEditDimItem = (itemId: string, text: string) => {
    setEditingDimItemId(itemId);
    setEditingDimItemText(text);
  };
  
  const updateDimItem = (dimId: string, itemId: string, newText: string) => {
    if (!newText.trim()) return;
    setDimensions(prev => prev.map(d =>
      d.id === dimId
        ? { ...d, items: d.items.map(i => i.id === itemId ? { ...i, text: newText } : i) }
        : d
    ));
    setEditingDimItemId(null);
    setEditingDimItemText('');
  };

  const updateDimensionTitle = (dimId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setDimensions(prev => prev.map(d => 
      d.id === dimId ? { ...d, title: newTitle } : d
    ));
    setEditingDimTitleId(null);
    setEditingDimTitleText('');
  };

  const deleteDimension = (dimId: string) => {
    setDimensions(prev => prev.filter(d => d.id !== dimId));
  };

  // --- Todo Logic ---
  const toggleTodo = (id: string) => {
    setTodos(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      // 完成的todo自动移到底部
      const completed = updated.filter(t => t.completed);
      const uncompleted = updated.filter(t => !t.completed);
      return [...uncompleted, ...completed];
    });
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    setTodos(prev => [...prev, { id: Date.now().toString(), text: newTodo, completed: false }]);
    setNewTodo('');
  };

  const startEditTodo = (id: string, currentText: string) => {
    setEditingTodoId(id);
    setEditingTodoText(currentText);
  };

  const updateTodo = (id: string, newText: string) => {
    if (!newText.trim()) return;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
    setEditingTodoId(null);
    setEditingTodoText('');
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progressData = [
    { name: 'Completed', value: completedCount },
    { name: 'Remaining', value: totalCount - completedCount },
  ];

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-2 md:p-4 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col animate-fade-in">
      <div className="bg-[#FDFCF6] flex-1 rounded-3xl shadow-sm p-4 md:p-6 overflow-y-auto relative mx-1 md:mx-0">
        {/* Header */}
        <div className="mb-5 border-b border-slate-200 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold tracking-widest uppercase">
                  {language === 'en' ? '2026 Vision' : '2026愿景'}
                </span>
                <div className="h-px w-8 bg-slate-900/20"></div>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-slate-900 mb-1 tracking-tight">
                {language === 'en' ? 'Annual Settings' : '年度设定'}
              </h1>
              <p className="text-slate-500 max-w-lg leading-relaxed font-light text-xs">
                {language === 'en' ? 'Define the dimensions that will shape your year.' : '定义塑造你这一年的维度。'}
              </p>
            </div>
          </div>
        </div>

        {/* Life Dimensions Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg text-slate-900">{language === 'en' ? 'Life Dimensions' : '人生维度'}</h3>
            <button
              onClick={() => setShowDimensionQuickAdd(!showDimensionQuickAdd)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
              title={language === 'en' ? 'Toggle quick add' : '切换快速添加'}
            >
              <Lightbulb size={14} />
              <span>{language === 'en' ? 'Ideas' : '灵感'}</span>
            </button>
          </div>
          
          {showDimensionQuickAdd && (
            <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 relative">
            <button
              onClick={() => setShowDimensionQuickAdd(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-900 transition-colors"
              title={language === 'en' ? 'Close' : '关闭'}
            >
              <X size={14} />
            </button>
            <p className="text-xs text-slate-600 mb-2 font-medium">
              {language === 'en' ? '💡 Quick add:' : '💡 快速添加：'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedDimensions
                .filter(s => !dimensions.some(d => d.title === s))
                .map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {
                    const newDim: Dimension = {
                      id: Date.now().toString(),
                      title: suggestion,
                      items: []
                    };
                    setDimensions(prev => [...prev, newDim]);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white rounded-lg text-xs font-medium transition-all"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customDimension}
                onChange={(e) => setCustomDimension(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customDimension.trim()) {
                    const newDim: Dimension = {
                      id: Date.now().toString(),
                      title: customDimension.trim(),
                      items: []
                    };
                    setDimensions(prev => [...prev, newDim]);
                    setCustomDimension('');
                  }
                }}
                placeholder={language === 'en' ? 'Add custom dimension...' : '添加自定义维度...'}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-slate-400 outline-none"
              />
              <button
                onClick={() => {
                  if (customDimension.trim()) {
                    const newDim: Dimension = {
                      id: Date.now().toString(),
                      title: customDimension.trim(),
                      items: []
                    };
                    setDimensions(prev => [...prev, newDim]);
                    setCustomDimension('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            </div>
          )}
          
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dimensions.map((dim) => (
              <div key={dim.id} className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col shadow-sm group">
                <div className="flex justify-between items-center mb-3">
                  {editingDimTitleId === dim.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={editingDimTitleText}
                        onChange={(e) => setEditingDimTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateDimensionTitle(dim.id, editingDimTitleText);
                          if (e.key === 'Escape') setEditingDimTitleId(null);
                        }}
                        onBlur={() => updateDimensionTitle(dim.id, editingDimTitleText)}
                        className="flex-1 font-serif text-sm font-bold text-slate-800 border-b-2 border-orange-300 bg-transparent outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-serif text-sm font-bold text-slate-800 border-b-2 border-orange-100">
                        {dim.title}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingDimTitleId(dim.id);
                            setEditingDimTitleText(dim.title);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-900 rounded-md transition-colors"
                          title={language === 'en' ? 'Edit dimension' : '编辑维度'}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(language === 'en' ? `Delete "${dim.title}" dimension?` : `删除“${dim.title}”维度？`)) {
                              deleteDimension(dim.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                          title={language === 'en' ? 'Delete dimension' : '删除维度'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => startAddDimensionItem(dim.id)} 
                    className="text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Plus size={10} /> {language === 'en' ? 'Add' : '添加'}
                  </button>
                </div>
                <div className="space-y-2 flex-1">
                  {dim.items.map(item => (
                    <div key={item.id} className="relative group">
                      {editingDimItemId === item.id ? (
                        <div className="flex items-center gap-2 mb-1">
                          <Input
                            type="text"
                            value={editingDimItemText}
                            onChange={(e) => setEditingDimItemText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateDimItem(dim.id, item.id, editingDimItemText);
                              if (e.key === 'Escape') { setEditingDimItemId(null); setEditingDimItemText(''); }
                            }}
                            variant="compact"
                            className="flex-1"
                            autoFocus
                          />
                          <button onClick={() => updateDimItem(dim.id, item.id, editingDimItemText)} className="text-slate-400 hover:text-green-600 transition-colors">
                            <CheckSquare size={14} />
                          </button>
                          <button onClick={() => { setEditingDimItemId(null); setEditingDimItemText(''); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 mb-1">
                          <button onClick={(e) => { e.stopPropagation(); toggleDimensionItem(dim.id, item.id); }} className="mt-0.5 shrink-0 text-slate-300 hover:text-slate-800 transition-colors">
                            {item.completed ? (
                              <CheckSquare size={14} className="text-slate-800" />
                            ) : (
                              <Square size={14} />
                            )}
                          </button>
                          <span onClick={() => startEditDimItem(item.id, item.text)} className={`text-sm font-light leading-snug transition-all flex-1 cursor-text ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => removeDimensionItem(dim.id, item.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors" title={language === 'en' ? 'Delete' : '删除'}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="ml-5 border-l border-slate-100 pl-2">
                        <input 
                          type="text" 
                          placeholder={language === 'en' ? 'Break it down, track progress, or jot down thoughts...' : '拆分细节、追踪进度或记录想法...'}
                          value={item.actualResult}
                          onChange={(e) => updateDimensionItemResult(dim.id, item.id, e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-600 placeholder:text-slate-300 border-none outline-none focus:placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  ))}
                  {addingToDimId === dim.id && (
                    <div className="bg-slate-50 rounded-lg p-2 flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200">
                      <input 
                        autoFocus
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && confirmAddDimensionItem(dim.id)}
                        placeholder={language === 'en' ? 'Type a goal...' : '输入目标...'}
                        className="flex-1 text-sm bg-transparent outline-none px-1 placeholder:text-slate-400"
                      />
                      <button onClick={() => confirmAddDimensionItem(dim.id)} className="bg-slate-900 text-white p-0.5 rounded hover:bg-slate-700"><Plus size={10}/></button>
                      <button onClick={() => setAddingToDimId(null)} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={10}/></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 20 To Do + Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-slate-200 pt-5 items-start">
          {/* List Section */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-serif text-lg text-slate-900">{language === 'en' ? '20 Things to Do in 2026' : '2026年的 20 件事'}</h3>
                <p className="text-slate-500 text-xs font-light mt-0.5">{language === 'en' ? 'Not "shoulds", actual things you want.' : '不是"应该做的"，而是你真正想做的。'}</p>
              </div>
              <button
                onClick={() => setShowTodoQuickAdd(!showTodoQuickAdd)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                title={language === 'en' ? 'Toggle quick add' : '切换快速添加'}
              >
                <Lightbulb size={14} />
                <span>{language === 'en' ? 'Ideas' : '灵感'}</span>
              </button>
            </div>
            {showTodoQuickAdd && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 relative">
              <button
                onClick={() => setShowTodoQuickAdd(false)}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-900 transition-colors"
                title={language === 'en' ? 'Close' : '关闭'}
              >
                <X size={14} />
              </button>
              <p className="text-xs text-slate-600 mb-2 font-medium">
                {language === 'en' ? '💡 Quick add:' : '💡 快速添加：'}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTodos
                  .filter(s => !todos.some(t => t.text === s))
                  .map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setTodos(prev => [...prev, { id: Date.now().toString(), text: suggestion, completed: false }]);
                    }}
                    className="px-2 py-1 bg-white border border-slate-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white rounded-md text-xs font-medium transition-all"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
              </div>
            )}
            <div className="flex gap-2 mb-4">
              <Input 
                type="text" 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder={language === 'en' ? 'What would you love to do in 2026?' : '你想在2026年做什么？'}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
              />
              <Button 
                onClick={handleAddTodo}
                variant="primary"
                size="sm"
                className="uppercase"
              >
                {language === 'en' ? 'Add' : '添加'}
              </Button>
            </div>

            <div className="space-y-2">
              {todos.map(todo => (
                <div key={todo.id} className="group flex items-start justify-between">
                  {editingTodoId === todo.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="text"
                        value={editingTodoText}
                        onChange={(e) => setEditingTodoText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateTodo(todo.id, editingTodoText);
                          if (e.key === 'Escape') { setEditingTodoId(null); setEditingTodoText(''); }
                        }}
                        variant="compact"
                        className="flex-1"
                        autoFocus
                      />
                      <button onClick={() => updateTodo(todo.id, editingTodoText)} className="p-1 text-slate-400 hover:text-green-600 rounded-md transition-colors" title={language === 'en' ? 'Save' : '保存'}>
                        <CheckSquare size={14} />
                      </button>
                      <button onClick={() => { setEditingTodoId(null); setEditingTodoText(''); }} className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors" title={language === 'en' ? 'Cancel' : '取消'}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 flex-1" onClick={() => startEditTodo(todo.id, todo.text)}>
                        <button onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id); }} className="mt-0.5 text-slate-400 hover:text-slate-900 transition-colors">
                          {todo.completed ? <CheckSquare size={14} className="text-slate-900"/> : <Square size={14}/>}
                        </button>
                        <span className={`text-sm leading-snug cursor-text flex-1 ${todo.completed ? 'line-through text-slate-300' : 'text-slate-700'}`}>{todo.text}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button onClick={() => deleteTodo(todo.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors" title={language === 'en' ? 'Delete' : '删除'}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chart Section */}
          <div className="lg:col-span-4 flex flex-col items-center bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="w-24 h-24 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={40}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#0f172a" /> {/* Slate 900 */}
                    <Cell fill="#e2e8f0" /> {/* Slate 200 */}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-serif font-bold text-slate-900">{progressPercent}%</span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{language === 'en' ? 'Completion' : '完成度'}</span>
              <div className="text-sm font-serif text-slate-900 mt-0.5">
                {completedCount} / {totalCount} {language === 'en' ? 'Items' : '项'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnnualSettings;