import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  widthClass = 'max-w-xl'
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-translucent transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Body */}
      <div
        className={`relative w-full ${widthClass} h-full bg-surface border-l border-strong shadow-2xl flex flex-col z-10 animate-drawerSlide`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-token bg-surface-2">
          <div className="min-w-0 pr-4">
            {title && (
              <h2 className="font-heading text-xl md:text-2xl font-black uppercase tracking-wider text-token truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-muted font-mono mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted hover:text-primary-token hover:bg-surface-3 rounded-lg border border-transparent hover:border-token transition-colors cursor-pointer"
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-surface">{children}</div>
      </div>
    </div>
  );
};
