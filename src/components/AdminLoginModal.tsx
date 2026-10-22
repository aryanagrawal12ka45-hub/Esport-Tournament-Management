import React, { useState, useEffect, useRef } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Eye, EyeOff, X, LogOut, CheckCircle2 } from 'lucide-react';
import { useDatabase } from '../store/databaseContext';

export const AdminLoginModal: React.FC = () => {
  const { isAdmin, adminModalOpen, setAdminModalOpen, adminLogin, adminLogout } = useDatabase();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adminModalOpen) {
      setPassword('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [adminModalOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && adminModalOpen) {
        setAdminModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminModalOpen, setAdminModalOpen]);

  if (!adminModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!password.trim()) {
      setErrorMessage('Please enter the administrator password.');
      return;
    }

    const res = adminLogin(password);
    if (res.success) {
      setSuccessMessage('Authentication successful. Admin privileges granted.');
      setTimeout(() => {
        setAdminModalOpen(false);
      }, 700);
    } else {
      setErrorMessage(res.error || 'Authentication failed. Incorrect password.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleLogout = () => {
    adminLogout();
    setAdminModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      onClick={() => setAdminModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-surface border border-strong rounded-xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between px-5 py-4 bg-surface-2 border-b border-token">
          <div className="flex items-center gap-2.5">
            {isAdmin ? (
              <ShieldCheck className="w-5 h-5 text-success-token" />
            ) : (
              <Shield className="w-5 h-5 text-primary-token" />
            )}
            <h2 id="admin-modal-title" className="font-heading text-sm md:text-base font-black tracking-wider uppercase text-token">
              {isAdmin ? 'Administrator Console' : 'Admin Authentication'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAdminModalOpen(false)}
            className="p-1 rounded text-muted hover:text-token hover:bg-surface-3 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {isAdmin ? (
            /* Logged In State */
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-success-soft border border-success-token flex items-center justify-center text-success-token">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-token uppercase">
                  Admin Access Active
                </h3>
                <p className="text-xs font-mono text-muted mt-1 leading-relaxed">
                  You are currently authenticated with full administrator privileges. All database insertions, modifications, deletions, and DDL mutations are unlocked.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger-soft text-danger-token border border-danger-token hover:bg-danger-hover font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-2 text-token border border-token hover:bg-surface-3 font-mono text-xs font-semibold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-2 border border-token text-xs font-mono text-muted">
                <Lock className="w-4 h-4 text-primary-token flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Only authorized administrators may insert, edit, or delete database records. Please provide your administrator password to proceed.
                </p>
              </div>

              {/* Feedback messages */}
              {errorMessage && (
                <div
                  className="p-3 rounded-lg bg-danger-soft border border-danger-token text-xs font-mono text-danger-token flex items-center gap-2"
                  role="alert"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div
                  className="p-3 rounded-lg bg-success-soft border border-success-token text-xs font-mono text-success-token flex items-center gap-2"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password-input"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-token"
                >
                  Administrator Password
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter admin password"
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-surface-2 border border-strong text-token font-mono text-sm placeholder:text-muted focus:border-primary-token focus:outline-none transition-colors"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 p-1 text-muted hover:text-token transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-surface-2 text-token border border-token hover:bg-surface-3 font-mono text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-hover font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authorize Admin</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
