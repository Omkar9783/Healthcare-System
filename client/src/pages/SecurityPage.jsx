import React from 'react';
import { ShieldCheck, QrCode, Lock, AlertTriangle, FileCheck, Database, CheckCircle2 } from 'lucide-react';

export const SecurityPage = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-8 text-white shadow-xl border border-slate-800">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold border border-sky-400/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Security & Identity Design Architecture</h1>
            <p className="text-xs text-sky-300">Privacy by Design • Server-Enforced RBAC • Zero PII in QR Codes</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed mt-2">
          MediSecure eliminates the vulnerability of static client-side QR codes. All authorization decisions occur server-side through a context-aware policy engine evaluating user role, consent state, clinical purpose, and emergency status.
        </p>
      </div>

      {/* Security Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pillar 1: QR Architecture */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-sm">
            <QrCode className="w-5 h-5" />
            <h3>1. QR Code Token Security</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The QR code payload contains only a random, server-generated lookup token:
            <code className="block my-2 p-2 bg-slate-900 text-sky-300 rounded font-mono text-[11px]">
              {`{ "system": "MediSecure-Identity", "token": "MS-QR-PAT-2026-000001-9a8f", "uid": "PAT-2026-000001" }`}
            </code>
            Medical records, lab reports, and vitals are <strong className="text-slate-900">NEVER embedded</strong> directly inside the QR code.
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t">
            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" /> Server-side token signature verification</li>
            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" /> Time-limited 24-hour expiration token rotation</li>
            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" /> Instant patient revocation capability</li>
          </ul>
        </div>

        {/* Pillar 2: Context-Aware RBAC */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-teal-600 font-bold text-sm">
            <Lock className="w-5 h-5" />
            <h3>2. Context-Aware Authorization Policy</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every access request is evaluated dynamically:
            <code className="block my-2 p-2 bg-slate-900 text-teal-300 rounded font-mono text-[11px]">
              {"canAccess(User, PatientUID, Resource, Purpose) => Allowed / Denied"}
            </code>
            Doctors can only view patients with whom they have an active appointment or explicit patient consent.
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t">
            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" /> Role-Based Access Control (7 Distinct Roles)</li>
            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" /> Patient-controlled time-bound consents</li>
            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" /> Departmental separation of concerns</li>
          </ul>
        </div>

        {/* Pillar 3: Emergency Protocol */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-600 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <h3>3. Emergency Access Protocol</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In trauma situations, emergency staff can trigger a temporary 30-minute override:
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 pt-1">
            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mr-1.5 shrink-0" /> Strict 30-minute auto-expiry countdown</li>
            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mr-1.5 shrink-0" /> Exposes only life-saving subset (Blood, Allergies, Contacts)</li>
            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mr-1.5 shrink-0" /> Triggers immediate high-priority audit log entry</li>
          </ul>
        </div>

        {/* Pillar 4: FHIR Interoperability */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-purple-600 font-bold text-sm">
            <Database className="w-5 h-5" />
            <h3>4. FHIR R4 Interoperability</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All internal models map directly to standard HL7 FHIR R4 resources:
          </p>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <span className="p-1.5 bg-slate-50 border rounded text-slate-800 font-bold">Patient Resource</span>
            <span className="p-1.5 bg-slate-50 border rounded text-slate-800 font-bold">Observation (Vitals)</span>
            <span className="p-1.5 bg-slate-50 border rounded text-slate-800 font-bold">DiagnosticReport</span>
            <span className="p-1.5 bg-slate-50 border rounded text-slate-800 font-bold">MedicationRequest</span>
          </div>
        </div>

      </div>

    </div>
  );
};
