import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Language } from '../types';

interface FeedbackSurveyProps {
    onClose: () => void;
    language: Language;
}

interface SurveyAnswers {
    timestamp: string;
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
}

const FeedbackSurvey: React.FC<FeedbackSurveyProps> = ({ onClose, language }) => {
    const [answers, setAnswers] = useState({
        q1: '',
        q2: '',
        q3: '',
        q4: '',
        q5: ''
    });

    const handleSubmit = () => {
        const surveyData: SurveyAnswers = {
            timestamp: new Date().toISOString(),
            ...answers
        };

        // 保存到 localStorage
        const existingFeedback = localStorage.getItem('user-feedback-2026');
        const feedbackArray = existingFeedback ? JSON.parse(existingFeedback) : [];
        feedbackArray.push(surveyData);
        localStorage.setItem('user-feedback-2026', JSON.stringify(feedbackArray));

        // 显示感谢消息
        alert(language === 'en' 
            ? 'Thank you for your feedback! 🙏' 
            : '感谢你的反馈！🙏'
        );
        
        onClose();
    };

    const isComplete = answers.q1 && answers.q2 && answers.q3 && answers.q4 && answers.q5;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-start">
                    <div>
                        <h2 className="font-serif text-2xl text-slate-900 mb-2">
                            {language === 'en' ? 'Help us improve! 🌱' : '帮助我们改进！🌱'}
                        </h2>
                        <p className="text-sm text-slate-600">
                            {language === 'en' 
                                ? "Thank you so much for testing this early version! It's still very much an MVP, and your feedback really helps." 
                                : '感谢你测试这个早期版本！这仍然是一个 MVP，你的反馈非常重要。'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {language === 'en' ? 'This should only take ~3 minutes.' : '大约只需3分钟。'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Questions */}
                <div className="p-6 space-y-8">
                    {/* Q1 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-3">
                            1. Which part do you use or care about the most?
                        </label>
                        <div className="space-y-2">
                            {[
                                'Auto-jumping to the current week',
                                'One-click rollover of a unfinished task',
                                'Weekly dashboard / self-tracking',
                                "I'm still figuring it out 😅"
                            ].map(option => (
                                <label key={option} className="flex items-start gap-2 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="q1"
                                        value={option}
                                        checked={answers.q1 === option}
                                        onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
                                        className="mt-0.5"
                                    />
                                    <span className="text-sm text-slate-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Q2 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-3">
                            2. Would you record anything here that you wouldn't want others to see?
                        </label>
                        <div className="space-y-2">
                            {['Often', 'Sometimes', 'Rarely / never'].map(option => (
                                <label key={option} className="flex items-start gap-2 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="q2"
                                        value={option}
                                        checked={answers.q2 === option}
                                        onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
                                        className="mt-0.5"
                                    />
                                    <span className="text-sm text-slate-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Q3 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-3">
                            3. When a week ends, you usually:
                        </label>
                        <div className="space-y-2">
                            {[
                                'Do a quick personal reflection',
                                'Skip reflection and move straight to the next week',
                                'Wish there was a very quick way to review the week'
                            ].map(option => (
                                <label key={option} className="flex items-start gap-2 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="q3"
                                        value={option}
                                        checked={answers.q3 === option}
                                        onChange={(e) => setAnswers({ ...answers, q3: e.target.value })}
                                        className="mt-0.5"
                                    />
                                    <span className="text-sm text-slate-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Q4 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-3">
                            4. During your use, was there any moment you thought: "This could be easier / more effortless"? (Even something very small!)
                        </label>
                        <textarea
                            value={answers.q4}
                            onChange={(e) => setAnswers({ ...answers, q4: e.target.value })}
                            placeholder={language === 'en' ? 'Your thoughts...' : '你的想法...'}
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none min-h-[100px]"
                        />
                    </div>

                    {/* Q5 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-3">
                            5. Before this, how did you usually plan or journal?
                        </label>
                        <div className="space-y-2">
                            {[
                                'Paper journals',
                                'Notion or other digital tools',
                                'Phone notes',
                                "I didn't really have a system"
                            ].map(option => (
                                <label key={option} className="flex items-start gap-2 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="q5"
                                        value={option}
                                        checked={answers.q5 === option}
                                        onChange={(e) => setAnswers({ ...answers, q5: e.target.value })}
                                        className="mt-0.5"
                                    />
                                    <span className="text-sm text-slate-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
                    <button
                        onClick={handleSubmit}
                        disabled={!isComplete}
                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                            isComplete
                                ? 'bg-slate-900 text-white hover:bg-slate-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Send size={16} />
                        {language === 'en' ? 'Submit Feedback' : '提交反馈'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackSurvey;
