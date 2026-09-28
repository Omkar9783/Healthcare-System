import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  FileText, 
  Pill, 
  FlaskConical, 
  Calendar, 
  Lock, 
  AlertTriangle, 
  ShieldAlert, 
  Sliders, 
  ShieldCheck,
  Landmark
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const role = user.role;

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST', 'PATIENT', 'EMERGENCY_STAFF'] },
    { id: 'government-schemes', label: t('nav.governmentSchemes'), icon: Landmark, roles: ['ADMIN', 'PATIENT', 'DOCTOR'] },
    { id: 'patients', label: t('nav.patients'), icon: Users, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST'] },
    { id: 'qr-scanner', label: t('nav.qrScanner'), icon: QrCode, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST', 'EMERGENCY_STAFF'] },
    { id: 'medical-records', label: t('nav.medicalRecords'), icon: FileText, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
    { id: 'prescriptions', label: t('nav.prescriptions'), icon: Pill, roles: ['ADMIN', 'DOCTOR', 'PHARMACIST', 'PATIENT'] },
    { id: 'lab-reports', label: t('nav.labReports'), icon: FlaskConical, roles: ['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'PATIENT'] },
    { id: 'appointments', label: t('nav.appointments'), icon: Calendar, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
    { id: 'consent', label: t('nav.privacyConsent'), icon: Lock, roles: ['ADMIN', 'PATIENT', 'DOCTOR'] },
    { id: 'emergency', label: t('nav.emergency'), icon: AlertTriangle, roles: ['ADMIN', 'EMERGENCY_STAFF', 'DOCTOR', 'PATIENT'] },
    { id: 'audit-logs', label: t('nav.auditLogs'), icon: ShieldAlert, roles: ['ADMIN', 'PATIENT'] },
    { id: 'admin', label: t('nav.admin'), icon: Sliders, roles: ['ADMIN'] },
    { id: 'security', label: t('nav.security'), icon: ShieldCheck, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST', 'PATIENT', 'EMERGENCY_STAFF'] }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      
      {/* User Role Card */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 font-bold">
            {role.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider">{t(`roles.${role}`)}</p>
            <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950/30">
        <div className="flex items-center justify-between">
          <span>Backend RBAC</span>
          <span className="flex items-center text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Enforced
          </span>
        </div>
      </div>

    </aside>
  );
};
