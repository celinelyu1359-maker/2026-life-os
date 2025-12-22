import React, { useState } from 'react';
import { Menu, X, LayoutDashboard, Settings, Calendar, BookOpen, PenSquare, LogOut, User, Download, MessageSquare, Languages } from 'lucide-react';
import { View, Language } from '../types';

interface MobileMenuProps {
  activeView: View;
  onViewChange: (view: View) => void;
  onOpenQuickNote: () => void;
  currentWeek: number;
  language: Language;
  setLanguage: (l: Language) => void;
  user?: any;
  onLogout?: () => void;
  onExportData?: () => void;
  feedbackFormUrl?: string;
  motto?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  activeView,
  onViewChange,
  onOpenQuickNote,
  currentWeek,
  language,
  setLanguage,
  user,
  onLogout,
  onExportData,
  feedbackFormUrl,
  motto,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: language === 'en' ? `Week ${currentWeek}` : `第 ${currentWeek} 周`, icon: LayoutDashboard },
    { id: 'annual', label: language === 'en' ? 'Annual Settings' : '年度设定', icon: Settings },
    { id: 'monthly', label: language === 'en' ? 'Monthly Notebook' : '月度笔记', icon: Calendar },
    { id: 'reading', label: language === 'en' ? 'Reading & Movies' : '阅读观影', icon: BookOpen },
  ];

  const displayYear = currentWeek >= 52 ? 2025 : 2026;

  const handleViewChange = (view: View) => {
    onViewChange(view);
    setIsOpen(false);
  };

  const handleQuickNote = () => {
    onOpenQuickNote();
    setIsOpen(false);
  };

  return (
    <>
      {/* 顶部导航栏 */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{displayYear} LIFE OS</h1>
              <p className="text-xs text-slate-500">
                {menuItems.find(item => item.id === activeView)?.label}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleQuickNote}
            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Quick note"
          >
            <PenSquare size={20} />
          </button>
        </div>
      </div>

      {/* 滑出菜单 */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`fixed top-0 left-0 bottom-0 w-72 bg-white shadow-xl transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full p-6 overflow-y-auto">
            {/* 头部 */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <h1 className="text-2xl font-bold text-slate-900">{displayYear} LIFE OS</h1>
              <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider">
                {language === 'en' ? 'Annual Notebook' : '年度笔记本'}
              </p>
              {motto && (
                <p className="text-sm text-slate-600 mt-3 italic">{motto}</p>
              )}
            </div>

            {/* 导航菜单 */}
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeView === item.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon size={20} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* 底部操作 */}
            <div className="pt-6 mt-6 border-t border-slate-200 space-y-2">
              {/* 语言切换 */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Languages size={18} />
                <span>{language === 'en' ? 'Switch to Chinese' : '切换到英文'}</span>
              </button>

              {/* 导出数据 */}
              {onExportData && (
                <button
                  onClick={() => {
                    onExportData();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Download size={18} />
                  <span>{language === 'en' ? 'Export Data' : '导出数据'}</span>
                </button>
              )}

              {/* 反馈 */}
              {feedbackFormUrl && (
                <a
                  href={feedbackFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <MessageSquare size={18} />
                  <span>{language === 'en' ? 'Feedback' : '反馈'}</span>
                </a>
              )}

              {/* 用户信息 */}
              {user && (
                <div className="px-4 py-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                    <User size={14} />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <LogOut size={14} />
                      <span>{language === 'en' ? 'Logout' : '登出'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部导航栏（可选的额外快捷入口） */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-lg">
        <div className="flex items-center justify-around py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id as View)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                activeView === item.id
                  ? 'text-slate-900'
                  : 'text-slate-400'
              }`}
            >
              <item.icon size={20} strokeWidth={activeView === item.id ? 2 : 1.5} />
              <span className="text-xs font-medium truncate max-w-[60px]">
                {item.id === 'dashboard' ? `W${currentWeek}` : item.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
