import React from 'react';
import { Shield, Lock, Eye, Database, Download, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface PrivacyPolicyProps {
  language: Language;
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ language, onBack }) => {
  const content = {
    en: {
      title: 'Privacy & Data Protection',
      subtitle: 'How we protect your personal information',
      sections: [
        {
          icon: Lock,
          title: 'End-to-End Privacy',
          content: 'Your journal data is encrypted and only accessible by you. We cannot read your entries, goals, or notes.',
        },
        {
          icon: Database,
          title: 'Data Storage',
          content: 'All data is stored securely using Supabase with Row Level Security (RLS). Each user can only access their own data.',
        },
        {
          icon: Eye,
          title: 'No Tracking',
          content: 'We do not track your behavior, sell your data, or share it with third parties. Your privacy is our priority.',
        },
        {
          icon: Download,
          title: 'Data Ownership',
          content: 'You own your data. Export it anytime in JSON format. Delete your account and all data will be permanently removed.',
        },
      ],
      localMode: {
        title: 'Local Mode',
        content: 'You can use this app without creating an account. All data will be stored locally in your browser. Note: Browser data can be lost if you clear cache or use a different device.',
      },
      cloudMode: {
        title: 'Cloud Sync (Recommended)',
        content: 'Create an account to sync your data across devices and prevent data loss. Your data remains encrypted and private.',
      },
      contact: 'Questions? Contact us at: privacy@lifeos.app',
    },
    zh: {
      title: '隐私与数据保护',
      subtitle: '我们如何保护您的个人信息',
      sections: [
        {
          icon: Lock,
          title: '端到端隐私',
          content: '您的日记数据经过加密，仅您可以访问。我们无法读取您的条目、目标或笔记。',
        },
        {
          icon: Database,
          title: '数据存储',
          content: '所有数据使用Supabase安全存储，配备行级安全策略（RLS）。每个用户只能访问自己的数据。',
        },
        {
          icon: Eye,
          title: '不追踪',
          content: '我们不追踪您的行为，不出售您的数据，也不与第三方共享。您的隐私是我们的首要任务。',
        },
        {
          icon: Download,
          title: '数据所有权',
          content: '您拥有自己的数据。随时以JSON格式导出。删除账号后，所有数据将被永久删除。',
        },
      ],
      localMode: {
        title: '本地模式',
        content: '您可以在不创建账号的情况下使用此应用。所有数据将存储在浏览器本地。注意：如果清除缓存或使用其他设备，浏览器数据可能会丢失。',
      },
      cloudMode: {
        title: '云端同步（推荐）',
        content: '创建账号可在多设备间同步数据并防止数据丢失。您的数据仍然是加密和私密的。',
      },
      contact: '有问题？联系我们：privacy@lifeos.app',
    },
  };

  const t = content[language];

  return (
    <div className="p-2 md:p-4 max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{language === 'en' ? 'Back' : '返回'}</span>
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-emerald-600" size={32} />
          <h1 className="font-serif text-3xl font-bold text-slate-900">{t.title}</h1>
        </div>
        <p className="text-slate-500 text-sm">{t.subtitle}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="space-y-8">
          {/* Privacy Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.sections.map((section, index) => (
              <div key={index} className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <section.icon className="text-emerald-600" size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 mb-2">{section.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Modes */}
          <div className="border-t border-slate-200 pt-6 space-y-6">
            {/* Local Mode */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="font-serif font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Database size={20} className="text-slate-600" />
                {t.localMode.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t.localMode.content}</p>
            </div>

            {/* Cloud Mode */}
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
              <h3 className="font-serif font-bold text-emerald-900 mb-3 flex items-center gap-2">
                <Shield size={20} className="text-emerald-600" />
                {t.cloudMode.title}
              </h3>
              <p className="text-sm text-emerald-800 leading-relaxed">{t.cloudMode.content}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-400 text-center">{t.contact}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
