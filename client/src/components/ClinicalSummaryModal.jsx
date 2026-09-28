import React, { useState } from 'react';
import { apiFetch } from '../services/api';
import { Sparkles, X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ClinicalSummaryModal = ({ isOpen, onClose, patientUid }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(`/ai/summary/${patientUid}`);
      if (res.success) {
        setSummaryData(res.summary);
      } else {
        setError(res.message || 'Failed to generate clinical summary.');
      }
    } catch (err) {
      setError(err.message || 'AI service error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">AI Clinical Summary Assistant</h3>
              <p className="text-[11px] text-slate-500">Synthesizing medical history, lab results & active regimens</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Clinical AI Disclaimer Badge */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs mb-4 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">AI-assisted summary — verify with source records.</p>
            <p className="text-[11px] text-amber-800">This clinical synthesis is generated for decision support. It does not replace professional diagnostic judgment.</p>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-12 text-center">
            <Sparkles className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
            <p className="font-semibold text-xs text-slate-700">Synthesizing clinical records for UID: {patientUid}...</p>
          </div>
        ) : summaryData ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 mb-1">Clinical Overview</h4>
              <p className="text-xs text-slate-700 leading-relaxed">{summaryData.overview}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">Key Diagnostic Insights</h4>
              <ul className="space-y-1.5">
                {summaryData.keyInsights.map((insight, i) => (
                  <li key={i} className="flex items-start text-xs text-slate-700 space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">Recommended Next Steps</h4>
              <ul className="space-y-1.5">
                {summaryData.recommendedNextSteps.map((step, i) => (
                  <li key={i} className="flex items-start text-xs text-slate-700 space-x-2">
                    <AlertCircle className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Ready to synthesize records for {patientUid}</p>
            <button
              onClick={handleGenerate}
              className="mt-3 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Generate Clinical Summary
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 mt-3">{error}</p>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>MediSecure AI Engine v1.0</span>
          <button onClick={onClose} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold">Close</button>
        </div>

      </div>
    </div>
  );
};
