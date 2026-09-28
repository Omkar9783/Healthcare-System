import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, User as UserIcon, LogOut, Globe, Bell, QrCode, AlertTriangle } from 'lucide-react';

export const Navbar = ({ onOpenQRScanner, onOpenEmergency, onLoginClick }) => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationsList = [
    { id: 1, title: 'QR Scan Recorded', message: 'Dr. Amit Sharma scanned your healthcare QR card.', time: '10m ago' },
    { id: 2, title: 'Lab Report Ready', message: 'Complete Blood Count (CBC) test results are available.', time: '1h ago' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-bold text-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">MediSecure</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  FHIR Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Quick Actions & User Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Emergency Access Quick Button (For Doctors / Emergency Staff / Admin) */}
            {user && (user.role === 'EMERGENCY_STAFF' || user.role === 'DOCTOR' || user.role === 'ADMIN') && (
              <button
                onClick={onOpenEmergency}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-all shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="hidden md:inline">{t('emergency.title')}</span>
              </button>
            )}

            {/* QR Scanner Quick Trigger */}
            {user && user.role !== 'PATIENT' && (
              <button
                onClick={onOpenQRScanner}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-all shadow-sm shadow-sky-600/30"
              >
                <QrCode className="w-4 h-4" />
                <span>{t('nav.qrScanner')}</span>
              </button>
            )}

            {/* Language Switcher (EN | हिंदी | मराठी) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md transition-all ${lang === 'en' ? 'bg-white font-bold text-sky-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded-md transition-all ${lang === 'hi' ? 'bg-white font-bold text-sky-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLang('mr')}
                className={`px-2 py-1 rounded-md transition-all ${lang === 'mr' ? 'bg-white font-bold text-sky-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                मराठी
              </button>
            </div>

            {/* Notifications Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative transition-all"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="font-semibold text-xs text-slate-800">Notifications</span>
                      <span className="text-[10px] text-sky-600 font-medium">Mark all read</span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notificationsList.map(n => (
                        <div key={n.id} className="p-2 rounded-lg bg-slate-50 text-xs hover:bg-slate-100 transition-colors">
                          <p className="font-semibold text-slate-900">{n.title}</p>
                          <p className="text-slate-600 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 block mt-1">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Badge & Logout */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <div className="flex items-center space-x-1 justify-end">
                    <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                      {t(`roles.${user.role}`)}
                    </span>
                    {user.patientUid && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                        {user.patientUid}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs shadow-2xs">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-all shadow-xs"
              >
                {t('nav.login')}
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
