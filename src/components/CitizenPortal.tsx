import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, Mic, MicOff, CheckCircle2, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Grievance, GrievanceCategory, GrievanceLanguage } from '../types.js';

const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttarakhand', 'Uttar Pradesh', 
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const CATEGORIES: GrievanceCategory[] = ['Water', 'Roads', 'Healthcare', 'Education', 'Environment', 'Infrastructure', 'Other'];
const LANGUAGES: GrievanceLanguage[] = ['English', 'Hindi', 'Other'];

interface CitizenPortalProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  onGoToLogin: () => void;
}

export default function CitizenPortal({ onAddToast, onGoToLogin }: CitizenPortalProps) {
  const [text, setText] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState<GrievanceCategory>('Other');
  const [language, setLanguage] = useState<GrievanceLanguage>('English');
  
  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<Grievance | null>(null);
  
  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === 'Hindi' ? 'hi-IN' : 'en-IN';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setText(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
        onAddToast('Could not access microphone or audio levels too low.', 'error');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleListening = () => {
    if (!speechSupported) {
      onAddToast('Voice dictation is not supported by your browser.', 'warning');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        onAddToast('Listening... Speak your grievance now.', 'success');
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  const handleValidation = () => {
    const tempErrors: { [key: string]: string } = {};
    if (text.trim().length < 50) {
      tempErrors.text = `Please describe your problem in more detail. Minimum 50 characters required (currently: ${text.length}).`;
    }
    if (!state) {
      tempErrors.state = 'Please select your Indian state/UT from the dropdown list.';
    }
    if (!district.trim()) {
      tempErrors.district = 'Please specify your district or city name.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setIsSubmitting(true);
    // Stop voice listening if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    try {
      const response = await fetch('/api/grievance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, state, district, category, language })
      });

      if (!response.ok) {
        throw new Error('Server error when submitting your grievance.');
      }

      const result = await response.json();
      setSubmitResult(result);
      onAddToast('Grievance analyzed and filed successfully!', 'success');
      
      // Reset form
      setText('');
      setState('');
      setDistrict('');
      setCategory('Other');
    } catch (err: any) {
      console.error(err);
      onAddToast(err.message || 'Submission failed. Please check connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-6 sm:py-8 px-3 sm:px-4 text-slate-800">
      
      {/* Upper Navigation Rail */}
      <header className="max-w-4xl w-full mx-auto flex justify-between items-center bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
            <Landmark className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-slate-900 text-sm">Jan Awaaz AI</span>
            <span className="hidden xs:inline-block ml-2 text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
              Constituency Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGoToLogin}
            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95"
          >
            Staff Portal
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </header>

      {/* Main submission card container */}
      <main className="max-w-[640px] w-full mx-auto my-auto flex flex-col justify-center">
        
        {/* Decorative Top Accent Gradient */}
        <div className="w-full h-1.5 bg-gradient-to-r from-indigo-600 via-blue-500 to-teal-500 rounded-t-xl" />

        <div className="bg-white border border-slate-200/80 p-5 sm:p-8 rounded-b-2xl shadow-md relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {!submitResult ? (
              <motion.div
                key="form-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-6 sm:mb-8">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
                    Jan Awaaz AI — Apni Baat, Apne Neta Tak
                  </h1>
                  <p className="text-xs text-slate-500 mt-2 font-medium max-w-md mx-auto leading-relaxed">
                    Submit your grievance directly to your parliamentary office. Our AI models instantly classify, structure, and route it to correct staff representatives.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Grievance text block */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Grievance Details <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[10px] font-mono font-semibold ${text.length >= 50 ? 'text-teal-600' : 'text-slate-400'}`}>
                        {text.length} / min 50 chars
                      </span>
                    </div>

                    <div className="relative">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Describe the issue in detail (e.g. water pipeline leaks near Main Road, potholes affecting school bus, waste disposal failures)..."
                        className={`w-full min-h-[140px] bg-slate-50 border text-slate-800 rounded-xl p-4 text-sm focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all placeholder:text-slate-400 leading-relaxed ${
                          errors.text ? 'border-rose-500' : 'border-slate-200'
                        }`}
                      />
                      
                      {/* Web Speech Dictation button */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                        {isListening && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={toggleListening}
                          className={`p-2.5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                            isListening
                              ? 'bg-rose-500 border-rose-500 text-white shadow-md'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-sm'
                          }`}
                          title={isListening ? 'Stop Listening' : 'Speak Grievance (Speech to Text)'}
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {errors.text && (
                      <p className="text-xs text-rose-500 font-medium mt-1.5">{errors.text}</p>
                    )}
                  </div>

                  {/* Dual Grid Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* State Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        State / UT <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className={`w-full bg-slate-50 border text-slate-800 rounded-xl p-3 text-sm focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all ${
                          errors.state ? 'border-rose-500' : 'border-slate-200'
                        }`}
                      >
                        <option value="" className="bg-white">Select State</option>
                        {INDIAN_STATES_AND_UTS.map(st => (
                          <option key={st} value={st} className="bg-white text-slate-800">{st}</option>
                        ))}
                      </select>
                      {errors.state && (
                        <p className="text-xs text-rose-500 font-medium mt-1">{errors.state}</p>
                      )}
                    </div>

                    {/* District Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        District / City Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Madurai"
                        className={`w-full bg-slate-50 border text-slate-800 rounded-xl p-3 text-sm focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all ${
                          errors.district ? 'border-rose-500' : 'border-slate-200'
                        }`}
                      />
                      {errors.district && (
                        <p className="text-xs text-rose-500 font-medium mt-1">{errors.district}</p>
                      )}
                    </div>
                  </div>

                  {/* Optionals Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* User Selected Category */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Issue Category (Optional)
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-sm focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat} className="bg-white">{cat}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Our neural engine automatically classifes if unsure.</p>
                    </div>

                    {/* Language Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Submission Language
                      </label>
                      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                        {LANGUAGES.map(lang => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setLanguage(lang)}
                            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              language === lang
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submission Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl text-sm shadow flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-6 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Analyzing and routing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-teal-100" />
                        Submit Grievance to MP
                      </>
                    )}
                  </motion.button>

                </form>
              </motion.div>
            ) : (
              /* Success Confirmation Card Receipt */
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <div className="inline-flex bg-teal-500/10 p-4 rounded-full text-teal-600 mb-4 border border-teal-500/20">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Grievance Registered</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Your voice is recorded. The AI-backed system has filed, summarized, and classified your complaint instantly.
                </p>

                {/* Receipt Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 text-left max-w-md mx-auto my-6 space-y-4">
                  <div className="flex justify-between items-center border-slate-200 border-b pb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracking ID</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {submitResult.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-slate-500 mb-0.5">Category</span>
                      <span className="font-bold text-slate-800">{submitResult.category}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Urgency Level</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase inline-block ${
                        submitResult.urgency === 'High' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                          : submitResult.urgency === 'Medium' 
                            ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {submitResult.urgency}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">District & State</span>
                      <span className="font-bold text-slate-800">{submitResult.district}, {submitResult.state}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Tone Sentiment</span>
                      <span className="font-bold text-slate-800">{submitResult.sentiment}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <span className="block text-xs text-slate-500 mb-1">AI-Generated Summary</span>
                    <p className="text-xs font-medium text-slate-600 italic">
                      "{submitResult.summary}"
                    </p>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <span className="block text-xs text-slate-500 mb-1">Recommended Action</span>
                    <p className="text-xs font-semibold text-slate-800">
                      {submitResult.suggested_action}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
                  <button
                    onClick={() => setSubmitResult(null)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
                  >
                    File Another
                  </button>
                  <button
                    onClick={onGoToLogin}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-600 py-2.5 px-4 rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer shadow-sm active:scale-95"
                  >
                    View Staff Portal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Footer block */}
      <footer className="text-center mt-8">
        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
          State Civic Intelligence Gateway | Powered by Google Gemini AI | Madurai Constituency 2026
        </p>
      </footer>

    </div>
  );
}
