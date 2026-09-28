import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Calendar, 
  Heart, 
  ArrowRight, 
  Sparkles, 
  KeyRound, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Building,
  Stethoscope,
  Activity,
  Pill,
  Clock,
  ArrowLeft
} from 'lucide-react';

export const RegisterPage = ({ onLoginClick }) => {
  const { register, sendOtp, loading } = useAuth();

  // Registration step: 1 = Contact & OTP, 2 = Verify Code & Complete Details
  const [step, setStep] = useState(1);
  
  // Registration Role Type
  const [role, setRole] = useState('PATIENT'); // 'PATIENT', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN'
  const [otpChannel, setOtpChannel] = useState('SMS'); // 'SMS' or 'EMAIL'

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    dateOfBirth: '1995-05-15',
    bloodGroup: 'O+',
    address: '',
    hospital: 'MediSecure Super Specialty Hospital',
    department: 'General Medicine',
    specialization: 'Internal Medicine'
  });

  const [otp, setOtp] = useState('');
  const [otpDispatched, setOtpDispatched] = useState(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const [isOtpVerifiedClient, setIsOtpVerifiedClient] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Trigger OTP dispatch to chosen channel (Email or Mobile)
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const targetIdentifier = otpChannel === 'SMS' ? formData.phone : formData.email;
    if (!targetIdentifier || !targetIdentifier.trim()) {
      setError(`Please enter your ${otpChannel === 'SMS' ? '10-digit mobile number' : 'email address'} to receive the code.`);
      return;
    }

    if (otpChannel === 'SMS' && targetIdentifier.replace(/\D/g, '').length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (otpChannel === 'EMAIL' && !targetIdentifier.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setOtpSending(true);
    try {
      const res = await sendOtp({
        identifier: targetIdentifier,
        purpose: 'SIGNUP',
        channel: otpChannel,
        role
      });

      if (res.success) {
        setOtpDispatched(res);
        setOtpCountdown(60);
        setStep(2);
        setSuccessMsg(`Verification code generated and sent to your ${res.channel}!`);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setOtpSending(false);
    }
  };

  // Submit complete registration with verified OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email or mobile.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    const payload = {
      ...formData,
      role,
      otp: otp.trim()
    };

    const res = await register(payload);
    if (!res.success) {
      setError(res.message);
    } else {
      // Fire celebration confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Confetti fallback
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl w-full bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 mx-auto flex items-center justify-center text-slate-950 font-bold mb-3 shadow-lg shadow-teal-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Create MediSecure Identity</h2>
          <p className="text-xs text-slate-400 mt-1">
            First-time account registration with OTP verification on Email or Mobile
          </p>
        </div>

        {/* Role Type Selector: Patient vs Clinical Staff */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Account Type:
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setRole('PATIENT'); setError(''); }}
              className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                role === 'PATIENT'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Patient Account</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('DOCTOR'); setError(''); }}
              className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                role !== 'PATIENT'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Medical / Staff</span>
            </button>
          </div>

          {/* Sub-role selector for clinical staff */}
          {role !== 'PATIENT' && (
            <div className="mt-2.5 flex items-center space-x-1.5 overflow-x-auto p-1 bg-slate-950/50 rounded-xl border border-slate-800">
              {[
                { id: 'DOCTOR', label: 'Doctor', icon: Stethoscope },
                { id: 'NURSE', label: 'Nurse', icon: Activity },
                { id: 'PHARMACIST', label: 'Pharmacist', icon: Pill },
                { id: 'LAB_TECHNICIAN', label: 'Lab Tech', icon: Sparkles }
              ].map(sub => {
                const SubIcon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setRole(sub.id)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      role === sub.id
                        ? 'bg-slate-800 text-sky-400 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <SubIcon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              1
            </span>
            <span className={`text-xs font-semibold ${step === 1 ? 'text-white' : 'text-slate-400'}`}>
              Contact & OTP
            </span>
          </div>
          <div className="w-12 h-0.5 bg-slate-800"></div>
          <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </span>
            <span className={`text-xs font-semibold ${step === 2 ? 'text-white' : 'text-slate-400'}`}>
              Verify & Complete
            </span>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 rounded-xl border border-red-800/80 text-red-200 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-teal-950/60 rounded-xl border border-teal-800/80 text-teal-200 text-xs flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Simulated Incoming OTP Toast Notification */}
        {otpDispatched && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-teal-950/80 to-sky-950/80 border border-teal-500/40 text-xs shadow-lg animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-teal-800/40 mb-2">
              <span className="font-extrabold text-teal-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-400" />
                Simulated {otpDispatched.channel} Verification Code:
              </span>
              <span className="text-[10px] text-teal-400 font-mono bg-teal-900/60 px-2 py-0.5 rounded-full">
                Valid for 10m
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-[11px]">
                  Dispatched to: <span className="font-bold text-white font-mono">{otpDispatched.maskedIdentifier}</span>
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400">Security Code:</span>
                  <span className="px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-black text-sm tracking-widest border border-teal-400/40">
                    {otpDispatched.otp}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtp(otpDispatched.otp);
                  setSuccessMsg('Verification code autofilled!');
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Autofill Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Contact Details & OTP Channel */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Patil or Dr. Sarah Jenkins"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Verification Channel Choice */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Where should we send your first-time verification code?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOtpChannel('SMS')}
                  className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg text-xs font-bold border transition-all ${
                    otpChannel === 'SMS'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>SMS to Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOtpChannel('EMAIL')}
                  className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg text-xs font-bold border transition-all ${
                    otpChannel === 'EMAIL'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Code</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={otpSending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-black text-xs shadow-md shadow-teal-500/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <span>{otpSending ? 'Sending Verification Code...' : 'Get Verification Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        )}

        {/* Step 2: Enter OTP & Complete Profile */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* OTP Input with Resend */}
            <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                  Enter 6-Digit Verification Code
                </label>
                <button
                  type="button"
                  disabled={otpSending || otpCountdown > 0}
                  onClick={handleRequestOtp}
                  className="text-[11px] text-teal-400 hover:underline font-bold disabled:text-slate-500 flex items-center space-x-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>{otpCountdown > 0 ? `Resend (${otpCountdown}s)` : 'Resend Code'}</span>
                </button>
              </div>

              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full px-3 py-2.5 text-center text-lg font-mono font-black tracking-widest rounded-xl bg-slate-900 border border-slate-700 text-teal-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Set Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Create Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Role Specific Demographics */}
            {role === 'PATIENT' ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-2 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-2 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                    </input>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-2 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House/Street, City, State"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </>
            ) : (
              /* Staff specific fields */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Hospital / Clinic</label>
                  <input
                    type="text"
                    value={formData.hospital}
                    onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Department / Specialty</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Cardiology, Pediatrics"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <span>
                  {loading
                    ? 'Verifying & Generating UID...'
                    : role === 'PATIENT'
                    ? 'Verify & Generate Healthcare UID'
                    : `Verify & Register ${role}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

        {/* Sign In Link */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-teal-400 hover:underline font-bold"
            >
              Sign In with Email / Mobile
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
