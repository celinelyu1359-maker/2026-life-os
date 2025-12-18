import React from 'react';
import { X, AlertTriangle, CheckCircle2, Info, HelpCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle size={20} strokeWidth={2} />,
          colorClass: 'text-amber-600',
          bgClass: 'bg-amber-50',
          borderClass: 'border-amber-200'
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={20} strokeWidth={2} />,
          colorClass: 'text-emerald-600',
          bgClass: 'bg-emerald-50',
          borderClass: 'border-emerald-200'
        };
      case 'confirm':
        return {
          icon: <HelpCircle size={20} strokeWidth={2} />,
          colorClass: 'text-slate-600',
          bgClass: 'bg-slate-50',
          borderClass: 'border-slate-200'
        };
      default:
        return {
          icon: <Info size={20} strokeWidth={2} />,
          colorClass: 'text-blue-600',
          bgClass: 'bg-blue-50',
          borderClass: 'border-blue-200'
        };
    }
  };

  const { icon, colorClass, bgClass, borderClass } = getIconAndColor();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 max-w-sm w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        
        {/* Icon Badge */}
        <div className="flex justify-center mb-4">
          <div className={`${bgClass} ${borderClass} ${colorClass} border p-3 rounded-full`}>
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          {title && (
            <h3 className="font-serif text-xl text-slate-900 mb-2 tracking-tight">
              {title}
            </h3>
          )}
          <p className="text-sm text-slate-600 leading-relaxed font-light">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          {type === 'confirm' ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm hover:shadow"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm hover:shadow"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
