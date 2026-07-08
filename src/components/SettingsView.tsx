import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, KeyRound, Globe2, ShieldAlert, Cpu, 
  HelpCircle, CheckCircle, Save 
} from 'lucide-react';

interface SettingsViewProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export default function SettingsView({ onAddToast }: SettingsViewProps) {
  const [apiKeySet, setApiKeySet] = useState(true);

  const handleSaveSettings = () => {
    onAddToast('Settings profile updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans flex items-center gap-2">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          System Settings & Integrations
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage Google Gemini API keys, tune geographical focus boundaries, and monitor the automated rules-based classification engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API Key management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-xl shadow-sm space-y-5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Cognitive AI Model Configuration
            </h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Active Language Model</label>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[11px] sm:text-xs font-bold text-slate-800 font-mono">
                  Google Gemini 1.5 Flash / 3.5 Flash API (Strict JSON Schema)
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Gemini Secret Key Source</label>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-800 space-y-1.5 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Automated Environment Variable Handled
                  </div>
                  <p className="text-emerald-700">
                    The API key is securely parsed via <strong>process.env.GEMINI_API_KEY</strong> server-side. Client scripts are insulated, preventing exposure in browser inspector consoles.
                  </p>
                </div>
              </div>

              {/* Robust Fallback disclaimer */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 space-y-1.5 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  Offline & Quota Resilient Fail-Safe Active
                </div>
                <p className="text-amber-700">
                  If the Gemini key is unconfigured or encounters API quota throttling, our server-side <strong>local rules-based classifier</strong> automatically triggers. It extracts categories, structures summaries, and assigns actions locally with zero latency, ensuring the citizen portal remains online under all circumstances.
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              Apply Configuration Profiles
            </button>
          </div>

          {/* Geographical configurations */}
          <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-teal-600" />
              Geographic Focus Settings
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define the geographical target boundaries for MP oversight. Defaulting to all Indian states and Union Territories, optimizing regional municipal routing parameters.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="block text-slate-500 mb-0.5">Focus Sub-Districts</span>
                <span className="font-bold text-slate-800">All (Madurai Central, Melur, etc.)</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="block text-slate-500 mb-0.5">Focus State Authority</span>
                <span className="font-bold text-slate-800">Govt of Tamil Nadu & Union of India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Hackathon Technical Specifications
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Node.js Framework</span>
                <span className="font-mono text-slate-800">Express v4 / Vite v6</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Model Deployment</span>
                <span className="text-slate-800 font-semibold">Gemini 1.5 Flash</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Persistence Storage</span>
                <span className="text-slate-800 font-semibold">Seeded local DB (150 rows)</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500 font-medium">CSS Engine</span>
                <span className="font-mono text-slate-800">Tailwind CSS v4</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-3 text-[11px] leading-relaxed">
              <div>
                <span className="font-bold text-slate-800 block">How does the Speech API function?</span>
                <span className="text-slate-500">It connects browser audio streams directly to localized Web Speech Engines, supporting English and Hindi dictation with no network costs.</span>
              </div>
              <div>
                <span className="font-bold text-slate-800 block">What formats are exports generated in?</span>
                <span className="text-slate-500">PDF exports use client-side vector synthesis with tailored font scaling, completely avoiding pixelated raster images.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
