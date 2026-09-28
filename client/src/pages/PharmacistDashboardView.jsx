import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { Pill, CheckCircle2, Clock, ShieldAlert, RefreshCw } from 'lucide-react';

export const PharmacistDashboardView = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/prescriptions');
      if (res.success) setPrescriptions(res.prescriptions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (id) => {
    try {
      const res = await apiFetch(`/prescriptions/${id}/dispense`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Dispensed' })
      });

      if (res.success) {
        fetchPrescriptions();
      }
    } catch (err) {
      alert('Failed to update dispensing status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Hospital Pharmacy Dispensing Station</h1>
            <p className="text-xs text-slate-500 mt-0.5">Verify doctor prescriptions and update drug dispensing status</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            {prescriptions.filter(p => p.dispensingStatus === 'Pending').length} Pending Dispenses
          </span>
        </div>
      </div>

      {/* Security RBAC Banner */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <span>Role Permission Rule: Pharmacists can verify orders & record dispensation, but cannot alter physician diagnoses.</span>
        </div>
        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border">
          RBAC Active
        </span>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900">Active Prescriptions Queue</h3>
          <button onClick={fetchPrescriptions} className="text-xs text-sky-600 font-semibold flex items-center space-x-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading prescription queue...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {prescriptions.map(p => (
              <div key={p._id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{p.patientName}</span>
                    <span className="font-mono text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                      {p.patientUid}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Diagnosis: <strong className="text-slate-800">{p.diagnosis}</strong> | Prescribed by <span className="font-semibold text-sky-700">{p.doctorName}</span> on {new Date(p.createdAt).toLocaleDateString()}
                  </p>

                  {/* Medicines Breakdown */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {p.medicines.map((m, i) => (
                      <div key={i} className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-mono">
                        <span className="font-bold text-slate-900">{m.name}</span> ({m.dosage}) — <span className="text-sky-700">{m.frequency}</span> [{m.duration}]
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    p.dispensingStatus === 'Dispensed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {p.dispensingStatus}
                  </span>

                  {p.dispensingStatus === 'Pending' ? (
                    <button
                      onClick={() => handleDispense(p._id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Dispense Medicine</span>
                    </button>
                  ) : (
                    <div className="text-right text-[11px] text-slate-400">
                      <span>Dispensed by: {p.dispensedByPharmacist}</span>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
