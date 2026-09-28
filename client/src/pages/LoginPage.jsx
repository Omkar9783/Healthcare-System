import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  UserCheck, 
  Sparkles, 
  KeyRound, 
  Stethoscope, 
  User as UserIcon, 
  Activity, 
  Building2, 
  Pill, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Clock
} from 'lucide-react';

export const LoginPage = ({ onRegisterClick }) => {
  const { login, sendOtp, loginAsDemoRole, loading } = useAuth();
  
  // Active role portal selection
  const [selectedRole, setSelectedRole] = useState('DOCTOR'); // 'PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST'
  const [authMethod, setAuthMethod] = useState('password'); // 'password' or 'otp'
  
  // Credentials
  const [identifier, setIdentifier] = useState('doctor@demo.health');
  const [password, setPassword] = useState('password123');
  const [otp, setOtp] = useState('');
  
  // OTP dispatch state
  const [otpDispatched, setOtpDispatched] = useState(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Portals configuration
  const portals = [
    {
      id: 'PATIENT',
      name: 'Patient Portal',
      icon: UserIcon,
      badge: 'Public & Patient',
      theme: 'from-emerald-500 to-teal-500',
      activeColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
      btnColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
      ringColor: 'focus:ring-emerald-500',
      defaultEmail: 'patient@demo.health',
      defaultPhone: '9988776651',
      description: 'Access health records, digital QR identity & consent'
    },
    {
      id: 'DOCTOR',
      name: 'Physician / Doctor',
      icon: Stethoscope,
      badge: 'Clinical Staff',
      theme: 'from-sky-500 to-blue-500',
      activeColor: 'border-sky-500 text-sky-400 bg-sky-500/10',
      btnColor: 'bg-sky-500 hover:bg-sky-400 text-slate-950',
      ringColor: 'focus:ring-sky-500',
      defaultEmail: 'doctor@demo.health',
      defaultPhone: '9876543201',
      description: 'Review records, write prescriptions & scan patient QR'
    },
    {
      id: 'NURSE',
      name: 'Nursing Staff',
      icon: Activity,
      badge: 'Inpatient & Ward',
      theme: 'from-violet-500 to-indigo-500',
      activeColor: 'border-violet-500 text-violet-400 bg-violet-500/10',
      btnColor: 'bg-violet-500 hover:bg-violet-400 text-white',
      ringColor: 'focus:ring-violet-500',
      defaultEmail: 'nurse@demo.health',
      defaultPhone: '9876543204',
      description: 'Record patient vitals, bed management & triage'
    },
    {
      id: 'ADMIN',
      name: 'Hospital Admin',
      icon: Building2,
      badge: 'Governance & IT',
      theme: 'from-indigo-500 to-purple-500',
      activeColor: 'border-purple-500 text-purple-400 bg-purple-500/10',
      btnColor: 'bg-purple-500 hover:bg-purple-400 text-white',
      ringColor: 'focus:ring-purple-500',
      defaultEmail: 'admin@demo.health',
      defaultPhone: '9876543200',
      description: 'Audit logs, security compliance & staff management'
    },
    {
      id: 'PHARMACIST',
      name: 'Allied & Pharmacy',
      icon: Pill,
      badge: 'Pharmacy / Diagnostics',
      theme: 'from-amber-500 to-orange-500',
      activeColor: 'border-amber-500 text-amber-400 bg-amber-500/10',
      btnColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
      ringColor: 'focus:ring-amber-500',
      defaultEmail: 'pharmacy@demo.health',
      defaultPhone: '9876543207',
      description: 'Fulfill prescriptions, verify QR dispenses & lab tests'
    }
  ];

  const currentPortal = portals.find(p => p.id === selectedRole) || portals[1];

  // Auto-detect whether identifier is email or phone
  const isEmail = identifier.includes('@');

  // Change default credentials when switching role tab
  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    setSuccessMsg('');
    setOtpDispatched(null);
    setOtp('');
    const target = portals.find(p => p.id === roleId);
    if (target) {
      setIdentifier(target.defaultEmail);
      setPassword('password123');
    }
  };

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Request OTP for login
  const handleSendLoginOtp = async () => {
    setError('');
    setSuccessMsg('');
    if (!identifier) {
      setError('Please enter your registered email address or mobile number first.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await sendOtp({
        identifier,
        purpose: 'LOGIN',
        channel: isEmail ? 'EMAIL' : 'SMS',
        role: selectedRole
      });

      if (res.success) {
        setOtpDispatched(res);
        setOtpCountdown(60);
        setSuccessMsg(res.message);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (authMethod === 'otp') {
      if (!otp) {
        setError('Please enter the 6-digit verification code sent to your email or mobile.');
        return;
      }
      const res = await login({
        identifier,
        otp,
        role: selectedRole,
        authMethod: 'otp'
      });
      if (!res.success) {
        setError(res.message);
      }
    } else {
      const res = await login({
        identifier,
        password,
        role: selectedRole,
        authMethod: 'password'
      });
      if (!res.success) {
        setError(res.message);
      }
    }
  };

  // Preset demo accounts with both email and phone
  const presetUsers = [
    { role: 'DOCTOR', name: 'Dr. Amit Sharma', email: 'doctor@demo.health', phone: '9876543201', dept: 'Cardiology' },
    { role: 'PATIENT', name: 'Rahul Patil', email: 'patient@demo.health', phone: '9988776651', dept: 'PAT-2026-000001' },
    { role: 'NURSE', name: 'Nurse Priya Singh', email: 'nurse@demo.health', phone: '9876543204', dept: 'ICU / Cardiac' },
    { role: 'ADMIN', name: 'Dr. V. Rao', email: 'admin@demo.health', phone: '9876543200', dept: 'Hospital IT & Governance' },
    { role: 'PHARMACIST', name: 'Vikram Joshi', email: 'pharmacy@demo.health', phone: '9876543207', dept: 'Central Pharmacy' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl w-full bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentPortal.theme} mx-auto flex items-center justify-center text-slate-950 font-bold mb-3 shadow-lg transition-all duration-300`}>
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>MediSecure Healthcare Access</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Unified Multi-Role Authentication with Email & Mobile OTP</p>
        </div>

        {/* Role Portal Selector Tabs */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Select Your Healthcare Role Portal:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            {portals.map((portal) => {
              const Icon = portal.icon;
              const isSelected = selectedRole === portal.id;
              return (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => handleSelectRole(portal.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold transition-all ${
                    isSelected
                      ? `${portal.activeColor} shadow-sm border`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="truncate w-full text-center">{portal.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
          
          {/* Active Portal Info Banner */}
          <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-white">{currentPortal.name}</span>
              <span className="text-slate-400 hidden sm:inline">• {currentPortal.description}</span>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
              {currentPortal.badge}
            </span>
          </div>
        </div>

        {/* Authentication Mode Toggle: Password vs OTP */}
        <div className="flex items-center justify-center mb-5">
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => { setAuthMethod('password'); setError(''); }}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg font-bold transition-all ${
                authMethod === 'password'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Password Login</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('otp'); setError(''); }}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg font-bold transition-all ${
                authMethod === 'otp'
                  ? 'bg-slate-800 text-sky-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Mobile / Email OTP</span>
            </button>
          </div>
        </div>

        {/* Error and Success Banners */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 rounded-xl border border-red-800/80 text-red-200 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 rounded-xl border border-emerald-800/80 text-emerald-200 text-xs flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Simulated Incoming OTP Toast (Instant Testing) */}
        {otpDispatched && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/80 to-indigo-950/80 border border-sky-500/40 text-xs shadow-lg animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-sky-800/40 mb-2">
              <span className="font-extrabold text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Simulated {otpDispatched.channel} Dispatch:
              </span>
              <span className="text-[10px] text-sky-400 font-mono bg-sky-900/60 px-2 py-0.5 rounded-full">
                Valid for 10m
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-[11px]">
                  Sent to: <span className="font-bold text-white font-mono">{otpDispatched.maskedIdentifier}</span>
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400">Verification Code:</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-black text-sm tracking-widest border border-sky-400/30">
                    {otpDispatched.otp}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtp(otpDispatched.otp);
                  setSuccessMsg('Code copied into verification field!');
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Autofill Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email OR Mobile Number Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                Email Address or Mobile Number
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {isEmail ? '✉️ Email Mode' : '📱 Mobile Mode'}
              </span>
            </div>
            
            <div className="relative">
              {isEmail ? (
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              ) : (
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              )}
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="doctor@demo.health or 9876543201"
                className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${currentPortal.ringColor}`}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Tip: You can enter either your full email or 10-digit mobile number
            </p>
          </div>

          {/* Conditional Credential Field: Password OR OTP */}
          {authMethod === 'password' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setAuthMethod('otp')}
                  className="text-[11px] text-sky-400 hover:underline"
                >
                  Forgot password? Use OTP
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${currentPortal.ringColor}`}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">
                  6-Digit Verification Code (OTP)
                </label>
                <button
                  type="button"
                  disabled={otpLoading || otpCountdown > 0}
                  onClick={handleSendLoginOtp}
                  className="text-[11px] text-sky-400 hover:underline font-bold disabled:text-slate-500 flex items-center space-x-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : 'Send Code'}
                  </span>
                </button>
              </div>

              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-mono tracking-widest rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${currentPortal.ringColor}`}
                  />
                </div>
                {!otpDispatched && (
                  <button
                    type="button"
                    disabled={otpLoading}
                    onClick={handleSendLoginOtp}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold border border-slate-700 transition-all shrink-0"
                  >
                    {otpLoading ? 'Sending...' : 'Get Code'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl ${currentPortal.btnColor} font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5`}
          >
            <span>
              {loading
                ? 'Authenticating...'
                : `Sign In to ${currentPortal.name}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Switcher Section */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 flex items-center">
              <UserCheck className="w-3.5 h-3.5 text-sky-400 mr-1.5" />
              1-Click Demo Accounts (Email & Mobile No):
            </p>
            <span className="text-[10px] text-slate-500">Auto-fills credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presetUsers.map((u) => (
              <button
                key={u.role}
                type="button"
                onClick={() => {
                  setSelectedRole(u.role);
                  setIdentifier(u.email);
                  setPassword('password123');
                  setAuthMethod('password');
                  loginAsDemoRole(u.email, u.role);
                }}
                className="flex flex-col text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all text-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white group-hover:text-sky-300 transition-colors">
                    {u.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {u.role}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                  <span>✉️ {u.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                  <span>📱 {u.phone}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Link to Register */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            First time using MediSecure?{' '}
            <button
              type="button"
              onClick={onRegisterClick}
              className="text-sky-400 hover:underline font-bold"
            >
              Sign Up with Email / Mobile OTP
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
