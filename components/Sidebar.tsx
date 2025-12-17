import React from 'react';
import { LayoutDashboard, Settings, Calendar, BookOpen, PenSquare, Languages, LogOut, User } from 'lucide-react';
import { View, Language } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  onOpenQuickNote: () => void;
  currentWeek: number;
  language: Language;
  setLanguage: (l: Language) => void;
  user?: any;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    activeView, 
    onViewChange, 
    onOpenQuickNote, 
    currentWeek,
    language,
    setLanguage,
    user,
    onLogout
}) => {
  const menuItems = [
    { id: 'dashboard', label: language === 'en' ? `Week ${currentWeek}` : `第 ${currentWeek} 周`, icon: LayoutDashboard },
    { id: 'annual', label: language === 'en' ? 'Annual Settings' : '年度设定', icon: Settings },
    { id: 'monthly', label: language === 'en' ? 'Monthly Notebook' : '月度笔记', icon: Calendar },
    { id: 'reading', label: language === 'en' ? 'Reading & Movies' : '阅读观影', icon: BookOpen },
  ];

  return (
    <div className="w-64 bg-[#f8fafc] h-screen fixed left-0 top-0 border-r border-slate-200 flex flex-col p-8 z-10 hidden md:flex font-serif">
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">2026 LIFE OS</h1>
        <p className="text-[10px] font-mono text-slate-400 mt-2 leading-relaxed tracking-widest uppercase">
          {language === 'en' ? 'Annual Notebook' : '年度笔记本'}
        </p>
      </div>

      <div className="flex-1">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 pl-4">Index</h3>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={`w-full flex items-center px-4 py-3 text-xs transition-all duration-300 group relative ${
                activeView === item.id
                  ? 'text-slate-500'
                  : 'text-slate-500 hover:text-slate-500'
              }`}
            >
              {/* Active Tab Background Visual */}
              {activeView === item.id && (
                  <div className="absolute inset-y-0 right-0 left-0 bg-[#FDFCF6] rounded-l-xl border-l-4 border-slate-900 shadow-sm z-0 translate-x-[1px]"></div>
              )}
              
              <div className="relative z-10 flex items-center w-full">
                  <item.icon size={18} className={`mr-4 ${activeView === item.id ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={1.5} />
                  <span className={activeView === item.id ? 'font-bold tracking-wide' : 'font-medium'}>
                      {item.label}
                  </span>
              </div>
            </button>
          ))}
        </nav>

        <div className="mt-12 pl-4 pr-4">
            <button 
                onClick={onOpenQuickNote}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-sm group hover:shadow-md"
            >
                <PenSquare size={16} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                <span>{language === 'en' ? 'Quick Note' : '随手记'}</span>
            </button>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 mt-6 space-y-4">
        {/* User Info & Logout */}
        {user && onLogout && (
          <div className="mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <User size={14} className="text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-slate-700 truncate">
                  {user.email || 'User'}
                </p>
                <p className="text-[9px] text-slate-400">
                  {language === 'en' ? 'Synced' : '已同步'}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={12} />
              <span>{language === 'en' ? 'Log Out' : '退出登录'}</span>
            </button>
          </div>
        )}

        {/* Language Selector */}
        <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{language === 'en' ? 'LANG' : '语言'}</span>
            <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded tracking-wide transition-colors"
            >
                <Languages size={10}/>
                {language === 'en' ? 'ENGLISH' : '中文'}
            </button>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
          2026 motto: <br/><span className="text-slate-600 font-medium">Responsibility</span> & <span className="text-slate-600 font-medium">Nutrition</span>
        </p>
      </div>
    </div>
  );
};

export default Sidebar;