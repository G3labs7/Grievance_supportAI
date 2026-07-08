import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, MessageSquareCode, Calendar, Sparkles, Download, 
  History, Loader2, User, CheckCircle 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Digest } from '../types.js';

interface DigestViewProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  staffEmail: string;
}

export default function DigestView({ onAddToast, staffEmail }: DigestViewProps) {
  // Range selection - default to last full week (June 29 to July 5, 2026)
  const [startDate, setStartDate] = useState('2026-06-29');
  const [endDate, setEndDate] = useState('2026-07-05');
  
  const [digest, setDigest] = useState<Digest | null>(null);
  const [pastDigests, setPastDigests] = useState<Digest[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  
  // Loading Steps for Multi-Step Indicator
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    'Fetching citizen grievances in selected date range...',
    'Analyzing categories, urgency levels, and clusters with Gemini 3.5-flash...',
    'Synthesizing parliamentary-grade executive summaries and priority issues...',
    'Formatting final briefing report and securing cloud record...'
  ];

  const fetchPastDigests = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch('/api/digests');
      if (!res.ok) throw new Error('Failed to load digests list.');
      const data = await res.json();
      setPastDigests(data);
    } catch (err: any) {
      console.error(err);
      onAddToast('Failed to load previously compiled digests.', 'error');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPastDigests();
  }, []);

  const handleGenerateDigest = async () => {
    setIsGenerating(true);
    setCurrentStep(0);
    setDigest(null);

    // Dynamic Step Simulation intervals
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 2200);

    try {
      const res = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          generatedBy: staffEmail || 'staff@janawaaz.gov.in'
        })
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Digest compilation failed.');
      }

      const data = await res.json();
      // Set to final step for smooth transition
      setCurrentStep(steps.length - 1);
      setTimeout(() => {
        setDigest(data);
        setIsGenerating(false);
        onAddToast('AI Weekly Grievance Digest compiled successfully!', 'success');
        fetchPastDigests();
      }, 600);

    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      onAddToast(err.message || 'Digest compilation failed.', 'error');
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = (d: Digest) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Draw elegant government header
      doc.setFillColor(15, 23, 42); // slate-900 (deep navy)
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('JAN AWAAZ AI — CIVIC BRIEFING SYSTEM', margin, 18);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240);
      doc.text(`WEEKLY PARLIAMENTARY INTELLIGENCE REPORT | ID: ${d.id}`, margin, 26);
      doc.text(`Generated on: ${new Date(d.generated_at).toLocaleString()}`, margin, 32);

      // Elegant Teal underline decoration
      doc.setFillColor(13, 148, 136); // teal-600
      doc.rect(0, 40, pageWidth, 2.5, 'F');

      // Setup body text rendering
      doc.setTextColor(15, 23, 42); // slate-900 text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);

      const splitText = doc.splitTextToSize(d.digest_text, contentWidth);
      let y = 55;
      const pageHeight = doc.internal.pageSize.getHeight();

      splitText.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = 25; // Reset Y with padding on new page
          
          // Header on subsequent pages
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`JAN AWAAZ WEEKLY DIGEST REPORT • ID: ${d.id}`, margin, 12);
          doc.rect(margin, 15, contentWidth, 0.2, 'F');
          y = 22;
        }

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);

        // Highlight titles or lines starting with headers
        const isHeaderLine = line.includes('EXECUTIVE SUMMARY') || 
                            line.includes('TOP PRIORITY ISSUES') || 
                            line.includes('CATEGORY BREAKDOWN') || 
                            line.includes('STATES REQUIRING') || 
                            line.includes('RECOMMENDED GOVERNMENT') || 
                            line.includes('POSITIVE DEVELOPMENTS') ||
                            line.includes('CONSTITUENCY WEEKLY');

        if (isHeaderLine) {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(79, 70, 229); // indigo-600
          y += 4; // Add extra vertical spacing before headers
        } else if (line.startsWith('━━━')) {
          doc.setTextColor(226, 232, 240);
        }

        doc.text(line, margin, y);
        y += 6;
      });

      // Page numbers & brand stamp at bottom
      const totalPagesCount = (doc as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPagesCount; i++) {
        doc.setPage(i);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth - margin - 15, pageHeight - 10);
        doc.text('Jan Awaaz AI powered by Google Gemini', margin, pageHeight - 10);
      }

      doc.save(`Jan_Awaaz_AI_Digest_${d.id}.pdf`);
      onAddToast(`PDF for Digest ${d.id} downloaded successfully.`, 'success');
    } catch (err) {
      console.error(err);
      onAddToast('Failed to export PDF.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Title bar */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans flex items-center gap-2">
          <MessageSquareCode className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          AI Weekly Digest Generator
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Compile thousands of citizen grievances into a single unified parliamentary-grade report in seconds with Gemini AI.
        </p>
      </div>

      {/* Grid: Generator controls and paper sheet result */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left column: Parameters selection & Multi-Step Loader */}
        <div className="space-y-6 xl:col-span-1">
          
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Digest Scope Parameters</h2>
            
            <div className="space-y-3.5">
              {/* Start date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-indigo-600 font-mono shadow-sm"
                  />
                </div>
              </div>

              {/* End date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-indigo-600 font-mono shadow-sm"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateDigest}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 mt-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  Compiling...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  Generate AI Report
                </>
              )}
            </button>
          </div>

          {/* Multi-Step Loading indicator */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-200 p-5 rounded-xl shadow-md space-y-4 text-slate-800"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  AI Synthesis Engine Active
                </div>

                <div className="space-y-3.5 pt-2">
                  {steps.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isActive = idx === currentStep;
                    return (
                      <div key={idx} className="flex gap-3 text-xs items-start leading-relaxed font-medium">
                        <div className="mt-0.5">
                          {isDone ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : isActive ? (
                            <Loader2 className="w-4 h-4 text-indigo-600 shrink-0 animate-spin" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                          )}
                        </div>
                        <span className={`${
                          isDone 
                            ? 'text-slate-400 font-medium' 
                            : isActive 
                              ? 'text-slate-800 font-bold' 
                              : 'text-slate-300'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right column: Document Sheet View */}
        <div className="xl:col-span-2">
          <AnimatePresence mode="wait">
            {digest ? (
              <motion.div
                key="digest-paper"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Paper sheet controls */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Prepared by: <span className="text-slate-900 font-bold">{digest.generated_by}</span>
                  </div>
                  <button
                    onClick={() => handleDownloadPDF(digest)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF Document
                  </button>
                </div>

                {/* Briefing paper document card */}
                <div className="bg-white border border-slate-300 rounded-lg p-4 sm:p-10 shadow-xl space-y-6 relative max-w-2xl mx-auto overflow-hidden">
                  
                  {/* Watermark symbol lines representing official letter head */}
                  <div className="text-center border-b-2 border-indigo-600 pb-6">
                    <div className="font-extrabold text-slate-950 font-sans tracking-wide text-base sm:text-lg">
                      JAN AWAAZ BRIEFING OFFICE
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-indigo-600 uppercase tracking-wider font-extrabold mt-1">
                      Parliamentary Constituency & Welfare Analytics Report
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-mono text-slate-500 mt-2.5 font-bold bg-slate-50 inline-block px-3 py-1 border border-slate-200 rounded-md">
                      Report Ref ID: {digest.id}
                    </div>
                  </div>

                  {/* Serif Styled briefing Text block */}
                  <div className="font-serif text-xs sm:text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap select-text pr-1 py-1">
                    {digest.digest_text}
                  </div>

                  <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-[9px] sm:text-[10px] font-mono text-slate-400 font-bold uppercase select-none">
                    <span>Generated: {new Date(digest.generated_at).toLocaleDateString()}</span>
                    <span>Jan Awaaz Govt AI Gateway</span>
                  </div>
                </div>

              </motion.div>
            ) : (
              !isGenerating && (
                <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-16 text-center text-xs space-y-4 shadow-sm flex flex-col items-center justify-center h-[340px] sm:h-[400px]">
                  <div className="bg-indigo-50 p-5 rounded-full text-indigo-600 border border-indigo-100">
                    <MessageSquareCode className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="font-bold text-slate-800 text-sm">Briefing Document Workspace Empty</h3>
                    <p className="text-slate-400 leading-relaxed">
                      Select date parameters and click **Generate AI Report** to compile and draft the weekly parliamentary briefing.
                    </p>
                  </div>
                </div>
              )
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Section: Past Digests History */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">Past Briefing Digests Archive</h2>
        </div>

        {isHistoryLoading ? (
          <div className="p-8 space-y-3">
            <div className="h-8 bg-slate-50 rounded animate-pulse" />
            <div className="h-8 bg-slate-50 rounded animate-pulse" />
          </div>
        ) : pastDigests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white">
            No previously generated weekly briefing digests exist in the system archives.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pastDigests.map((d) => (
              <div 
                key={d.id} 
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors bg-white text-xs"
              >
                <div className="flex gap-3.5 items-start">
                  <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 text-indigo-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-950 text-xs sm:text-sm">{d.week_range}</span>
                      <span className="text-[9px] sm:text-[10px] bg-slate-50 text-slate-500 border border-slate-200 font-semibold px-2 py-0.5 rounded-md font-mono">
                        {d.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                      <p>
                        Total analyzed: <span className="font-bold text-slate-800">{d.total_grievances} grievances</span>
                      </p>
                      <p>
                        Compiled by: <span className="font-medium text-slate-500">{d.generated_by}</span> • {new Date(d.generated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setDigest(d); onAddToast(`Loaded Digest ${d.id} to workspace.`, 'success'); }}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Open View
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(d)}
                    className="bg-teal-50 hover:bg-teal-100 border border-teal-100 text-teal-600 font-bold py-1.5 px-3 rounded-lg text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
