import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../services/api';
import { Lock, Plus, Trash2, CheckCircle2, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export const ConsentPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grant Consent Form
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({
    grantedToRole: 'DOCTOR',
    grantedToName: 'Dr. Amit Sharma',
    resourceType: 'ALL',
    purpose: 'Cardiology Follow-Up Consultation',
    durationHours: 48
  });

  useEffect(() => {
    if (user) {
      fetchConsents();
    }
  }, [user]);

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const targetUid = user?.patientUid || 'PAT-2026-000001';
      const res = await apiFetch(`/consent/${targetUid}`);
      if (res.success) setConsents(res.consents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/consent/grant', {
        method: 'POST',
        body: JSON.stringify({
          patientUid: user?.patientUid || 'PAT-2026-000001',
          ...grantForm
        })
      });

      if (res.success) {
        setShowGrantModal(false);
        fetchConsents();
      }
    } catch (err) {
      alert('Failed to grant consent: ' + err.message);
    }
  };

  const handleRevokeConsent = async (id) => {
    try {
      const res = await apiFetch(`/consent/revoke/${id}`, { method: 'DELETE' });
      if (res.success) {
        fetchConsents();
      }
    } catch (err) {
      alert('Failed to revoke consent: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{t('consent.title')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Control who can access your medical records and specify expiration duration</p>
          </div>
        </div>

        <button
          onClick={() => setShowGrantModal(true)}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/30 flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>{t('consent.grantNew')}</span>
        </button>
      </div>

      {/* Active Consents Card List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-sm text-slate-900">{t('consent.activeConsents')}</h3>
          <span className="text-xs text-slate-500">{consents.length} Granted Permissions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading active consents...</p>
          </div>
        ) : consents.length > 0 ? (
          <div className="space-y-3">
            {consents.map(c => (
              <div key={c._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{c.grantedToName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                      {c.grantedToRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Purpose: <strong className="text-slate-800">{c.purpose}</strong> | Resource: <span className="font-mono text-teal-700">{c.resourceType}</span></p>
                  <p className="text-[11px] text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Expires on: {new Date(c.expiresAt).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => handleRevokeConsent(c._id)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center space-x-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('consent.revokeConsent')}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 italic">
            No active custom data access consents granted. Clinicians require explicit consent or emergency protocols.
          </div>
        )}
      </div>

      {/* Grant Consent Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-4">{t('consent.grantNew')}</h3>
            <form onSubmit={handleGrantConsent} className="space-y-3">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('consent.selectProvider')}</label>
                <select
                  value={grantForm.grantedToRole}
                  onChange={(e) => setGrantForm({ ...grantForm, grantedToRole: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                >
                  <option value="DOCTOR">Doctor</option>
                  <option value="NURSE">Nurse</option>
                  <option value="LAB_TECHNICIAN">Lab Technician</option>
                  <option value="PHARMACIST">Pharmacist</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provider / Clinician Name</label>
                <input
                  type="text"
                  required
                  value={grantForm.grantedToName}
                  onChange={(e) => setGrantForm({ ...grantForm, grantedToName: e.target.value })}
                  placeholder="e.g. Dr. Amit Sharma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('consent.selectData')}</label>
                <select
                  value={grantForm.resourceType}
                  onChange={(e) => setGrantForm({ ...grantForm, resourceType: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                >
                  <option value="ALL">All Medical Records & Labs</option>
                  <option value="MEDICAL_RECORDS">Medical Records Only</option>
                  <option value="LAB_REPORTS">Lab Reports Only</option>
                  <option value="PRESCRIPTIONS">Prescriptions Only</option>
                  <option value="VITALS">Vitals Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Purpose</label>
                <input
                  type="text"
                  required
                  value={grantForm.purpose}
                  onChange={(e) => setGrantForm({ ...grantForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('consent.selectDuration')} ({grantForm.durationHours} Hours)</label>
                <input
                  type="range"
                  min="1"
                  max="168"
                  value={grantForm.durationHours}
                  onChange={(e) => setGrantForm({ ...grantForm, durationHours: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowGrantModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs">Grant Data Access</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
