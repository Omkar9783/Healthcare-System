import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Shield, Stethoscope, HeartPulse, TestTube, Pill, User, AlertTriangle } from 'lucide-react';

export const DemoRoleSwitcher = () => {
  const { user, loginAsDemoRole, loading } = useAuth();

  const demoAccounts = [
    { role: 'ADMIN', email: 'admin@demo.health', label: 'Admin', icon: Shield, color: 'bg-purple-600 hover:bg-purple-700' },
    { role: 'DOCTOR', email: 'doctor@demo.health', label: 'Doctor', icon: Stethoscope, color: 'bg-sky-600 hover:bg-sky-700' },
    { role: 'NURSE', email: 'nurse@demo.health', label: 'Nurse', icon: HeartPulse, color: 'bg-teal-600 hover:bg-teal-700' },
    { role: 'LAB_TECHNICIAN', email: 'lab@demo.health', label: 'Lab Tech', icon: TestTube, color: 'bg-indigo-600 hover:bg-indigo-700' },
    { role: 'PHARMACIST', email: 'pharmacy@demo.health', label: 'Pharmacist', icon: Pill, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { role: 'PATIENT', email: 'patient@demo.health', label: 'Patient', icon: User, color: 'bg-blue-600 hover:bg-blue-700' },
    { role: 'EMERGENCY_STAFF', email: 'emergency@demo.health', label: 'Emergency', icon: AlertTriangle, color: 'bg-amber-600 hover:bg-amber-700' }
  ];

  return (
    <div className="bg-slate-900 text-white px-4 py-2 flex flex-wrap items-center justify-between border-b border-slate-800 shadow-md">
      <div className="flex items-center space-x-2 mr-3">
        <UserCheck className="w-4 h-4 text-sky-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Demo Role Switcher:</span>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center my-1 sm:my-0">
        {demoAccounts.map((acc) => {
          const Icon = acc.icon;
          const isCurrent = user?.email === acc.email;
          return (
            <button
              key={acc.role}
              disabled={loading || isCurrent}
              onClick={() => loginAsDemoRole(acc.email, acc.role)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${acc.color} text-white shadow-2xs ${
                isCurrent ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 opacity-100 font-extrabold' : 'opacity-85 hover:opacity-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{acc.label}</span>
              {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white ml-1"></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
