import React from 'react';
import { Lightbulb } from 'lucide-react';

interface QuickAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  quickActions?: QuickAction[];
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  quickActions 
}) => {
  return (
    <div className="py-12 px-6 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
      {/* Icon */}
      {icon ? (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      ) : (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-50 rounded-full">
            <Lightbulb size={24} className="text-blue-500" />
          </div>
        </div>
      )}
      
      {/* Title */}
      <h3 className="font-serif text-lg text-slate-900 mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-sm text-slate-500 font-light leading-relaxed mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      {/* Quick Actions */}
      {quickActions && quickActions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
