import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch, documentApi } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Landmark, 
  CreditCard, 
  ShieldCheck, 
  Users, 
  Building2, 
  Pill, 
  Bot, 
  QrCode, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  Search, 
  Phone, 
  MapPin, 
  FileText, 
  Send, 
  Sparkles, 
  Copy, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Upload, 
  Calendar,
  Heart,
  ChevronRight,
  Shield,
  Clock,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { GovernmentSchemeAssistant } from './GovernmentSchemeAssistant';

export const GovernmentSchemesView = ({ onSelectTab }) => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  // Active module tab
  const [activeSubTab, setActiveSubTab] = useState('ration-card'); // 'ration-card', 'eligibility', 'family', 'packages', 'hospitals', 'ai-assistant', 'my-qr', 'notifications'

  // Data states
  const [schemeData, setSchemeData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Alerts & Toast messages
  const [alert, setAlert] = useState(null);
  const [isAiScanningRation, setIsAiScanningRation] = useState(false);
  const [docVerificationMode, setDocVerificationMode] = useState('aadhaar'); // 'aadhaar' or 'ration'
  const [isAiScanningAadhaar, setIsAiScanningAadhaar] = useState(false);
  const [aadhaarForm, setAadhaarForm] = useState({
    aadhaarNumber: 'XXXX-XXXX-1234',
    name: user?.name || 'Rahul Patil',
    dob: '1988-04-12',
    gender: 'Male',
    state: 'Maharashtra',
    uploadedFileName: ''
  });

  // 1. Ration Card Form State
  const [rationForm, setRationForm] = useState({
    rationCardNumber: 'MH-RC-889921',
    state: 'Maharashtra',
    district: 'Mumbai',
    rationCardType: 'Yellow',
    headOfFamilyName: user?.name || 'Rahul Patil',
    mobileNumber: user?.phone || '9988776651',
    familyMembersCount: 4,
    uploadedFileName: 'Ration_Card_Scan_2026.pdf'
  });

  // 2. Family Member Modal State
  const [isAddFamilyOpen, setIsAddFamilyOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: 'Spouse',
    age: '',
    gender: 'Female',
    bloodGroup: 'O+',
    mobileNumber: '',
    beneficiaryId: '',
    linkedPatientId: ''
  });
  const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);

  // 3. Hospital Search & Filters
  const [hospitalFilters, setHospitalFilters] = useState({
    scheme: 'All',
    district: 'All',
    specialty: 'All',
    search: ''
  });
  const [hospitalDeskModal, setHospitalDeskModal] = useState(null); // Hospital to request verification from

  // 4. Package Search & Filters
  const [packageFilters, setPackageFilters] = useState({
    scheme: 'All',
    category: 'All',
    search: ''
  });

  // 5. AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: lang === 'mr' 
        ? 'नमस्कार! मी तुमचा शासकीय आरोग्य योजना (MJPJAY आणि PM-JAY) साहाय्यक आहे. मी तुम्हाला रेशन कार्ड पात्रता, आवश्यक कागदपत्रे, मोफत उपचार पॅकेज आणि अंगीकृत रुग्णालयांबद्दल माहिती देऊ शकतो. मी तुम्हाला कशी मदत करू?'
        : lang === 'hi'
        ? 'नमस्ते! मैं आपका सरकारी स्वास्थ्य योजना (MJPJAY और PM-JAY) सहायक हूँ। मैं राशन कार्ड पात्रता, आवश्यक दस्तावेज, कैशलेस इलाज पैकेज और मान्यता प्राप्त अस्पतालों के बारे में जानकारी दे सकता हूँ। मैं आपकी क्या मदद कर सकता हूँ?'
        : 'Hello! I am your AI Government Health Scheme & Benefit Assistant. I can help you understand your MJPJAY and PM-JAY eligibility, required documents, covered treatments (like dialysis and cardiac care), and empanelled hospitals. How can I assist you today?',
      disclaimer: 'Preliminary Eligibility Check – Final eligibility must be verified through the official government portal or authorized hospital.'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    loadAllSchemeData();
  }, [user]);

  const loadAllSchemeData = async () => {
    try {
      setLoading(true);
      const patientUid = user?.patientUid || 'PAT-2026-000001';
      
      const [patientRes, hospRes, pkgRes] = await Promise.all([
        apiFetch(`/schemes/patient/${patientUid}`),
        apiFetch('/schemes/hospitals'),
        apiFetch('/schemes/packages')
      ]);

      if (patientRes.success) {
        setSchemeData(patientRes);
        if (patientRes.rationCard) {
          setRationForm(prev => ({
            ...prev,
            rationCardNumber: patientRes.rationCard.maskedRationCardNumber,
            rationCardType: patientRes.rationCard.rationCardType,
            headOfFamilyName: patientRes.rationCard.headOfFamilyName,
            state: patientRes.rationCard.state,
            district: patientRes.rationCard.district,
            familyMembersCount: patientRes.rationCard.familyMembersCount
          }));
        }
      }

      if (hospRes.success) setHospitals(hospRes.hospitals || []);
      if (pkgRes.success) setPackages(pkgRes.packages || []);
    } catch (err) {
      console.error('Failed to load scheme data:', err);
      showAlert('error', 'Failed to load government scheme information.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Submit Ration Card Form
  const handleVerifyRationCard = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiFetch('/schemes/verify-ration-card', {
        method: 'POST',
        body: JSON.stringify({
          patientId: user?.patientUid || 'PAT-2026-000001',
          ...rationForm,
          documentUrl: rationForm.uploadedFileName ? `https://documents.medisecure.local/${rationForm.uploadedFileName}` : ''
        })
      });

      if (res.success) {
        showAlert('success', 'Ration card verified! Preliminary eligibility computed successfully.');
        await loadAllSchemeData();
        setActiveSubTab('eligibility');
      } else {
        showAlert('error', res.message || 'Verification failed.');
      }
    } catch (err) {
      showAlert('error', err.message || 'Error verifying ration card.');
    } finally {
      setSubmitting(false);
    }
  };

  // AI-Powered Ration Card Photo Scan & Auto-Fetch Health Schemes
  const handleAiScanRationCard = async (file) => {
    if (!file) return;
    try {
      setIsAiScanningRation(true);
      showAlert('info', 'AI is scanning ration card photo (YOLO11 + OCR) and fetching eligible schemes...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_hint', 'ration');
      formData.append('side', 'front');
      formData.append('patientUid', user?.patientUid || 'PAT-2026-000001');

      const res = await documentApi.verify(formData);
      if (res.success && res.data) {
        const extracted = res.data.extractedData || {};
        const cardType = extracted.cardType || 'Orange';
        const maskedNum = res.data.maskedIdNumber || 'RC-XXXX-XXXX-4512';
        const headName = extracted.name || user?.name || 'Beneficiary';
        const district = extracted.district || 'Mumbai';
        const count = extracted.familyMembersCount || 4;

        setRationForm(prev => ({
          ...prev,
          rationCardNumber: maskedNum,
          rationCardType: cardType,
          headOfFamilyName: headName,
          district: district,
          familyMembersCount: count,
          uploadedFileName: file.name
        }));

        showAlert('success', `🎉 Ration card scanned! Detected ${cardType} card for ${headName}. Health schemes retrieved!`);

        // Refresh scheme dashboard and switch to eligibility view
        await loadAllSchemeData();
        setTimeout(() => {
          setActiveSubTab('eligibility');
        }, 1200);
      } else {
        showAlert('error', res.message || 'AI document verification could not read ration card.');
      }
    } catch (err) {
      console.error('Error scanning ration card:', err);
      showAlert('error', err.message || 'Failed to scan ration card photo.');
    } finally {
      setIsAiScanningRation(false);
    }
  };

  // AI-Powered Aadhaar Card Photo Scan & Auto-Fetch Health Schemes
  const handleAiScanAadhaarCard = async (file) => {
    if (!file) return;
    try {
      setIsAiScanningAadhaar(true);
      showAlert('info', 'AI is scanning Aadhaar card (YOLO11 + OCR) and unlocking eligible central & state health schemes...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_hint', 'aadhaar');
      formData.append('side', 'front');
      formData.append('patientUid', user?.patientUid || 'PAT-2026-000001');

      const res = await documentApi.verify(formData);
      if (res.success && res.data) {
        const extracted = res.data.extractedData || {};
        const maskedNum = res.data.maskedIdNumber || 'XXXX-XXXX-9921';
        const name = extracted.name || user?.name || 'Beneficiary';
        const dob = extracted.dob || '1988-04-12';
        const gender = extracted.gender || 'Male';
        const state = extracted.state || 'Maharashtra';

        setAadhaarForm({
          aadhaarNumber: maskedNum,
          name,
          dob,
          gender,
          state,
          uploadedFileName: file.name
        });

        showAlert('success', `🎉 Aadhaar verified! Extracted ${name} (${gender}, ${state}). Unlocked PM-JAY, ABHA, and MJPJAY 2.0 schemes!`);

        // Refresh scheme dashboard and switch to eligibility view
        await loadAllSchemeData();
        setTimeout(() => {
          setActiveSubTab('eligibility');
        }, 1200);
      } else {
        showAlert('error', res.message || 'AI document verification could not read Aadhaar card.');
      }
    } catch (err) {
      console.error('Error scanning Aadhaar card:', err);
      showAlert('error', err.message || 'Failed to scan Aadhaar card.');
    } finally {
      setIsAiScanningAadhaar(false);
    }
  };

  // Add Family Member
  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiFetch('/schemes/family', {
        method: 'POST',
        body: JSON.stringify({
          patientId: user?.patientUid || 'PAT-2026-000001',
          ...newMember
        })
      });

      if (res.success) {
        showAlert('success', `Added ${newMember.name} to family health profile.`);
        setIsAddFamilyOpen(false);
        setNewMember({
          name: '',
          relationship: 'Spouse',
          age: '',
          gender: 'Female',
          bloodGroup: 'O+',
          mobileNumber: '',
          beneficiaryId: '',
          linkedPatientId: ''
        });
        await loadAllSchemeData();
      } else {
        showAlert('error', res.message || 'Failed to add family member.');
      }
    } catch (err) {
      showAlert('error', err.message || 'Error adding family member.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Family Member
  const handleDeleteFamilyMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this family member from scheme coverage?')) return;
    try {
      const res = await apiFetch(`/schemes/family/${memberId}`, { method: 'DELETE' });
      if (res.success) {
        showAlert('success', 'Family member removed.');
        await loadAllSchemeData();
      }
    } catch (err) {
      showAlert('error', err.message || 'Failed to remove member.');
    }
  };

  // Submit Hospital Desk Verification Request
  const handleSubmitHospitalDeskRequest = async (hospital) => {
    try {
      setSubmitting(true);
      const res = await apiFetch('/schemes/hospital-verification-request', {
        method: 'POST',
        body: JSON.stringify({
          patientId: user?.patientUid || 'PAT-2026-000001',
          patientName: user?.name,
          patientPhone: user?.phone,
          hospitalId: hospital.hospitalId,
          hospitalName: hospital.hospitalName,
          schemeName: hospital.schemes?.[0] || 'MJPJAY',
          treatmentCategory: hospital.specialties?.[0] || 'General Healthcare'
        })
      });

      if (res.success) {
        showAlert('success', `Verification request submitted to ${hospital.hospitalName}. Arogya Mitra desk notified!`);
        setHospitalDeskModal(null);
        await loadAllSchemeData();
      } else {
        showAlert('error', res.message || 'Failed to submit verification request.');
      }
    } catch (err) {
      showAlert('error', err.message || 'Submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  // AI Assistant Chat Send
  const handleSendAiPrompt = async (promptText) => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim()) return;

    const userMessage = { sender: 'user', text: textToSend };
    setChatMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setAiLoading(true);

    try {
      const res = await apiFetch('/schemes/ai-assist', {
        method: 'POST',
        body: JSON.stringify({
          prompt: textToSend,
          patientUid: user?.patientUid || 'PAT-2026-000001',
          language: lang
        })
      });

      if (res.success) {
        const aiMessage = {
          sender: 'ai',
          text: res.response,
          disclaimer: res.disclaimer,
          isMedicalGuardrail: res.isMedicalGuardrail
        };
        setChatMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Unable to reach the assistant service right now. Please verify details through official portals.',
          disclaimer: 'Preliminary Eligibility Check – Final eligibility must be verified through the official government portal or authorized hospital.'
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Dismiss notification
  const handleMarkNotificationRead = async (notifId) => {
    try {
      await apiFetch(`/schemes/notifications/${notifId}/read`, { method: 'PATCH' });
      await loadAllSchemeData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
        <h3 className="font-extrabold text-slate-800 text-sm">Loading Government Health Schemes & Eligibility...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to state MJPJAY & PM-JAY registries</p>
      </div>
    );
  }

  const rationCard = schemeData?.rationCard;
  const eligibilities = schemeData?.eligibilities || [];
  const familyMembers = schemeData?.familyMembers || [];
  const notifications = schemeData?.notifications || [];
  const verificationRequests = schemeData?.verificationRequests || [];
  const unreadNotifsCount = notifications.filter(n => !n.readStatus).length;

  // Filtered Hospitals
  const filteredHospitals = hospitals.filter(h => {
    if (hospitalFilters.scheme !== 'All' && !h.schemes.includes(hospitalFilters.scheme)) return false;
    if (hospitalFilters.district !== 'All' && h.district !== hospitalFilters.district) return false;
    if (hospitalFilters.specialty !== 'All' && !h.specialties.includes(hospitalFilters.specialty)) return false;
    if (hospitalFilters.search) {
      const q = hospitalFilters.search.toLowerCase();
      return h.hospitalName.toLowerCase().includes(q) || h.address.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Packages
  const filteredPackages = packages.filter(p => {
    if (packageFilters.scheme !== 'All' && p.schemeName !== packageFilters.scheme && p.schemeName !== 'Both') return false;
    if (packageFilters.category !== 'All' && p.category !== packageFilters.category) return false;
    if (packageFilters.search) {
      const q = packageFilters.search.toLowerCase();
      return p.packageName.toLowerCase().includes(q) || p.coverageDetails.toLowerCase().includes(q) || p.packageCode.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {alert && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in duration-200 ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2">
            {alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-700">&times;</button>
        </div>
      )}

      {/* Module Banner Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-200 text-xs font-bold mb-3 backdrop-blur-md">
              <Landmark className="w-4 h-4 text-emerald-300" />
              <span>MJPJAY 2.0 & Ayushman Bharat PM-JAY Assistance</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Government Health Scheme & Ration Card Assistance
            </h1>
            
            <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
              Verify your ration card, review eligibility for up to ₹5,00,000 in cashless healthcare coverage, locate empanelled super-specialty hospitals, and receive AI assistance.
            </p>
          </div>

          {/* Quick Beneficiary Stats Pill */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md shrink-0 flex items-center space-x-4">
            <div>
              <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider block">Ration Card Status</span>
              <span className="font-extrabold text-base text-white flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                {rationCard ? `${rationCard.rationCardType} Card` : 'Unverified'}
              </span>
              <span className="text-[10px] text-emerald-200 font-mono">
                {rationCard ? rationCard.maskedRationCardNumber : 'Submit details below'}
              </span>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div>
              <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider block">Max Scheme Benefit</span>
              <span className="font-extrabold text-lg text-emerald-300">₹5,00,000</span>
              <span className="text-[10px] text-emerald-200 block">Floater / Family / Year</span>
            </div>
          </div>
        </div>

        {/* Mandatory Official Disclaimer Banner */}
        <div className="mt-5 pt-4 border-t border-white/15 flex items-start space-x-2.5 text-xs text-emerald-100/90 bg-emerald-950/30 p-3 rounded-xl border border-white/10">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">
            <strong className="text-amber-200 font-bold">Important Notice: </strong>
            Preliminary Eligibility Check – Final eligibility must be verified through the official government portal or authorized hospital.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center space-x-1.5 min-w-max">
          {[
            { id: 'gov-assistant', label: 'Scheme Recommendation & Form Assistant', icon: Sparkles, isSpecial: true },
            { id: 'ration-card', label: 'Verify Ration Card', icon: CreditCard },
            { id: 'eligibility', label: 'Scheme Eligibility', icon: ShieldCheck },
            { id: 'family', label: 'My Family', icon: Users, badge: familyMembers.length },
            { id: 'hospitals', label: 'Find Hospitals', icon: Building2, badge: hospitals.length },
            { id: 'packages', label: 'Covered Treatments', icon: Pill, badge: packages.length },
            { id: 'ai-assistant', label: 'Scheme Assistant', icon: Bot, isSpecial: true },
            { id: 'my-qr', label: 'My Scheme QR', icon: QrCode },
            { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : null }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.isSpecial ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 0: AI GOVERNMENT SCHEME RECOMMENDATION & AUTO-FILL ASSISTANT */}
      {/* ========================================================== */}
      {activeSubTab === 'gov-assistant' && (
        <GovernmentSchemeAssistant />
      )}

      {/* ========================================================== */}
      {/* TAB 1: RATION CARD VERIFICATION */}
      {/* ========================================================== */}
      {activeSubTab === 'ration-card' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Verification Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Ration Card / Beneficiary Verification
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify your household ration card to calculate preliminary scheme benefits
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Data Protected
              </span>
            </div>

            {/* Document Verification Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setDocVerificationMode('aadhaar')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  docVerificationMode === 'aadhaar'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Aadhaar Card e-KYC</span>
              </button>
              <button
                type="button"
                onClick={() => setDocVerificationMode('ration')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  docVerificationMode === 'ration'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Maharashtra Ration Card</span>
              </button>
            </div>

            {/* AADHAAR CARD E-KYC SECTION */}
            {docVerificationMode === 'aadhaar' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50/80 via-emerald-50/80 to-teal-50/80 border-2 border-dashed border-sky-300 hover:border-sky-500 transition-colors">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
                        {isAiScanningAadhaar ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-sky-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Upload &amp; AI Scan Aadhaar Card Photo</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-sky-200 text-sky-900 uppercase">
                            UIDAI &bull; YOLO11 &bull; OCR
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Upload front or back photo to detect identity, age, gender, and unlock all linked health schemes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs cursor-pointer shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all">
                        {isAiScanningAadhaar ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>AI Scan Aadhaar</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={isAiScanningAadhaar}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleAiScanAadhaarCard(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {aadhaarForm.uploadedFileName && (
                    <div className="mt-3 text-[11px] text-sky-900 font-medium flex items-center justify-between bg-white/80 p-2 rounded-lg border border-sky-200">
                      <div className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>Scanned Document: {aadhaarForm.uploadedFileName}</span>
                      </div>
                      <span className="font-bold text-sky-700">Verified &bull; {aadhaarForm.aadhaarNumber}</span>
                    </div>
                  )}
                </div>

                {/* Aadhaar Demographics Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Masked Aadhaar Number</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{aadhaarForm.aadhaarNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Beneficiary Name</span>
                    <span className="font-bold text-slate-800">{aadhaarForm.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Birth / Gender</span>
                    <span className="font-semibold text-slate-700">{aadhaarForm.dob} &bull; {aadhaarForm.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">State / Domicile</span>
                    <span className="font-semibold text-slate-700">{aadhaarForm.state}</span>
                  </div>
                </div>

                {/* Schemes Unlocked Notice */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-950 font-medium">
                      Aadhaar unlocks <strong>PM-JAY</strong> (₹5L Cover), <strong>ABHA Digital ID</strong>, <strong>MJPJAY 2.0</strong>, and demographic benefits.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('eligibility')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shrink-0"
                  >
                    View Schemes
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleVerifyRationCard} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ration Card Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rationForm.rationCardNumber}
                    onChange={(e) => setRationForm({ ...rationForm, rationCardNumber: e.target.value })}
                    placeholder="e.g. MH-RC-889921 or 12-digit number"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Ration card number will be automatically masked as XXXX-XXXX-1234
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ration Card Type / Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rationForm.rationCardType}
                    onChange={(e) => setRationForm({ ...rationForm, rationCardType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Yellow">Yellow (BPL - Below Poverty Line)</option>
                    <option value="Orange">Orange (Priority Household / Low-Income)</option>
                    <option value="White">White (Non-Priority Household)</option>
                    <option value="Antyodaya (AAY)">Antyodaya (AAY - Poorest of Poor)</option>
                    <option value="Annapurna">Annapurna (Destitute Senior Citizens)</option>
                    <option value="Other">Other State Category</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rationForm.state}
                    onChange={(e) => setRationForm({ ...rationForm, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Maharashtra">Maharashtra (MJPJAY & PM-JAY)</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Goa">Goa</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Other">Other State</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rationForm.district}
                    onChange={(e) => setRationForm({ ...rationForm, district: e.target.value })}
                    placeholder="e.g. Mumbai, Pune, Nagpur, Thane"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Head of Family Name (As in Ration Card) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rationForm.headOfFamilyName}
                    onChange={(e) => setRationForm({ ...rationForm, headOfFamilyName: e.target.value })}
                    placeholder="Full name as printed on card"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Family Members
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={rationForm.familyMembersCount}
                    onChange={(e) => setRationForm({ ...rationForm, familyMembersCount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* AI-Powered Upload & Scan Ration Card Document */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-colors">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                      {isAiScanningRation ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Upload &amp; AI Scan Ration Card Photo</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-200 text-emerald-900 uppercase">
                          YOLO11 + OCR
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Upload photo to auto-detect card color, extract details, and fetch health schemes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all">
                      {isAiScanningRation ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>AI Scan Photo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isAiScanningRation}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleAiScanRationCard(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {rationForm.uploadedFileName && (
                  <div className="mt-3 text-[11px] text-emerald-800 font-medium flex items-center justify-between bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Scanned Document: {rationForm.uploadedFileName}</span>
                    </div>
                    <span className="font-bold text-emerald-700">Verified &bull; {rationForm.rationCardType} Card</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2"
              >
                <span>{submitting ? 'Verifying with Department Database...' : 'Submit & Calculate Scheme Eligibility'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
            )}
          </div>

          {/* Right Column: Verified Card Summary Card */}
          <div className="lg:col-span-1 space-y-4">
            
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Beneficiary Identity</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  rationCard?.verificationStatus === 'Verified' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {rationCard ? rationCard.verificationStatus : 'Pending Verification'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 block">Masked Ration Card Number</span>
                  <span className="font-mono text-lg font-black tracking-widest text-emerald-400">
                    {rationCard ? rationCard.maskedRationCardNumber : 'XXXX-XXXX-NOT-SET'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Card Type</span>
                    <span className="font-bold text-white">{rationCard ? rationCard.rationCardType : 'Yellow (BPL)'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">State</span>
                    <span className="font-bold text-white">{rationCard ? rationCard.state : 'Maharashtra'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Head of Family</span>
                    <span className="font-bold text-white">{rationCard ? rationCard.headOfFamilyName : user?.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Covered Members</span>
                    <span className="font-bold text-white">{rationCard ? rationCard.familyMembersCount : 4} Members</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  <span>Verification Date: {rationCard?.verifiedAt ? new Date(rationCard.verifiedAt).toLocaleDateString() : 'Pending'}</span>
                </div>
              </div>
            </div>

            {/* Privacy Guarantee Card */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs space-y-2 text-emerald-950">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span>Ration Card Privacy Guard</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Raw ration numbers are cryptographic hashed (SHA-256). Only masked digits (XXXX-XXXX-1234) are displayed to staff and patient interfaces.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: SCHEME ELIGIBILITY */}
      {/* ========================================================== */}
      {activeSubTab === 'eligibility' && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Check My Scheme Eligibility</h2>
              <p className="text-xs text-slate-500">
                Automated cross-check against Maharashtra MJPJAY and Central Ayushman Bharat criteria
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('ai-assistant')}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold hover:bg-teal-100 transition-all"
            >
              <Bot className="w-4 h-4 text-teal-600" />
              <span>Ask AI About Eligibility</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eligibilities.map((scheme) => (
              <div
                key={scheme._id || scheme.schemeName}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                        {scheme.schemeName === 'MJPJAY' ? 'State Government' : 'Central Government'}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1">
                        {scheme.schemeFullName}
                      </h3>
                    </div>

                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full shrink-0 flex items-center gap-1.5 ${
                      scheme.eligibilityStatus === 'Potentially Eligible'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {scheme.eligibilityStatus}
                    </span>
                  </div>

                  <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Eligibility Evaluation Reason:</span>
                    <p className="text-xs text-slate-800 font-medium mt-0.5">
                      {scheme.eligibilityReason}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-500">Coverage Limit</span>
                      <span className="font-extrabold text-emerald-700">{scheme.coverageAmount}</span>
                    </div>

                    <div className="text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-500 block mb-1">Required Documents</span>
                      <div className="flex flex-wrap gap-1">
                        {scheme.requiredDocuments?.map((doc, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            ✓ {doc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs py-1">
                      <span className="text-slate-500 block mb-1">Covered Care Highlights</span>
                      <ul className="space-y-0.5 text-[11px] text-slate-600">
                        {scheme.benefits?.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  <a
                    href={scheme.officialPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs text-center flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                  >
                    <span>Check Official Eligibility</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setActiveSubTab('hospitals')}
                    className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs transition-all border border-emerald-200"
                  >
                    Find Hospitals
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Verification Request Status Callout */}
          {verificationRequests.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                Submitted Hospital Scheme Desk Verification Requests
              </h3>
              <div className="space-y-2">
                {verificationRequests.map(req => (
                  <div key={req._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{req.hospitalName} ({req.schemeName})</p>
                      <p className="text-[11px] text-slate-500">Remarks: {req.remarks}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold self-start sm:self-auto ${
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: MY FAMILY HEALTH PROFILES */}
      {/* ========================================================== */}
      {activeSubTab === 'family' && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Family Health Profiles</h2>
              <p className="text-xs text-slate-500">
                Manage dependents and household members covered under family floater scheme benefits
              </p>
            </div>
            
            <button
              onClick={() => setIsAddFamilyOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Family Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Primary Patient Card */}
            <div className="bg-gradient-to-tr from-sky-950 to-slate-900 text-white rounded-2xl p-5 border border-sky-800 shadow-md">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold text-sky-300 uppercase">Head of Household (Primary)</span>
                  <h3 className="font-black text-sm text-white">{user?.name}</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                  Primary
                </span>
              </div>
              <div className="text-xs space-y-1 text-slate-300 mt-3">
                <p>UID: <span className="font-mono text-white font-bold">{user?.patientUid || 'PAT-2026-000001'}</span></p>
                <p>Scheme Status: <span className="text-emerald-300 font-bold">Covered (MJPJAY / PM-JAY)</span></p>
              </div>
            </div>

            {/* Associated Family Members */}
            {familyMembers.map((member) => (
              <div key={member._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{member.relationship}</span>
                      <h3 className="font-extrabold text-sm text-slate-900">{member.name}</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {member.schemeStatus}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 mt-2">
                    <p>Age / Gender: <span className="font-bold text-slate-800">{member.age} yrs • {member.gender}</span></p>
                    <p>Blood Group: <span className="font-bold text-slate-800">{member.bloodGroup}</span></p>
                    {member.beneficiaryId && (
                      <p>Beneficiary ID: <span className="font-mono text-slate-700">{member.beneficiaryId}</span></p>
                    )}
                    {member.linkedPatientId && (
                      <p>Linked UID: <span className="font-mono text-sky-600 font-bold">{member.linkedPatientId}</span></p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedMemberProfile(member)}
                    className="text-[11px] font-bold text-sky-600 hover:underline"
                  >
                    View Health Profile
                  </button>

                  <button
                    onClick={() => handleDeleteFamilyMember(member._id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

          </div>

          {/* Add Family Member Modal */}
          {isAddFamilyOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Add Family Household Member
                  </h3>
                  <button onClick={() => setIsAddFamilyOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
                </div>

                <form onSubmit={handleAddFamilyMember} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      placeholder="e.g. Sunita Patil"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                      <select
                        value={newMember.relationship}
                        onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                      >
                        {['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="120"
                        value={newMember.age}
                        onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                        placeholder="e.g. 34"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={newMember.gender}
                        onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={newMember.bloodGroup}
                        onChange={(e) => setNewMember({ ...newMember, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Govt Beneficiary ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={newMember.beneficiaryId}
                      onChange={(e) => setNewMember({ ...newMember, beneficiaryId: e.target.value })}
                      placeholder="e.g. MH-PMJAY-9921"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Existing Patient UID in System (Optional)
                    </label>
                    <input
                      type="text"
                      value={newMember.linkedPatientId}
                      onChange={(e) => setNewMember({ ...newMember, linkedPatientId: e.target.value })}
                      placeholder="e.g. PAT-2026-000002"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddFamilyOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm"
                    >
                      {submitting ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Member Profile Modal Preview */}
          {selectedMemberProfile && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900">{selectedMemberProfile.name}</h3>
                  <button onClick={() => setSelectedMemberProfile(null)} className="text-slate-400 hover:text-slate-700">&times;</button>
                </div>
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p>Relationship: <span className="font-bold text-slate-800">{selectedMemberProfile.relationship}</span></p>
                  <p>Age: <span className="font-bold text-slate-800">{selectedMemberProfile.age} yrs ({selectedMemberProfile.gender})</span></p>
                  <p>Blood Group: <span className="font-bold text-slate-800">{selectedMemberProfile.bloodGroup}</span></p>
                  <p>Scheme Coverage: <span className="text-emerald-700 font-bold">Covered under Family Floater (Up to ₹5,00,000)</span></p>
                  {selectedMemberProfile.beneficiaryId && (
                    <p>Government ID: <span className="font-mono text-slate-800">{selectedMemberProfile.beneficiaryId}</span></p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedMemberProfile(null)}
                  className="w-full mt-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: FIND SCHEME HOSPITALS */}
      {/* ========================================================== */}
      {activeSubTab === 'hospitals' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Find Scheme Empanelled Hospitals</h2>
              <p className="text-xs text-slate-500">
                Locate accredited public and private centers providing cashless MJPJAY & PM-JAY treatment
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {filteredHospitals.length} Hospitals Found
            </span>
          </div>

          {/* Search & Filters */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={hospitalFilters.search}
                onChange={(e) => setHospitalFilters({ ...hospitalFilters, search: e.target.value })}
                placeholder="Search hospital name, address, or specialty..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Scheme</label>
                <select
                  value={hospitalFilters.scheme}
                  onChange={(e) => setHospitalFilters({ ...hospitalFilters, scheme: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <option value="All">All Schemes</option>
                  <option value="MJPJAY">MJPJAY Only</option>
                  <option value="PM-JAY">PM-JAY Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">District</label>
                <select
                  value={hospitalFilters.district}
                  onChange={(e) => setHospitalFilters({ ...hospitalFilters, district: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <option value="All">All Districts</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Nagpur">Nagpur</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Medical Specialty</label>
                <select
                  value={hospitalFilters.specialty}
                  onChange={(e) => setHospitalFilters({ ...hospitalFilters, specialty: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <option value="All">All Specialties</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Oncology">Oncology (Cancer)</option>
                  <option value="Nephrology">Nephrology (Dialysis)</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Surgery">General Surgery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hospitals List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHospitals.map((hospital) => (
              <div
                key={hospital.hospitalId}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hospital.isGovernmentHospital ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {hospital.isGovernmentHospital ? 'Govt College / Hospital' : 'Empanelled Private Super Specialty'}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          ⭐ {hospital.rating}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                        {hospital.hospitalName}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-1 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{hospital.address}</span>
                  </p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {hospital.schemes?.map(s => (
                      <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s} Empanelled
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">Specialties: </span>
                    <span>{hospital.specialties?.join(', ')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${hospital.contactPhone}`}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Hospital</span>
                  </a>

                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(hospital.hospitalName + ' ' + hospital.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Directions</span>
                  </a>

                  <button
                    onClick={() => setHospitalDeskModal(hospital)}
                    className="ml-auto flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-2xs transition-all"
                  >
                    <span>Request Verification</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Hospital Desk Request Modal */}
          {hospitalDeskModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-black text-slate-900 text-sm">
                    Submit Verification Request to Hospital
                  </h3>
                  <button onClick={() => setHospitalDeskModal(null)} className="text-slate-400 hover:text-slate-700">&times;</button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{hospitalDeskModal.hospitalName}</p>
                  <p className="text-slate-500">{hospitalDeskModal.address}</p>
                  <p className="text-emerald-700 font-bold">Scheme Desk: Arogya Mitra Cell</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Your masked ration card ({rationCard ? rationCard.maskedRationCardNumber : 'Pending'}) and beneficiary details will be forwarded to the hospital's scheme administration team for pre-admission eligibility review.
                </p>

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => setHospitalDeskModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleSubmitHospitalDeskRequest(hospitalDeskModal)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm"
                  >
                    {submitting ? 'Submitting...' : 'Confirm & Send Request'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 5: COVERED TREATMENTS & PACKAGES */}
      {/* ========================================================== */}
      {activeSubTab === 'packages' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Covered Treatments & Packages</h2>
              <p className="text-xs text-slate-500">
                Official cashless healthcare package master under MJPJAY 2.0 and PM-JAY
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {filteredPackages.length} Treatments Listed
            </span>
          </div>

          {/* Search & Filters */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={packageFilters.search}
                onChange={(e) => setPackageFilters({ ...packageFilters, search: e.target.value })}
                placeholder="Search procedures: Cataract, Cardiac Surgery, Cancer Treatment, Dialysis, Knee Replacement..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter by Scheme</label>
                <select
                  value={packageFilters.scheme}
                  onChange={(e) => setPackageFilters({ ...packageFilters, scheme: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <option value="All">All Schemes (MJPJAY & PM-JAY)</option>
                  <option value="MJPJAY">MJPJAY Only</option>
                  <option value="PM-JAY">PM-JAY Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Treatment Category</label>
                <select
                  value={packageFilters.category}
                  onChange={(e) => setPackageFilters({ ...packageFilters, category: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <option value="All">All Categories</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Nephrology">Nephrology (Dialysis)</option>
                  <option value="Oncology">Oncology (Cancer)</option>
                  <option value="Ophthalmology">Ophthalmology (Cataract)</option>
                  <option value="Orthopedic Surgery">Orthopedic Surgery (Joints)</option>
                  <option value="General Surgery">General Surgery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg._id || pkg.packageCode}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {pkg.packageCode}
                        </span>
                        <span className="text-[10px] font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200">
                          {pkg.category}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          {pkg.schemeName}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 mt-1.5">
                        {pkg.packageName}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 mb-3 leading-relaxed">
                    {pkg.coverageDetails}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Official Tariff Guideline:</span>
                      <span className="font-extrabold text-emerald-700">{pkg.officialRateGuideline}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Pre-Authorization:</span>
                      <span className="font-bold text-slate-800">{pkg.preAuthRequired ? 'Required by Hospital' : 'Immediate / Cashless'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Required Documents for Approval:</span>
                  <div className="flex flex-wrap gap-1">
                    {pkg.requiredDocuments?.map((doc, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        ✓ {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 6: AI GOVERNMENT HEALTH SCHEME ASSISTANT */}
      {/* ========================================================== */}
      {activeSubTab === 'ai-assistant' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
          
          {/* Assistant Header */}
          <div className="p-4 bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                  Health Scheme Assistant
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    AI Knowledge Base
                  </span>
                </h3>
                <p className="text-[11px] text-teal-200">
                  Specialized in MJPJAY, PM-JAY & Ration Card Eligibility • Non-diagnostic
                </p>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 hidden sm:block">
              Language: <strong className="text-white uppercase">{lang}</strong>
            </span>
          </div>

          {/* Guardrail Disclaimer */}
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Health Scheme Assistant answers policy, document, and empanelled hospital queries. It does not provide medical diagnoses or prescriptions.
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white font-medium rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.disclaimer && (
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                      ℹ️ {msg.disclaimer}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.sender === 'user' ? 'You' : 'Health Scheme Assistant'}
                </span>
              </div>
            ))}

            {aiLoading && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Checking verified health scheme knowledge base...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-500 font-bold shrink-0">Suggestions:</span>
            {[
              "Am I eligible for MJPJAY?",
              "What documents are required?",
              "Which hospitals near me accept this scheme?",
              "Is dialysis covered?",
              "How can I check my Ayushman Bharat eligibility?",
              "Which scheme is available for my family?"
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => handleSendAiPrompt(prompt)}
                className="px-2.5 py-1 rounded-full bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 whitespace-nowrap transition-colors font-medium shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiPrompt();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything about ration card eligibility, schemes, documents, or treatments..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={aiLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition-all flex items-center space-x-1 shrink-0 disabled:opacity-50"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 7: MY SCHEME QR BENEFICIARY IDENTIFICATION */}
      {/* ========================================================== */}
      {activeSubTab === 'my-qr' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md text-center space-y-6">
          
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold mb-2">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Government Scheme Beneficiary QR</h2>
            <p className="text-xs text-slate-500 mt-1">
              Present this secure token to Arogya Mitra or Hospital Desk for authorization
            </p>
          </div>

          {/* Secure QR Code Container */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
            <QRCodeSVG
              value={`MS-SCHEME-BENEFICIARY-${user?.patientUid || 'PAT-2026-000001'}-${Date.now()}`}
              size={200}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
            <p className="text-[10px] text-slate-400 font-mono mt-3">
              Reference Token: MS-QR-{user?.patientUid || 'PAT-2026-000001'}-SECURE
            </p>
          </div>

          {/* Security & Non-exposure Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 text-slate-700">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-PII Storage Policy</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              No raw Ration Card number, medical diagnosis, or PII is embedded in this QR code. Authorized hospital staff authenticate via backend RBAC to retrieve permitted eligibility fields.
            </p>
          </div>

          {/* Permitted Data Preview Card */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-left text-xs space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">Hospital Desk Authorized Lookup:</span>
            <div className="grid grid-cols-2 gap-2 text-slate-800">
              <p>Patient Name: <strong>{user?.name}</strong></p>
              <p>Patient UID: <strong className="font-mono">{user?.patientUid || 'PAT-2026-000001'}</strong></p>
              <p>Ration Card: <strong>{rationCard ? rationCard.maskedRationCardNumber : 'Pending'}</strong></p>
              <p>Card Category: <strong>{rationCard ? rationCard.rationCardType : 'Yellow'}</strong></p>
              <p>MJPJAY Status: <strong className="text-emerald-700">Potentially Eligible</strong></p>
              <p>PM-JAY Status: <strong className="text-emerald-700">Verification Required</strong></p>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 8: SCHEME NOTIFICATIONS */}
      {/* ========================================================== */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Scheme Notifications & Alerts</h2>
              <p className="text-xs text-slate-500">
                Official status alerts, verification progress, and hospital desk updates
              </p>
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              {notifications.length} Total Alerts
            </span>
          </div>

          <div className="space-y-2.5">
            {notifications.map(notif => {
              const typeColor = 
                notif.type === 'Success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                notif.type === 'Warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                notif.type === 'Action Required' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                'bg-sky-50 border-sky-200 text-sky-900';

              const Icon = 
                notif.type === 'Success' ? CheckCircle2 :
                notif.type === 'Warning' ? AlertTriangle :
                notif.type === 'Action Required' ? AlertCircle : Info;

              return (
                <div
                  key={notif._id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${typeColor} ${
                    !notif.readStatus ? 'shadow-xs font-semibold' : 'opacity-85'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs">{notif.title}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-white/60">
                          {notif.type}
                        </span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">{notif.message}</p>
                      <span className="text-[10px] opacity-60 block mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {!notif.readStatus && (
                    <button
                      onClick={() => handleMarkNotificationRead(notif._id)}
                      className="text-[10px] font-bold text-slate-600 hover:text-slate-900 shrink-0 bg-white/80 px-2.5 py-1 rounded-lg shadow-2xs"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
