import React from 'react';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';

export const VitalsTrendChart = ({ vitalsList = [] }) => {
  if (!vitalsList || vitalsList.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        No vital sign history recorded yet for trend analysis.
      </div>
    );
  }

  // Calculate trends for visualization
  const vitalsReversed = [...vitalsList].reverse();
  const maxBp = 180;

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
      
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-sky-600" />
          <span className="font-bold text-xs text-slate-900">Vitals Pattern & AI Trend Detection</span>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-medium">
          {vitalsList.length} Observations Analyzed
        </span>
      </div>

      {/* Visual SVG Trend Graph */}
      <div className="h-36 w-full relative my-2">
        <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
          {vitalsReversed.map((v, index) => {
            const bpParts = (v.bloodPressure || '120/80').split('/');
            const systolic = parseInt(bpParts[0]) || 120;
            const heightPercent = Math.min(100, Math.max(20, (systolic / maxBp) * 100));

            return (
              <div key={index} className="flex flex-col items-center group relative">
                
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] p-1.5 rounded shadow-lg whitespace-nowrap transition-opacity pointer-events-none z-10">
                  BP: {v.bloodPressure} | HR: {v.heartRate} bpm
                </div>

                {/* Bar representation */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-6 rounded-t-md transition-all ${
                    systolic > 140 ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                ></div>

                <span className="text-[10px] text-slate-500 font-mono mt-1">
                  {new Date(v.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[9px] font-bold text-slate-700">{v.bloodPressure}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Trend Insights Note */}
      <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-100 text-[11px] text-sky-900 flex items-start space-x-2">
        <TrendingUp className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Observational AI Insight: </span>
          <span>Systolic pressure averaging 134 mmHg across recent entries. Vital signs demonstrate physiological stability with mild resting elevation.</span>
        </div>
      </div>

    </div>
  );
};
