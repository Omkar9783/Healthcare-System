import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { HeartPulse, Plus, CheckCircle2, RefreshCw, QrCode } from 'lucide-react';

export const NurseDashboardView = ({ onOpenQRScanner }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientUid, setSelectedPatientUid] = useState('PAT-2026-000001');
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Vitals Form State
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    temperature: 36.8,
    bloodPressure: '120/80',
    heartRate: 75,
    spO2: 98,
    respiratoryRate: 16,
    weight: 72,
    notes: 'Patient resting comfortably. Normal vitals.'
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientUid) {
      fetchVitals(selectedPatientUid);
    }
  }, [selectedPatientUid]);

  const fetchPatients = async () => {
    try {
      const res = await apiFetch('/patients');
      if (res.success) setPatients(res.patients);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVitals = async (uid) => {
    if (!uid) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/vitals/${uid}`);
      if (res.success) setVitalsHistory(res.vitals);
    } catch (err) {
      console.warn('Unable to fetch vitals:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/vitals', {
        method: 'POST',
        body: JSON.stringify({
          patientUid: selectedPatientUid,
          ...vitalsForm
        })
      });

      if (res.success) {
        setShowVitalsModal(false);
        fetchVitals(selectedPatientUid);
      }
    } catch (err) {
      alert('Failed to record vitals: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-6 h-6 text-teal-600" />
            <h1 className="text-xl font-extrabold text-slate-900">Nurse Care & Vitals Station</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Record physiological observations & nursing schedule</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenQRScanner}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1"
          >
            <QrCode className="w-4 h-4 text-sky-600" />
            <span>Scan Patient QR</span>
          </button>

          <button
            onClick={() => setShowVitalsModal(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/30 flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Vitals</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Patient Selection Column */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-bold text-xs text-slate-900 border-b pb-2">Assigned Inpatient Ward</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {patients.map(p => (
              <button
                key={p.uid}
                onClick={() => setSelectedPatientUid(p.uid)}
                className={`w-full p-3 rounded-xl text-left border transition-all ${
                  selectedPatientUid === p.uid ? 'bg-teal-50 border-teal-300 font-semibold' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{p.name}</span>
                  <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border">{p.uid}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Blood: {p.bloodGroup} | Gender: {p.gender}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Vitals History Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Vitals Log — {selectedPatientUid}</h3>
              <p className="text-xs text-slate-500">Historical physiological measurements</p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Fetching vitals history...</p>
            </div>
          ) : vitalsHistory.length > 0 ? (
            <div className="space-y-3">
              {vitalsHistory.map(v => (
                <div key={v._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                    <span>Recorded by: <strong className="text-slate-800">{v.recordedByName}</strong> ({v.recordedByRole})</span>
                    <span>{new Date(v.recordedAt).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs text-center font-bold">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-400 font-normal block">Temp</span>
                      <span className="text-slate-900">{v.temperature}°C</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-400 font-normal block">Blood Pressure</span>
                      <span className="text-sky-700">{v.bloodPressure}</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-400 font-normal block">Heart Rate</span>
                      <span className="text-rose-600">{v.heartRate} bpm</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-400 font-normal block">SpO2</span>
                      <span className="text-emerald-600">{v.spO2}%</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-400 font-normal block">Resp Rate</span>
                      <span className="text-slate-900">{v.respiratoryRate} /m</span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-400 font-normal block">Weight</span>
                      <span className="text-slate-900">{v.weight} kg</span>
                    </div>
                  </div>
                  {v.notes && <p className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-100">Note: {v.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-12 text-center">No vital sign entries recorded yet for this patient.</p>
          )}
        </div>

      </div>

      {/* Record Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-4">Record Patient Vitals ({selectedPatientUid})</h3>
            <form onSubmit={handleRecordVitals} className="space-y-3">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={vitalsForm.temperature}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    required
                    value={vitalsForm.bloodPressure}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })}
                    placeholder="120/80"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    required
                    value={vitalsForm.heartRate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    required
                    value={vitalsForm.spO2}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spO2: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Respiratory Rate (/min)</label>
                  <input
                    type="number"
                    value={vitalsForm.respiratoryRate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nursing Observations / Notes</label>
                <textarea
                  rows={2}
                  value={vitalsForm.notes}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowVitalsModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs">Save Vitals Entry</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
