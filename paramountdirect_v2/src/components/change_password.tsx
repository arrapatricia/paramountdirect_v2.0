import React, { useState } from 'react';
import { Lock, KeyRound, CheckCircle2, Circle, AlertCircle, X } from 'lucide-react';
import { authApi, ApiError } from '../lib/api';

interface ChangePasswordProps {
  // Forced mode (first login with a temporary password): can't be dismissed,
  // and the current password is the one just typed on the login form.
  forced?: boolean;
  knownCurrentPassword?: string;
  onDone: () => void;
  onCancel: () => void;
}

const inputClass =
  'block w-full pl-10 pr-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d0112b] focus:bg-white dark:bg-slate-800/80 dark:border-slate-700 dark:text-white dark:placeholder-gray-500';

export default function ChangePassword({ forced = false, knownCurrentPassword, onDone, onCancel }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState(knownCurrentPassword ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rules = [
    { label: 'At least 8 characters', ok: newPassword.length >= 8 },
    { label: 'Contains a letter', ok: /[A-Za-z]/.test(newPassword) },
    { label: 'Contains a number', ok: /[0-9]/.test(newPassword) },
    { label: 'Different from your current password', ok: newPassword.length > 0 && newPassword !== currentPassword },
    { label: 'Matches the confirmation', ok: newPassword.length > 0 && newPassword === confirmPassword },
  ];
  const valid = rules.every((r) => r.ok) && currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || saving) return;
    setError(null);
    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl dark:bg-slate-900 dark:border-slate-800">
        {!forced && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-red-50 text-[#d0112b] dark:bg-red-950/30">
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {forced ? 'Set a permanent password' : 'Change password'}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-5 dark:text-slate-400">
          {forced
            ? 'You signed in with a temporary password. Choose a secure password of your own to continue.'
            : 'Enter your current password, then choose a new one.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center space-x-2.5 text-xs font-medium">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#d0112b]" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!forced && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <ul className="space-y-1">
            {rules.map((r) => (
              <li key={r.label} className={`flex items-center space-x-2 text-[11px] font-medium ${r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {r.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                <span>{r.label}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 pt-1">
            {forced && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer dark:hover:bg-slate-800"
              >
                Sign out
              </button>
            )}
            <button
              type="submit"
              disabled={!valid || saving}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white bg-[#d0112b] hover:bg-[#b00e24] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-[#d0112b]/30 transition-all"
            >
              {saving ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
