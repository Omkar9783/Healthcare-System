import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../services/api';
import { PatientQRCard } from '../components/PatientQRCard';
import { VitalsTrendChart } from '../components/VitalsTrendChart';
import { 
  Heart, 
  Calendar, 
  Pill, 
  FlaskConical, 
  Lock, 
  History, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  Landmark,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const PatientDashboardView = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientProfile();
  }, [user]);

  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/patients/${user.patientUid}`);
      if (res.success) {
        setPatientData(res);
      }
    } catch (err) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-semibold">Loading Patient Health Profile...</p>
      </div>
    );
  }

  const patient = patientData?.patient || {
    uid: user.patientUid || 'PAT-2026-000001',
    name: user.name,
    bloodGroup: 'B+',
    dateOfBirth: '1988-04-12',
    phone: '9988776651',
    qrToken: `MS-QR-${user.patientUid}-SECURE`
  };

  const prescriptions = patientData?.prescriptions || [];
  const labReports = patientData?.labReports || [];
  const vitalsList = patientData?.vitalsList || [];
  const activeConsents = patientData?.activeConsents || [];

  return (
    <div className="space-y-6">
      
      {/* Patient Header Greeting */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold tracking-tight">Welcome, {patient.name}</h1>
              <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {patient.uid}
              </span>
            </div>
            <p className="text-xs text-sky-200 mt-1">
              MediSecure Health Identity • Consent Controlled • FHIR Interoperability Active
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="text-right text-xs">
              <span className="block text-sky-200 text-[10px]">Blood Group:</span>
              <span className="font-extrabold text-base text-white">{patient.bloodGroup}</span>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <div className="text-right text-xs">
              <span className="block text-sky-200 text-[10px]">Active Consents:</span>
              <span className="font-extrabold text-base text-emerald-300">{activeConsents.length} Granted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Government Health Scheme Banner Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-emerald-700/50 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-emerald-500/20">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Government Health Schemes
                </span>
                <span className="text-[10px] text-emerald-200">
                  Preliminary Check • MJPJAY 2.0 & PM-JAY
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-1">
                Government Health Scheme & Ration Card Assistance
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Verify ration card (Yellow/Orange/White), check up to ₹5,00,000 cashless benefits, manage family health profiles, view covered packages, and chat with the AI assistant.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('government-schemes')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Schemes Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: QR Card + Dashboard Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Secure QR Identity Card */}
        <div className="lg:col-span-1">
          <PatientQRCard patient={patient} onRefresh={fetchPatientProfile} />
        </div>

        {/* Right 2 Columns: Health Modules */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <Heart className="w-5 h-5 text-rose-500 mb-1" />
              <span className="text-[11px] text-slate-500 block">Latest BP</span>
              <span className="font-extrabold text-sm text-slate-900">
                {vitalsList[0] ? vitalsList[0].bloodPressure : '120/80'}
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <Pill className="w-5 h-5 text-sky-500 mb-1" />
              <span className="text-[11px] text-slate-500 block">Prescriptions</span>
              <span className="font-extrabold text-sm text-slate-900">{prescriptions.length} Active</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <FlaskConical className="w-5 h-5 text-purple-500 mb-1" />
              <span className="text-[11px] text-slate-500 block">Lab Reports</span>
              <span className="font-extrabold text-sm text-slate-900">{labReports.length} Available</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <Lock className="w-5 h-5 text-emerald-500 mb-1" />
              <span className="text-[11px] text-slate-500 block">Data Privacy</span>
              <span className="font-extrabold text-xs text-emerald-600">Protected</span>
            </div>

          </div>

          {/* Vitals Pattern & AI Trend Widget */}
          <VitalsTrendChart vitalsList={vitalsList} />

          {/* Active Consents Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs text-slate-900">Active Privacy Consents</h3>
              </div>
              <button
                onClick={() => setActiveTab('consent')}
                className="text-[11px] text-sky-600 hover:underline font-semibold"
              >
                Manage Privacy Center &rarr;
              </button>
            </div>

            {activeConsents.length > 0 ? (
              <div className="space-y-2">
                {activeConsents.map(c => (
                  <div key={c._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{c.grantedToName} ({c.grantedToRole})</p>
                      <p className="text-slate-500 text-[11px]">Purpose: {c.purpose} • Scope: {c.resourceType}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No custom clinician consents granted currently.</p>
            )}
          </div>

          {/* Prescriptions & Lab Reports Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Prescriptions */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-xs text-slate-900 pb-2 border-b border-slate-100 mb-3 flex items-center justify-between">
                <span>Recent Prescriptions</span>
                <button onClick={() => setActiveTab('prescriptions')} className="text-sky-600 text-[11px]">View All</button>
              </h3>
              <div className="space-y-2">
                {prescriptions.slice(0, 2).map(p => (
                  <div key={p._id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-900">{p.diagnosis}</p>
                    <p className="text-slate-500 text-[11px]">Prescribed by {p.doctorName}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                      p.dispensingStatus === 'Dispensed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.dispensingStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lab Reports */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-xs text-slate-900 pb-2 border-b border-slate-100 mb-3 flex items-center justify-between">
                <span>Laboratory Reports</span>
                <button onClick={() => setActiveTab('lab-reports')} className="text-sky-600 text-[11px]">View All</button>
              </h3>
              <div className="space-y-2">
                {labReports.slice(0, 2).map(l => (
                  <div key={l._id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-900">{l.testName}</p>
                    <p className="text-slate-500 text-[11px]">Requested by {l.requestedByDoctor}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                      l.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
