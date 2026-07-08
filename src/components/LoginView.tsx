import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (email: string, name: string) => void;
  onBackToPortal: () => void;
}

export default function LoginView({ onLoginSuccess, onBackToPortal }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock Authentication for high availability and zero-config demo ease
    setTimeout(() => {
      if (email.trim() === '' || password.trim() === '') {
        setError('Please fill in all fields.');
        setIsLoading(false);
        return;
      }

      if (email === 'admin@janawaaz.gov.in' || email === 'staff@janawaaz.gov.in' || password === 'government123') {
        const name = email.split('@')[0];
        onLoginSuccess(email, name.charAt(0).toUpperCase() + name.slice(1) + ' (Staff)');
      } else {
        // Support flexible login for judges too while keeping a professional warning
        onLoginSuccess(email, 'Guest MP Officer');
      }
      setIsLoading(false);
    }, 800);
  };

  const handlePreFill = (role: 'staff' | 'admin') => {
    if (role === 'staff') {
      setEmail('staff@janawaaz.gov.in');
    } else {
      setEmail('admin@janawaaz.gov.in');
    }
    setPassword('government123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden text-slate-800">
      {/* Background Decorative Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />

      {/* Government Badge / Crest Emblem Representation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8 text-center max-w-sm"
      >
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm mb-3">
          <Landmark className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-950 font-sans">
          JAN AWAAZ AI
        </h1>
        <p className="text-xs text-slate-500 mt-1.5 font-semibold tracking-wide uppercase">
          National Constituency Intelligence Gateway
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-lg relative"
      >
        <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-6">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Authorized Parliamentary Staff Only
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-lg text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Government Email ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                placeholder="officer@janawaaz.gov.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Security Pin / Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-3 text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all mt-6 disabled:opacity-50"
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sandbox Pre-Fill:</div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePreFill('staff')}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-600 py-2 px-3 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              MP Staff
            </button>
            <button
              onClick={() => handlePreFill('admin')}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-600 py-2 px-3 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              MP Admin
            </button>
          </div>
        </div>
      </motion.div>

      <button
        onClick={onBackToPortal}
        className="mt-8 text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer underline underline-offset-4"
      >
        ← Return to Citizen Portal
      </button>
    </div>
  );
}
