import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Calendar, Clock, Target, ChevronLeft, Trophy } from 'lucide-react';
import { Language } from '../types';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, language }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: language === 'en' ? "Welcome to 2026 Life OS" : "欢迎来到 2026 Life OS",
      description: language === 'en' 
        ? "Monthly Theme is designed to help you build a habit or accelerate a hobby month by month, making ordinary life more interesting."
        : "Monthly Theme这个东西我的初衷就是希望以月为单位去建立一个习惯或者加速某个爱好的成长，让平凡的生活有趣一些。",
      icon: <Calendar className="w-12 h-12 text-indigo-500" />,
      color: "bg-indigo-50"
    },
    {
      title: language === 'en' ? "Smart Todo List" : "智能待办清单",
      description: language === 'en'
        ? "Our todo list features a delay function, allowing tasks to be carried over to the next cycle. No more anxiety about unfinished tasks—adjust your pace flexibly."
        : "我们的todo list是有delay功能的，可以延续到下个周期。不再为未完成的任务感到焦虑，灵活调整你的节奏。",
      icon: <Clock className="w-12 h-12 text-blue-500" />,
      color: "bg-blue-50"
    },
    {
      title: language === 'en' ? "Habit Scoreboard" : "习惯积分榜",
      description: language === 'en'
        ? "Gamify your growth with Normal, Silver, and Golden levels. Track your weekly progress visually and celebrate every small win."
        : "通过普通、白银、黄金三个等级将习惯养成游戏化。可视化追踪你的每周进度，庆祝每一个小小的胜利。",
      icon: <Trophy className="w-12 h-12 text-amber-500" />,
      color: "bg-amber-50"
    },
    {
      title: language === 'en' ? "Life Dimensions" : "生活维度",
      description: language === 'en'
        ? "In Life Dimensions, we support goal splitting, completion tracking, and visual monitoring. Making every big goal within reach."
        : "Life Dimensions里面我们支持拆分目标，写完成情况，做可视化追踪。让每一个大目标都变得触手可及。",
      icon: <Target className="w-12 h-12 text-emerald-500" />,
      color: "bg-emerald-50"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header Image/Icon Area */}
        <div className={`h-48 ${currentStep.color} flex items-center justify-center transition-colors duration-500`}>
          <div className="p-6 bg-white rounded-full shadow-sm transform transition-transform duration-500 hover:scale-110">
            {currentStep.icon}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === step ? 'w-8 bg-slate-800' : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            {currentStep.title}
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            {currentStep.description}
          </p>

          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className={`flex items-center text-slate-500 hover:text-slate-800 transition-colors ${
                step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <ChevronLeft size={20} className="mr-1" />
              {language === 'en' ? 'Back' : '返回'}
            </button>

            <button
              onClick={handleNext}
              className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              {step === steps.length - 1 
                ? (language === 'en' ? 'Get Started' : '开始体验') 
                : (language === 'en' ? 'Next' : '下一步')}
              {step !== steps.length - 1 && <ArrowRight size={18} className="ml-2" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
