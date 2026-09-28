import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export const EmergencyAccessModal = ({ isOpen, onClose, initialPatientUid = 'PAT-2026-000001' }) => {
  const [patientUid, setPatientUid] = useState(initialPatientUid);
  const [purpose, setPurpose] = useState('Emergency Life-Saving Treatment');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [activeSession, setActiveSession] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    if (activeSession && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setActiveSession(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession, countdown]);

  if (!isOpen) return null;

  const handleRequestAccess = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/emergency/access', {
        method: 'POST',
        body: JSON.stringify({ patientUid, purpose, durationMinutes })
      });

      if (res.success) {
        setActiveSession(res);
        setCountdown(durationMinutes * 60);
      } else {
        setError(res.message || 'Emergency access denied.');
      }
    } catch (err) {
      setError(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Emergency Access Protocol</h3>
              <p className="text-[11px] text-slate-500">Time-limited override with immutable audit logging</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeSession ? (
          /* Active Emergency Session View */
          <div className="space-y-4">
            
            {/* Active Banner & Countdown */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center relative overflow-hidden">
              <div className="flex items-center justify-center space-x-2 text-amber-900 mb-1">
                <ShieldAlert className="w-5 h-5 text-amber-600 animate-pulse" />
                <span className="font-extrabold text-sm uppercase tracking-wide">Emergency Access Active</span>
              </div>

              <div className="text-3xl font-black font-mono text-amber-950 my-2">
                {formatTimer(countdown)}
              </div>

              <p className="text-xs text-amber-800">
                Access automatically revokes after countdown expires.
              </p>
            </div>

            {/* Critical Emergency Data Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider border-b pb-1">
                Authorized Critical Information
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Patient UID:</span>
                  <span className="font-mono font-bold text-slate-900">{activeSession.emergencyInfo.patientUid}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Blood Group:</span>
                  <span className="font-bold text-red-600 text-sm">{activeSession.emergencyInfo.bloodGroup}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Patient Name:</span>
                  <span className="font-semibold text-slate-900">{activeSession.emergencyInfo.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date of Birth:</span>
                  <span className="text-slate-800">{activeSession.emergencyInfo.dateOfBirth}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-xs block">Known Allergies:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeSession.emergencyInfo.allergies && activeSession.emergencyInfo.allergies.length > 0 ? (
                    activeSession.emergencyInfo.allergies.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-semibold border border-red-200">
                        {a.allergen} ({a.severity})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No critical allergies recorded</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-xs block">Emergency Contact:</span>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">
                  {activeSession.emergencyInfo.emergencyContact.name} ({activeSession.emergencyInfo.emergencyContact.relation}) — <span className="font-mono text-sky-700">{activeSession.emergencyInfo.emergencyContact.phone}</span>
                </p>
              </div>

            </div>

          </div>
        ) : (
          /* Request Form */
          <div className="space-y-4">
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Information Available Under Emergency Override:</p>
              <ul className="grid grid-cols-2 gap-1 text-[11px]">
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" /> Blood Group</li>
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" /> Critical Allergies</li>
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" /> Chronic Conditions</li>
                <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" /> Emergency Contacts</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Patient UID</label>
              <input
                type="text"
                value={patientUid}
                onChange={(e) => setPatientUid(e.target.value)}
                placeholder="e.g. PAT-2026-000001"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              <span className="font-bold">Notice: </span>
              Every emergency access event triggers an immutable audit log entry visible to system administrators and the patient.
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{error}</p>}

            <button
              onClick={handleRequestAccess}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-all"
            >
              {loading ? 'Authorizing Emergency Session...' : 'Request Emergency Access (30 Min)'}
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
