import React, { useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

type Mode = 'signIn' | 'signUp';

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const disabled = useMemo(() => {
    if (!isSupabaseConfigured) return true;
    return !email.trim() || password.length < 6;
  }, [email, password]);

  const submit = async () => {
    setMsg(null);
    if (!isSupabaseConfigured) {
      setMsg('Supabase is not configured. Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env.local.');
      return;
    }

    try {
      setLoading(true);
      setMsg(null);
      
      if (mode === 'signUp') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('✅ Signed up successfully! Check your email if confirmation is enabled, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMsg('✅ Signed in successfully!');
        // Clear message after 2 seconds
        setTimeout(() => setMsg(null), 2000);
      }
    } catch (e: any) {
      const errorMessage = e?.message || 'Authentication failed';
      // Provide user-friendly error messages
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('Invalid login credentials')) {
        friendlyMessage = 'Invalid email or password. Please try again.';
      } else if (errorMessage.includes('User already registered')) {
        friendlyMessage = 'This email is already registered. Please sign in instead.';
      } else if (errorMessage.includes('Password')) {
        friendlyMessage = 'Password must be at least 6 characters long.';
      } else if (errorMessage.includes('Email')) {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setMsg(`❌ ${friendlyMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-semibold text-slate-900">2026 Life OS</h1>
        <p className="text-sm text-slate-500 mt-1">
          {mode === 'signIn' ? 'Sign in to sync your data across devices.' : 'Create an account to start syncing.'}
        </p>

        <div className="mt-6 space-y-3">
          <div>
            <label className="text-xs text-slate-600">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="min 6 chars"
            />
          </div>

          {msg && (
            <div className={`text-xs rounded-xl border p-3 ${
              msg.includes('Signed up') || msg.includes('成功') || msg.includes('Success')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : msg.includes('failed') || msg.includes('失败') || msg.includes('error') || msg.includes('错误')
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {msg}
            </div>
          )}

          <button
            onClick={submit}
            disabled={disabled || loading}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
              disabled || loading
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {loading ? 'Working…' : mode === 'signIn' ? 'Sign in' : 'Sign up'}
          </button>

          <div className="text-sm text-slate-600 flex items-center justify-between pt-2">
            <button
              className="underline underline-offset-4"
              onClick={() => setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'))}
            >
              {mode === 'signIn' ? 'No account? Sign up' : 'Have an account? Sign in'}
            </button>
            <a
              className="text-xs text-slate-400 hover:text-slate-600"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMsg(
                  'MVP tip: keep it simple. Add Magic Link/Google later once the paid version is stable.'
                );
              }}
            >
              help
            </a>
          </div>

          <div className="pt-4 text-[11px] text-slate-400">
            If you don’t want login yet, you can keep using localStorage-only mode (remove auth gate in App.tsx).
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
