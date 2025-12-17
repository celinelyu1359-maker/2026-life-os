import React, { useState, useEffect, useCallback } from 'react';
import { Book, Film, Star, Plus, X, Trash2, Search, Calendar } from 'lucide-react';
import { ReadingItem, Language } from '../types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

// ✅ LocalStorage Key
const READING_ITEMS_KEY = 'reading-movies-items-2026';

// ✅ Default data for first launch
const defaultItems: ReadingItem[] = [
    { id: '1', title: 'Design Emergency', type: 'book', rating: 5, tags: ['Design', 'Art'], review: 'A fantastic overview of modern design.', dateFinished: '2025-10-15' },
    { id: '2', title: 'Visible Signs', type: 'book', rating: 4, tags: ['Philosophy'], review: 'Deep and thoughtful exploration of visual language.', dateFinished: '2025-11-01' },
    { id: '3', title: 'Optic', type: 'movie', rating: 5, tags: ['Sci-Fi'], review: 'Visual stunner, cinematography was top notch.', dateFinished: '2025-09-20' },
    { id: '4', title: 'The Creative Act', type: 'book', rating: 5, tags: ['Creativity'], review: 'Rick Rubin is a master. Essential reading.', dateFinished: '2025-08-10' },
    { id: '5', title: 'A Sense of Place', type: 'book', rating: 3, tags: ['Travel'], review: 'Okay but a bit slow paced for my taste.', dateFinished: '2025-12-05' },
];

interface ReadingMoviesProps {
    language: Language;
    user?: any; // Supabase user object
}

const ReadingMovies: React.FC<ReadingMoviesProps> = ({ language, user }) => {
  // ✅ State with default values
  const [items, setItems] = useState<ReadingItem[]>(defaultItems);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReadingItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [newItem, setNewItem] = useState<Partial<ReadingItem>>({ type: 'book', rating: 3, tags: [] });
  const [tempTag, setTempTag] = useState('');

  // 辅助函数：同步 Reading Movies 到云端
  const syncReadingMoviesToCloud = useCallback(async (itemsData: ReadingItem[], userId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const rows = itemsData.map(item => ({
        id: item.id,
        user_id: userId,
        title: item.title,
        type: item.type,
        rating: item.rating,
        tags: item.tags || [],
        review: item.review || '',
        date_finished: item.dateFinished,
      }));

      if (rows.length > 0) {
        const { error } = await supabase.from('reading_movies').upsert(rows, {
          onConflict: 'id',
        });

        if (error) {
          console.error('Reading movies sync error:', error);
          throw error;
        }
      }
    } catch (e) {
      console.error('Failed to sync reading movies to cloud', e);
    }
  }, []);

  // ✅ Load from Supabase (优先) or localStorage (fallback)
  useEffect(() => {
    const load = async () => {
      // 如果配置了 Supabase 且用户已登录，从云端加载
      if (isSupabaseConfigured && user) {
        try {
          console.log('📥 Loading reading movies from Supabase for user:', user.id);
          
          const { data, error } = await supabase
            .from('reading_movies')
            .select('*')
            .eq('user_id', user.id)
            .order('date_finished', { ascending: false });

          if (error) throw error;

          if (data && data.length > 0) {
            // 转换数据库格式到应用格式
            const converted: ReadingItem[] = data.map(row => ({
              id: row.id,
              title: row.title,
              type: row.type as 'book' | 'movie',
              rating: row.rating,
              tags: row.tags || [],
              review: row.review || '',
              dateFinished: row.date_finished,
            }));
            setItems(converted);
            console.log('📋 Loaded reading movies:', converted.length, 'items');
          } else {
            // 云端没有数据，尝试从 localStorage 加载并同步
            if (typeof window !== 'undefined') {
              try {
                const savedItems = window.localStorage.getItem(READING_ITEMS_KEY);
                if (savedItems) {
                  const parsed = JSON.parse(savedItems);
                  if (Array.isArray(parsed)) {
                    setItems(parsed);
                    // 同步到云端（延迟执行，避免在加载时触发）
                    setTimeout(() => syncReadingMoviesToCloud(parsed, user.id), 100);
                  } else {
                    setItems([]);
                  }
                } else {
                  setItems([]);
                }
              } catch (e) {
                console.error('Failed to load from localStorage', e);
                setItems([]);
              }
            } else {
              setItems([]);
            }
          }
        } catch (e) {
          console.error('Failed to load reading movies from Supabase', e);
          // 失败时 fallback 到 localStorage
          if (typeof window !== 'undefined') {
            try {
              const savedItems = window.localStorage.getItem(READING_ITEMS_KEY);
              if (savedItems) {
                const parsed = JSON.parse(savedItems);
                if (Array.isArray(parsed)) {
                  setItems(parsed);
                } else {
                  setItems([]);
                }
              } else {
                setItems([]);
              }
            } catch (err) {
              console.error('Failed to load from localStorage', err);
              setItems([]);
            }
          } else {
            setItems([]);
          }
        } finally {
          setIsLoaded(true);
        }
      } else {
        // 未配置 Supabase 或未登录，只从 localStorage 加载
        if (typeof window !== 'undefined') {
          try {
            const savedItems = window.localStorage.getItem(READING_ITEMS_KEY);
            if (savedItems) {
              const parsed = JSON.parse(savedItems);
              if (Array.isArray(parsed)) {
                setItems(parsed);
              }
            }
          } catch (e) {
            console.error('Failed to load reading items from localStorage', e);
          } finally {
            setIsLoaded(true);
          }
        }
      }
    };

    load();
  }, [user, syncReadingMoviesToCloud]);

  // ✅ Save to localStorage and Supabase
  useEffect(() => {
    if (!isLoaded) return;

    // 1. 始终保存到 localStorage
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(READING_ITEMS_KEY, JSON.stringify(items));
      }
    } catch (e) {
      console.error('Failed to save reading items to localStorage', e);
    }

    // 2. 如果配置了 Supabase 且用户已登录，同步到云端
    if (isSupabaseConfigured && user) {
      syncReadingMoviesToCloud(items, user.id);
    }
  }, [items, isLoaded, user, syncReadingMoviesToCloud]);

  // --- Logic ---
  const handleAddItem = () => {
      if(!newItem.title) return;
      const item: ReadingItem = {
          id: Date.now().toString(),
          title: newItem.title,
          type: newItem.type || 'book',
          rating: newItem.rating || 3,
          tags: newItem.tags || [],
          review: newItem.review || '',
          dateFinished: new Date().toISOString().split('T')[0]
      };
      setItems([item, ...items]); 
      setShowAddModal(false);
      setNewItem({ type: 'book', rating: 3, tags: [] });
  };

  const addTag = () => {
      if(tempTag && newItem.tags) {
          setNewItem({...newItem, tags: [...newItem.tags, tempTag]});
          setTempTag('');
      }
  };

  const deleteItem = async (id: string) => {
      // 1. 更新本地状态
      setItems(prev => prev.filter(i => i.id !== id));
      setSelectedItem(null);

      // 2. 从云端删除
      if (isSupabaseConfigured && user) {
        try {
          const { error } = await supabase
            .from('reading_movies')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Failed to delete reading movie from cloud:', error);
          }
        } catch (e) {
          console.error('Error deleting reading movie:', e);
        }
      }
  };

  const filteredItems = items.filter(item => {
      const term = searchTerm.toLowerCase();
      return (
          item.title.toLowerCase().includes(term) ||
          item.tags.some(tag => tag.toLowerCase().includes(term))
      );
  });

  const bookCount = items.filter(i => i.type === 'book').length;
  const movieCount = items.filter(i => i.type === 'movie').length;

  // --- Visual Helpers ---
  const getCoverColor = (id: string) => {
      const colors = [
          'bg-[#E76F51]', // Terracotta
          'bg-[#2A9D8F]', // Teal
          'bg-[#E9C46A]', // Ochre
          'bg-[#264653]', // Charcoal Blue
          'bg-[#F4A261]', // Sandy Orange
          'bg-[#457B9D]', // Muted Blue
          'bg-[#1D3557]', // Navy
          'bg-[#A8DADC]', // Light Blue
      ];
      let hash = 0;
      for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
  };

  // Translations
  const t = {
      title: language === 'en' ? 'Reading & Movies' : '阅读与观影',
      add: language === 'en' ? 'ADD NEW' : '添加',
      books: language === 'en' ? 'Books' : '书籍',
      movies: language === 'en' ? 'Movies' : '电影',
      searchPlaceholder: language === 'en' ? 'Search archive...' : '搜索归档...',
      noItems: language === 'en' ? 'No items found.' : '未找到条目。',
      archiveLabel: language === 'en' ? 'GALLERY' : '画廊',
  };

  return (
    <div className="p-2 md:p-4 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col animate-fade-in">
        
        {/* Main Paper Container */}
        <div className="bg-[#FDFCF6] flex-1 rounded-3xl shadow-sm p-4 md:p-6 overflow-y-auto relative mx-1 md:mx-0">
            
            {/* Header */}
            <div className="mb-4 border-b border-slate-200 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                         <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold tracking-widest uppercase">
                                {t.archiveLabel}
                            </span>
                            <div className="h-px w-8 bg-slate-900/20"></div>
                        </div>
                        <h2 className="font-serif text-3xl md:text-4xl text-slate-900 tracking-tight mb-1">{t.title}</h2>
                        <div className="flex gap-4 text-[9px] font-mono font-medium text-slate-400 uppercase tracking-widest">
                            <span>{bookCount} {t.books}</span>
                            <span className="text-slate-300">•</span>
                            <span>{movieCount} {t.movies}</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto items-center">
                        <div className="relative flex-1 md:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input 
                                type="text" 
                                placeholder={t.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all font-medium placeholder:text-slate-300"
                            />
                        </div>
                        <button 
                            onClick={() => setShowAddModal(true)} 
                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm text-[10px] font-bold uppercase tracking-widest shrink-0"
                        >
                            <Plus size={12} /> <span className="hidden md:inline">{t.add}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            {filteredItems.length === 0 ? (
                 <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 font-serif italic text-base">{t.noItems}</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedItem(item)}
                            className="group relative aspect-[2/3] cursor-pointer rounded-sm shadow-md hover:shadow-xl transition-all duration-500 ease-out perspective-1000"
                        >
                            {/* Cover Base */}
                            <div className={`absolute inset-0 ${getCoverColor(item.id)} rounded-sm flex items-center justify-center transition-transform duration-500 group-hover:-translate-y-2`}>
                                {/* Watermark Icon */}
                                <div className="text-white/20 transform scale-150 group-hover:scale-100 transition-transform duration-500">
                                    {item.type === 'book' ? <Book size={48} strokeWidth={1} /> : <Film size={48} strokeWidth={1} />}
                                </div>
                                {/* Small Center Icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20">
                                        {item.type === 'book' ? <Book size={14} /> : <Film size={14} />}
                                     </div>
                                </div>
                            </div>

                            {/* Spine Shadow Effect */}
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent rounded-l-sm pointer-events-none group-hover:-translate-y-2 transition-transform duration-500"></div>

                            {/* Hover Overlay Content */}
                            <div className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3 rounded-sm hover:-translate-y-2">
                                <h3 className="text-white font-serif text-sm leading-tight mb-2 line-clamp-3">{item.title}</h3>
                                <div className="flex gap-0.5 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={8} fill={i < item.rating ? "#fbbf24" : "none"} className={i < item.rating ? "text-amber-400" : "text-slate-600"}/>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {item.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="text-[8px] text-white/80 bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Detail Modal */}
        {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom-10 duration-300">
                    
                    {/* Left: Visual Cover */}
                    <div className={`${getCoverColor(selectedItem.id)} md:w-1/3 p-6 flex items-center justify-center relative`}>
                        <div className="text-white/30 absolute inset-0 flex items-center justify-center">
                             {selectedItem.type === 'book' ? <Book size={100} strokeWidth={0.5}/> : <Film size={100} strokeWidth={0.5}/>}
                        </div>
                        <div className="relative z-10 text-center">
                            <h3 className="font-serif text-xl text-white font-bold mb-3">{selectedItem.title}</h3>
                            <div className="inline-flex gap-1 bg-black/20 p-1.5 rounded-full backdrop-blur-md">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} fill={i < selectedItem.rating ? "#ffffff" : "none"} className="text-white"/>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 p-6 relative bg-[#FDFCF6]">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={16}/></button>
                        
                        <div className="mb-5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Review</span>
                            <p className="font-serif text-slate-800 text-base leading-relaxed italic">
                                "{selectedItem.review}"
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Tags</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.tags.map(tag => (
                                        <span key={tag} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-slate-500">
                                <Calendar size={12} />
                                <span className="text-[10px] font-mono uppercase tracking-wider">Finished: {selectedItem.dateFinished}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-200 flex justify-end">
                            <button 
                                onClick={() => deleteItem(selectedItem.id)}
                                className="flex items-center gap-2 text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                                <Trash2 size={12} /> Delete Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#FDFCF6] rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-300 border border-slate-100">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-serif text-lg font-bold text-slate-900">Add Entry</h3>
                        <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={18}/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Title</label>
                            <input 
                                autoFocus
                                type="text" 
                                className="w-full bg-white rounded-lg p-2 border border-slate-200 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none font-serif text-sm text-slate-800 placeholder:text-slate-300 transition-all" 
                                placeholder="Enter title..."
                                value={newItem.title || ''}
                                onChange={e => setNewItem({...newItem, title: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Type</label>
                                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                                    <button 
                                        onClick={() => setNewItem({...newItem, type: 'book'})}
                                        className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${newItem.type === 'book' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Book size={10} /> Book
                                    </button>
                                     <button 
                                        onClick={() => setNewItem({...newItem, type: 'movie'})}
                                        className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${newItem.type === 'movie' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Film size={10} /> Movie
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Rating</label>
                                <div className="flex justify-between items-center h-[30px] bg-white border border-slate-200 rounded-lg px-2">
                                    {[1,2,3,4,5].map(star => (
                                        <button key={star} onClick={() => setNewItem({...newItem, rating: star})} className={`${newItem.rating && newItem.rating >= star ? 'text-amber-400' : 'text-slate-200'} hover:scale-110 transition-transform`}>
                                            <Star fill="currentColor" size={12}/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                             <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Tags</label>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Add tag + Enter"
                                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs w-full outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all font-medium text-slate-700"
                                    value={tempTag}
                                    onChange={e => setTempTag(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addTag()}
                                />
                             </div>
                             {newItem.tags && newItem.tags.length > 0 && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {newItem.tags.map(t => (
                                        <span key={t} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-200">{t}</span>
                                    ))}
                                </div>
                             )}
                        </div>

                        <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Review</label>
                            <textarea 
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs h-16 resize-none outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all font-serif text-slate-600 leading-relaxed"
                                value={newItem.review || ''}
                                onChange={e => setNewItem({...newItem, review: e.target.value})}
                                placeholder="Write your thoughts..."
                            ></textarea>
                        </div>

                        <div className="pt-2">
                            <button onClick={handleAddItem} className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:translate-y-0.5">
                                Save to Gallery
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ReadingMovies;