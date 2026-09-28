import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldCheck, 
  QrCode, 
  Lock, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  Database, 
  FileCheck,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

export const LandingPage = ({ onGetStarted, onExploreSecurity }) => {
  const { loginAsDemoRole } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-sky-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        
        {/* Glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-6 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>FHIR R4 Aligned • Backend-Enforced Security</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {t('hero.title')}
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-400 hover:from-sky-600 hover:to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center space-x-2"
            >
              <span>{t('hero.getStarted')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreSecurity}
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700 transition-all flex items-center space-x-2"
            >
              <Lock className="w-4 h-4 text-sky-400" />
              <span>{t('hero.exploreSecurity')}</span>
            </button>
          </div>

          {/* 1-Click Instant Demo Role Bar */}
          <div className="mt-12 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 max-w-3xl mx-auto backdrop-blur-md">
            <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">⚡ Instant 1-Click Demo Login:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => loginAsDemoRole('doctor@demo.health')} className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all">Doctor Demo</button>
              <button onClick={() => loginAsDemoRole('patient@demo.health')} className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all">Patient Demo</button>
              <button onClick={() => loginAsDemoRole('nurse@demo.health')} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all">Nurse Demo</button>
              <button onClick={() => loginAsDemoRole('lab@demo.health')} className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all">Lab Tech Demo</button>
              <button onClick={() => loginAsDemoRole('pharmacy@demo.health')} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all">Pharmacist Demo</button>
              <button onClick={() => loginAsDemoRole('admin@demo.health')} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-all">Admin Demo</button>
            </div>
          </div>

        </div>
      </section>

      {/* Core Workflow Diagram Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">End-to-End Secure Healthcare Workflow</h2>
            <p className="text-xs text-slate-500 mt-1">From identity assertion to context-aware authorization decision</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center font-bold mb-2">1</div>
              <h3 className="font-bold text-xs text-slate-900">Unique Patient UID</h3>
              <p className="text-[11px] text-slate-500 mt-1">PAT-2026-000001 system generated identity without exposing PII</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 mx-auto flex items-center justify-center font-bold mb-2">2</div>
              <h3 className="font-bold text-xs text-slate-900">Secure QR Token</h3>
              <p className="text-[11px] text-slate-500 mt-1">Random token reference validated server-side (NO medical data in QR)</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center font-bold mb-2">3</div>
              <h3 className="font-bold text-xs text-slate-900">Context-Aware Engine</h3>
              <p className="text-[11px] text-slate-500 mt-1">Role + Purpose + Consent + Time + Relationship evaluation</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold mb-2">4</div>
              <h3 className="font-bold text-xs text-slate-900">Immutable Audit Trail</h3>
              <p className="text-[11px] text-slate-500 mt-1">Append-only audit log recording every view & modification event</p>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Platform Features & Security Pillars</h2>
            <p className="text-xs text-slate-500 mt-1">Designed for medical privacy, compliance readiness, and clinical workflows</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <QrCode className="w-8 h-8 text-sky-600 mb-3" />
              <h3 className="font-bold text-sm text-slate-900">Secure QR Identity Token</h3>
              <p className="text-xs text-slate-600 mt-1">QR contains random signed reference tokens. Server performs lookup and enforces authorization before displaying any records.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <Lock className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-bold text-sm text-slate-900">Patient Privacy & Consent</h3>
              <p className="text-xs text-slate-600 mt-1">Patients can grant and revoke data access to specific doctors or departments with explicit time-based expiration.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <AlertTriangle className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="font-bold text-sm text-slate-900">Temporary Emergency Access</h3>
              <p className="text-xs text-slate-600 mt-1">30-minute temporary override protocol displaying critical blood group, allergies, and emergency contacts with strict audit logging.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <Sparkles className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-sm text-slate-900">AI Clinical Assistance</h3>
              <p className="text-xs text-slate-600 mt-1">Generates structured clinical summaries and vitals pattern detection with explicit verification disclaimers for doctors.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <FileCheck className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-bold text-sm text-slate-900">Centralized Audit Logging</h3>
              <p className="text-xs text-slate-600 mt-1">Append-only audit trail capturing user IDs, timestamps, IP context, requested resource, and authorization result.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <Database className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-bold text-sm text-slate-900">FHIR-Oriented Architecture</h3>
              <p className="text-xs text-slate-600 mt-1">Internal models align with HL7 FHIR R4 standard (Patient, Practitioner, Encounter, Observation, DiagnosticReport).</p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800">
        <p className="font-bold text-slate-200">MediSecure — Smart Healthcare Identity & Role-Based Access Platform</p>
        <p className="mt-1 text-slate-500">Built with React, Express, Node.js, Mongoose & Tailwind CSS</p>
      </footer>

    </div>
  );
};
