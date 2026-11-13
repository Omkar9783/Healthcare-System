import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { schemeAssistantApi } from '../services/api';
import {
  Landmark,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Upload,
  ShieldCheck,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  RefreshCw,
  FileCheck,
  Users,
  Check,
  X,
  Edit2,
  Save
} from 'lucide-react';

export const GovernmentSchemeAssistant = () => {
  const { user } = useAuth();

  const patientUid = user?.patientUid || user?.uid || 'PAT-2026-000001';

  // Navigation tab
  const [activeTab, setActiveTab] = useState('schemes'); // 'schemes', 'upload', 'profile', 'autofill', 'applications'

  // Data states
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationSummary, setRecommendationSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [docTypeHint, setDocTypeHint] = useState('income_certificate');
  const [consentChecked, setConsentChecked] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadedDoc, setLastUploadedDoc] = useState(null);

  // Autofill form state
  const [selectedSchemeId, setSelectedSchemeId] = useState('mjpjay');
  const [autofillData, setAutofillData] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [userApprovalChecked, setUserApprovalChecked] = useState(false);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [previewAppModal, setPreviewAppModal] = useState(null);

  // Profile Edit modal
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({});

  // Filter & Alerts
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [alertMessage, setAlertMessage] = useState(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, [patientUid]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Load schemes
      const schemesRes = await schemeAssistantApi.getSchemes();
      if (schemesRes?.schemes) setSchemes(schemesRes.schemes);

      // 2. Load profile
      const profileRes = await schemeAssistantApi.getProfile(patientUid);
      if (profileRes?.profile) {
        setProfile(profileRes.profile);
        setEditProfileForm({
          annualIncome: profileRes.profile.socioEconomic?.annualIncome || '',
          casteCategory: profileRes.profile.socioEconomic?.casteCategory || 'General',
          rationCardType: profileRes.profile.socioEconomic?.rationCardType || 'Yellow',
          disabilityPercentage: profileRes.profile.socioEconomic?.disabilityPercentage || 0,
          district: profileRes.profile.address?.district || 'Pune',
          age: profileRes.profile.demographics?.age || 38
        });
      }

      // 3. Load recommendations
      const recRes = await schemeAssistantApi.evaluateEligibility(patientUid);
      if (recRes?.recommendation) {
        setRecommendations(recRes.recommendation.recommendations || []);
        setRecommendationSummary(recRes.recommendation.summary || null);
      }

      // 4. Load uploaded documents
      const docsRes = await schemeAssistantApi.getDocuments(patientUid);
      if (docsRes?.documents) setDocuments(docsRes.documents);

      // 5. Load applications
      const appsRes = await schemeAssistantApi.getApplications(patientUid);
      if (appsRes?.applications) setApplications(appsRes.applications);

    } catch (err) {
      console.error('Failed to load scheme assistant data:', err);
      showAlert('error', err.message || 'Failed to load Government Scheme data.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlertMessage({ type, message });
    setTimeout(() => setAlertMessage(null), 6000);
  };

  // Upload handler
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showAlert('error', 'Please choose a document image or PDF file to upload.');
      return;
    }
    if (!consentChecked) {
      showAlert('error', 'Informed consent is required to process identity documents.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('patientUid', patientUid);
      formData.append('docType', docTypeHint);
      formData.append('userConsent', 'true');

      const res = await schemeAssistantApi.uploadDocument(formData);
      if (res.success) {
        setLastUploadedDoc(res);
        showAlert('success', `Document processed! Extracted fields verified for ${docTypeHint.replace('_', ' ')}.`);
        setUploadFile(null);
        // Refresh profile, recommendations, and documents
        await loadAllData();
      }
    } catch (err) {
      console.error('Upload failed:', err);
      showAlert('error', err.message || 'Failed to upload and extract document.');
    } finally {
      setIsUploading(false);
    }
  };

  // Load Autofill Form for a scheme
  const handleOpenAutofill = async (schemeId) => {
    setSelectedSchemeId(schemeId);
    setActiveTab('autofill');
    setUserApprovalChecked(false);
    try {
      const res = await schemeAssistantApi.autofillForm(patientUid, schemeId);
      if (res.success) {
        setAutofillData(res);
        setFormValues(res.prefilledData || {});
      }
    } catch (err) {
      console.error('Autofill failed:', err);
      showAlert('error', 'Could not load form schema for selected scheme.');
    }
  };

  // Handle Form field change
  const handleFormFieldChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  // Submit Application
  const handleSubmitApplication = async () => {
    if (!userApprovalChecked) {
      showAlert('error', 'Please confirm explicit user approval checkbox before saving application.');
      return;
    }

    setIsSubmittingApp(true);
    try {
      const attached = (autofillData?.availableDocuments || []).map(d => ({
        docType: d.docType,
        docId: d.docId,
        fileName: d.docName,
        verified: d.verified
      }));

      const payload = {
        patientUid,
        schemeId: selectedSchemeId,
        formData: formValues,
        attachedDocuments: attached,
        userConsent: {
          approvedByUser: true,
          userDeclaration: 'I confirm that all populated information is accurate to the best of my knowledge.'
        }
      };

      const res = await schemeAssistantApi.submitApplication(payload);
      if (res.success) {
        showAlert('success', `Application ${res.application.applicationId} saved! Status: ${res.application.applicationStatus}.`);
        setActiveTab('applications');
        await loadAllData();
      }
    } catch (err) {
      console.error('Submit application failed:', err);
      showAlert('error', err.message || 'Failed to submit application.');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  // Save edited profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        'demographics.age': Number(editProfileForm.age),
        'address.district': editProfileForm.district,
        'socioEconomic.annualIncome': Number(editProfileForm.annualIncome),
        'socioEconomic.casteCategory': editProfileForm.casteCategory,
        'socioEconomic.rationCardType': editProfileForm.rationCardType,
        'socioEconomic.disabilityPercentage': Number(editProfileForm.disabilityPercentage),
        'socioEconomic.isDisabilityApplicable': Number(editProfileForm.disabilityPercentage) > 0
      };

      await schemeAssistantApi.updateProfile(patientUid, payload);
      showAlert('success', 'Profile updated! Eligibility re-evaluated automatically.');
      setIsEditingProfile(false);
      await loadAllData();
    } catch (err) {
      showAlert('error', err.message || 'Failed to update profile.');
    }
  };

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = rec.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.governmentDepartment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || rec.eligibilityStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-sky-800/40 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>AI-Powered Government Welfare & Health Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Government Scheme Assistant
          </h1>
          <p className="text-sm text-sky-100/90 leading-relaxed max-w-3xl">
            Automatically extract permitted demographic information from Aadhaar and supporting certificates, check eligibility across official Maharashtra & Central welfare schemes, and autofill application forms.
          </p>

          {/* Legal Notice Pill */}
          <div className="bg-sky-950/80 border border-sky-500/30 rounded-xl p-3 text-xs text-sky-200 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong>Official Verification Guardrail:</strong> AI-generated eligibility results are preliminary assessments based on gazetted rules. Final eligibility decisions require authorized government verification via official portals or hospital Arogya Mitra desks.
            </span>
          </div>
        </div>

        {/* Action Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-sky-800/60">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'schemes'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-white/10 text-sky-100 hover:bg-white/20'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Recommended Schemes</span>
            {recommendationSummary && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 text-[10px]">
                {recommendationSummary.totalEvaluated}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'upload'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-white/10 text-sky-100 hover:bg-white/20'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Documents & OCR</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-white/10 text-sky-100 hover:bg-white/20'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Extracted Profile Preview</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('autofill');
              if (!autofillData) handleOpenAutofill('mjpjay');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'autofill'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-white/10 text-sky-100 hover:bg-white/20'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Auto-Filled Form</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'applications'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-white/10 text-sky-100 hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Application Status</span>
            {applications.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px]">
                {applications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            alertMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alertMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{alertMessage.message}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading Government Scheme Assistant & Rule Engine...</p>
        </div>
      ) : (
        <>
          {/* =======================================================
              TAB 1: RECOMMENDED SCHEMES & ELIGIBILITY EXPLANATION
             ======================================================= */}
          {activeTab === 'schemes' && (
            <div className="space-y-6">
              {/* Summary Metric Cards */}
              {recommendationSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg">
                      {recommendationSummary.totalEvaluated}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Evaluated Schemes</p>
                      <p className="text-lg font-extrabold text-slate-900">Total Catalog</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20">
                      {recommendationSummary.eligibleCount}
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700 font-medium">Potentially Eligible</p>
                      <p className="text-lg font-black text-emerald-950">Recommended</p>
                    </div>
                  </div>

                  <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20">
                      {recommendationSummary.infoNeededCount}
                    </div>
                    <div>
                      <p className="text-xs text-amber-700 font-medium">Insufficient Info</p>
                      <p className="text-lg font-black text-amber-950">Documents Needed</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-lg">
                      {recommendationSummary.ineligibleCount}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Confirmed Ineligible</p>
                      <p className="text-lg font-black text-slate-800">Rule Criteria Not Met</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search schemes or departments..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Filter status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="POTENTIALLY_ELIGIBLE">Potentially Eligible</option>
                    <option value="INSUFFICIENT_INFORMATION">Insufficient Information</option>
                    <option value="INELIGIBLE">Ineligible</option>
                  </select>
                  <button
                    onClick={loadAllData}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    title="Refresh evaluation"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scheme Recommendation Cards */}
              <div className="space-y-4">
                {filteredRecommendations.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">No schemes found matching criteria.</p>
                  </div>
                ) : (
                  filteredRecommendations.map((rec) => {
                    const isEligible = rec.eligibilityStatus === 'POTENTIALLY_ELIGIBLE';
                    const isInsufficient = rec.eligibilityStatus === 'INSUFFICIENT_INFORMATION';
                    const isIneligible = rec.eligibilityStatus === 'INELIGIBLE';

                    const originalScheme = schemes.find(s => s.schemeId === rec.schemeId);

                    return (
                      <div
                        key={rec.schemeId}
                        className={`bg-white rounded-3xl p-6 border transition-all ${
                          isEligible
                            ? 'border-emerald-300 shadow-md shadow-emerald-500/5'
                            : isInsufficient
                            ? 'border-amber-300 shadow-sm'
                            : 'border-slate-200 opacity-80'
                        }`}
                      >
                        {/* Top row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                          <div>
                            <div className="flex items-center space-x-2.5 mb-1.5">
                              <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-extrabold text-[11px] border border-sky-200 uppercase">
                                {rec.shortCode}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {rec.state} • {rec.governmentDepartment}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 leading-snug">
                              {rec.schemeName}
                            </h3>
                            <p className="text-xs text-sky-700 font-bold mt-1">
                              {rec.coverageBenefit}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center space-x-3 shrink-0">
                            {isEligible && (
                              <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black flex items-center space-x-1.5 shadow-sm">
                                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                                <span>Potentially Eligible</span>
                              </div>
                            )}
                            {isInsufficient && (
                              <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-black flex items-center space-x-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span>Insufficient Info</span>
                              </div>
                            )}
                            {isIneligible && (
                              <div className="px-4 py-2 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 text-xs font-black flex items-center space-x-1.5">
                                <X className="w-4 h-4 text-slate-500" />
                                <span>Ineligible (Rule Confirmed)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle: Rule Reasoning Breakdown & Checklist */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                          {/* Left: Why it applies or why not */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                              <ShieldCheck className="w-4 h-4 text-sky-600" />
                              <span>Rule-Based Eligibility Breakdown</span>
                            </h4>

                            <ul className="space-y-2 text-xs">
                              {rec.reasons.map((reason, idx) => (
                                <li key={idx} className="flex items-start space-x-2 text-slate-700 leading-relaxed">
                                  {isEligible ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  )}
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>

                            {rec.ruleEvaluations && rec.ruleEvaluations.length > 0 && (
                              <div className="pt-2 flex flex-wrap gap-1.5">
                                {rec.ruleEvaluations.map((rule, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center space-x-1 ${
                                      rule.passed
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    <span>{rule.passed ? '✓' : '✕'}</span>
                                    <span>{rule.name}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right: Required Documents Checklist */}
                          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                              <FileCheck className="w-4 h-4 text-indigo-600" />
                              <span>Required Documents Checklist</span>
                            </h4>

                            <div className="space-y-2">
                              {originalScheme?.requiredDocuments?.map((doc, idx) => {
                                const isMissing = rec.missingDocuments.includes(doc.docName);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-200/60"
                                  >
                                    <div className="flex items-center space-x-2">
                                      {isMissing ? (
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      )}
                                      <span className={isMissing ? 'text-slate-600' : 'text-slate-900 font-semibold'}>
                                        {doc.docName}
                                      </span>
                                    </div>

                                    {isMissing ? (
                                      <button
                                        onClick={() => {
                                          setDocTypeHint(doc.docType);
                                          setActiveTab('upload');
                                        }}
                                        className="text-[10px] font-extrabold text-sky-600 hover:text-sky-800 underline"
                                      >
                                        + Upload
                                      </button>
                                    ) : (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        Verified
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <div className="text-slate-400 text-[11px]">
                            <span>Rules verified: {originalScheme?.lastVerifiedDate || '2026-01-15'}</span> •{' '}
                            <span className="italic">{originalScheme?.sourceOfEligibilityRules}</span>
                          </div>

                          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                            <a
                              href={rec.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all"
                            >
                              <span>Official Portal</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => handleOpenAutofill(rec.schemeId)}
                              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md shadow-sky-600/30 transition-all"
                            >
                              <span>Auto-Fill Application Form</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =======================================================
              TAB 2: UPLOAD DOCUMENTS & AI EXTRACTION
             ======================================================= */}
          {activeTab === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Card */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Upload Supporting Welfare Document
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your official government certificates. YOLO11 will classify the document and PaddleOCR will extract structured fields in English, Hindi, or Marathi.
                  </p>
                </div>

                {/* Informed Consent Checkbox (Requirement 8) */}
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-950 space-y-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="leading-relaxed font-medium">
                      <strong>Mandatory Informed Consent:</strong> I hereby give explicit consent for MediSecure AI to extract permitted demographic and eligibility details from my document. I understand that all Aadhaar and Bank account numbers will be cryptographically masked (`XXXX-XXXX-1234`) and no biometric data will be retained.
                    </span>
                  </label>
                </div>

                <form onSubmit={handleDocumentUpload} className="space-y-4">
                  {/* Select Doc Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Document Category
                    </label>
                    <select
                      value={docTypeHint}
                      onChange={(e) => setDocTypeHint(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="income_certificate">Income Certificate (Tahsildar / Revenue)</option>
                      <option value="caste_certificate">Caste Certificate (SC / ST / OBC / VJNT / SBC)</option>
                      <option value="disability_certificate">Disability Certificate / UDID Card (40% or more)</option>
                      <option value="birth_certificate">Birth Certificate / Age Proof</option>
                      <option value="bank_passbook">Bank Passbook / Account Proof</option>
                      <option value="ration_card">Maharashtra Ration Card (SRC Yellow/Orange/White)</option>
                      <option value="aadhaar_front">Aadhaar Card (UIDAI Front)</option>
                      <option value="aadhaar_back">Aadhaar Card (UIDAI Back / Address)</option>
                    </select>
                  </div>

                  {/* File Dropzone */}
                  <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-sky-50/30 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      {uploadFile ? uploadFile.name : 'Click to select or drag & drop document file'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports JPG, PNG, WebP, PDF (Max 10MB)
                    </p>
                  </div>

                  {/* Submit Upload */}
                  <button
                    type="submit"
                    disabled={isUploading || !uploadFile || !consentChecked}
                    className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Running YOLO11 Detection & PaddleOCR Extraction...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Run AI Detection & Field Extraction</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Extraction Result Preview */}
                {lastUploadedDoc && (
                  <div className="mt-6 bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">OCR Extraction Completed</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                        {lastUploadedDoc.document?.docId}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                      <pre>{JSON.stringify(lastUploadedDoc.extractedFields, null, 2)}</pre>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Profile automatically updated and scheme eligibility rules refreshed.
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Documents List */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Uploaded Documents ({documents.length})
                  </h4>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No supporting documents uploaded yet.</p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.docId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800 truncate max-w-[150px]">
                            {doc.docName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {doc.verificationStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 capitalize">
                          Type: {doc.docType.replace('_', ' ')}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(doc.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              TAB 3: EXTRACTED PROFILE PREVIEW
             ======================================================= */}
          {activeTab === 'profile' && profile && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Patient Scheme Profile & Demographic Verification
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Synthesized from your verified Aadhaar, Ration Card, and Supporting Certificates.
                  </p>
                </div>

                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center space-x-1.5 transition-all self-start"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile Parameters</span>
                </button>
              </div>

              {/* Profile Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Identity & Demographics */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-black text-slate-900 uppercase">1. Demographics</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">UIDAI Aadhaar</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><strong className="text-slate-900">Full Name:</strong> {profile.demographics?.fullName || 'Rahul Patil'}</p>
                    <p><strong className="text-slate-900">Masked Aadhaar:</strong> {profile.demographics?.maskedAadhaar || 'XXXX-XXXX-1234'}</p>
                    <p><strong className="text-slate-900">Date of Birth:</strong> {profile.demographics?.dob || '1988-04-12'} (Age: {profile.demographics?.age || 38} yrs)</p>
                    <p><strong className="text-slate-900">Gender:</strong> {profile.demographics?.gender || 'Male'}</p>
                    <p><strong className="text-slate-900">Mobile:</strong> {profile.demographics?.mobile || '9988776651'}</p>
                  </div>
                </div>

                {/* 2. Domicile & Residence */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-black text-slate-900 uppercase">2. State Domicile</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Verified</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><strong className="text-slate-900">State:</strong> {profile.address?.state || 'Maharashtra'}</p>
                    <p><strong className="text-slate-900">District:</strong> {profile.address?.district || 'Pune'}</p>
                    <p><strong className="text-slate-900">Pincode:</strong> {profile.address?.pincode || '411005'}</p>
                    <p><strong className="text-slate-900">Maharashtra Domicile:</strong> {profile.address?.isMaharashtraDomicile ? 'Yes (Permanent Resident)' : 'No'}</p>
                    <p><strong className="text-slate-900">Years in State:</strong> {profile.address?.yearsResidentInState || 25} years</p>
                  </div>
                </div>

                {/* 3. Socio-Economic & Welfare */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-black text-slate-900 uppercase">3. Socio-Economic</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">Income & RCMS</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><strong className="text-slate-900">Ration Card:</strong> {profile.socioEconomic?.rationCardType} ({profile.socioEconomic?.rationCardNumber || 'RC-XXXX-8921'})</p>
                    <p><strong className="text-slate-900">Annual Income:</strong> {profile.socioEconomic?.annualIncome ? `₹${profile.socioEconomic.annualIncome.toLocaleString('en-IN')}` : 'Not Specified'}</p>
                    <p><strong className="text-slate-900">Caste Category:</strong> {profile.socioEconomic?.casteCategory || 'General'} ({profile.socioEconomic?.casteName || 'Mali'})</p>
                    <p><strong className="text-slate-900">Disability Status:</strong> {profile.socioEconomic?.isDisabilityApplicable ? `${profile.socioEconomic.disabilityPercentage}% (${profile.socioEconomic.disabilityType})` : 'None / Not Applicable'}</p>
                    <p><strong className="text-slate-900">Bank Account:</strong> {profile.socioEconomic?.bankDetails?.accountNumberMasked || 'XXXX-XXXX-6789'} ({profile.socioEconomic?.bankDetails?.ifscCode || 'MAHB0000123'})</p>
                  </div>
                </div>
              </div>

              {/* Documents Verification Status Matrix */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Supporting Documents Verification Badges
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                  <div className={`p-2.5 rounded-xl border ${profile.documentsSummary?.aadhaarVerified ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    <p className="font-extrabold">Aadhaar</p>
                    <span className="text-[10px] font-bold">{profile.documentsSummary?.aadhaarVerified ? '✓ Verified' : 'Missing'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${profile.documentsSummary?.rationCardVerified ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    <p className="font-extrabold">Ration Card</p>
                    <span className="text-[10px] font-bold">{profile.documentsSummary?.rationCardVerified ? '✓ Verified' : 'Missing'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${profile.documentsSummary?.incomeCertVerified ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    <p className="font-extrabold">Income Cert</p>
                    <span className="text-[10px] font-bold">{profile.documentsSummary?.incomeCertVerified ? '✓ Verified' : 'Missing'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${profile.documentsSummary?.casteCertVerified ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    <p className="font-extrabold">Caste Cert</p>
                    <span className="text-[10px] font-bold">{profile.documentsSummary?.casteCertVerified ? '✓ Verified' : 'Missing'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${profile.documentsSummary?.disabilityCertVerified ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    <p className="font-extrabold">Disability / UDID</p>
                    <span className="text-[10px] font-bold">{profile.documentsSummary?.disabilityCertVerified ? '✓ Verified' : 'N/A'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${profile.documentsSummary?.birthCertVerified ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    <p className="font-extrabold">Age / Birth</p>
                    <span className="text-[10px] font-bold">{profile.documentsSummary?.birthCertVerified ? '✓ Verified' : 'Missing'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${profile.documentsSummary?.bankProofVerified ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    <p className="font-extrabold">Bank Passbook</p>
                    <span className="text-[10px] font-bold">{profile.documentsSummary?.bankProofVerified ? '✓ Verified' : 'Missing'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Modal */}
          {isEditingProfile && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900">Edit Profile Parameters</h3>
                  <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={editProfileForm.age}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, age: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Annual Family Income (₹)</label>
                    <input
                      type="number"
                      value={editProfileForm.annualIncome}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, annualIncome: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ration Card Category</label>
                    <select
                      value={editProfileForm.rationCardType}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, rationCardType: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Yellow">Yellow (BPL)</option>
                      <option value="Orange">Orange</option>
                      <option value="White">White</option>
                      <option value="Antyodaya (AAY)">Antyodaya (AAY)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Caste Category</label>
                    <select
                      value={editProfileForm.casteCategory}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, casteCategory: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="General">General / Open</option>
                      <option value="OBC">OBC (Other Backward Class)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="VJNT">VJNT</option>
                      <option value="SBC">SBC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Disability Percentage (0 if none)</label>
                    <input
                      type="number"
                      value={editProfileForm.disabilityPercentage}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, disabilityPercentage: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Residential District</label>
                    <input
                      type="text"
                      value={editProfileForm.district}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, district: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-sky-600 text-white font-extrabold hover:bg-sky-700 shadow-md shadow-sky-600/30"
                    >
                      Save & Re-evaluate
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =======================================================
              TAB 4: AUTO-FILLED FORM ASSISTANT
             ======================================================= */}
          {activeTab === 'autofill' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-800 text-[10px] font-black uppercase">
                      Application Form Assistant
                    </span>
                    <span className="text-xs text-slate-400">Step 4 of 4</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Auto-Filled Application: {autofillData?.schemeName || 'Mahatma Jyotirao Phule Jan Arogya Yojana'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fields are automatically populated from your verified documents. You can review and modify every value.
                  </p>
                </div>

                {/* Scheme Switcher */}
                <div className="shrink-0">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Target Scheme:</label>
                  <select
                    value={selectedSchemeId}
                    onChange={(e) => handleOpenAutofill(e.target.value)}
                    className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none"
                  >
                    {schemes.map(s => (
                      <option key={s.schemeId} value={s.schemeId}>{s.shortCode} — {s.schemeName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Missing Fields Alert banner */}
              {autofillData?.missingFields?.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Missing Required Fields ({autofillData.missingFields.length}): </span>
                    <span>Please fill in {autofillData.missingFields.join(', ')} before saving.</span>
                  </div>
                </div>
              )}

              {/* Dynamic Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {autofillData?.formFields?.map(field => {
                  const val = formValues[field.fieldKey] ?? '';
                  const isPrepopulated = Boolean(val && val !== '');

                  return (
                    <div key={field.fieldKey} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        {isPrepopulated ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Auto-filled by AI
                          </span>
                        ) : field.required ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Required
                          </span>
                        ) : null}
                      </div>

                      {field.type === 'select' ? (
                        <select
                          value={val}
                          onChange={(e) => handleFormFieldChange(field.fieldKey, e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                          <option value="">{field.placeholder || 'Select option'}</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          value={val}
                          placeholder={field.placeholder}
                          onChange={(e) => handleFormFieldChange(field.fieldKey, e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      )}

                      {field.helpText && (
                        <p className="text-[11px] text-slate-400">{field.helpText}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Supporting Documents Attached */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Attached Verified Supporting Documents
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {autofillData?.availableDocuments?.map((doc) => (
                    <div
                      key={doc.docId}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center space-x-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold">{doc.docName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({doc.docType})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explicit User Approval (Requirement 5) */}
              <div className="bg-sky-50 border border-sky-300 rounded-2xl p-4 text-xs text-sky-950 space-y-2">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userApprovalChecked}
                    onChange={(e) => setUserApprovalChecked(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="leading-relaxed font-semibold">
                    <strong>Explicit User Approval & Declaration:</strong> I have reviewed all auto-filled form values above, verify that the information is complete and accurate, and give approval for saving this application record in MediSecure.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <a
                  href={autofillData?.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <span>Open Official Application Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => setPreviewAppModal({ schemeName: autofillData?.schemeName, formValues })}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs transition-all"
                  >
                    Preview Application
                  </button>

                  <button
                    onClick={handleSubmitApplication}
                    disabled={isSubmittingApp || !userApprovalChecked}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-black text-xs shadow-md shadow-sky-600/30 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    {isSubmittingApp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save & Prepare Application</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              TAB 5: APPLICATION STATUS TRACKING
             ======================================================= */}
          {activeTab === 'applications' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Application Status & Submission Tracking
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track saved applications, Arogya Mitra hospital desk reviews, and official reference numbers.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('schemes')}
                  className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 font-extrabold text-xs hover:bg-sky-100 transition-all"
                >
                  + Apply for New Scheme
                </button>
              </div>

              {applications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <Clock className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No applications created yet.</p>
                  <p className="text-xs">Choose a recommended scheme above and click 'Auto-Fill Application Form'.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.applicationId}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-black text-sky-700">
                              {app.applicationId}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500">
                              {new Date(app.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-slate-900 mt-1">
                            {app.schemeName}
                          </h4>
                        </div>

                        {/* Status Pill */}
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              app.applicationStatus === 'APPROVED_OFFICIALLY'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : app.applicationStatus === 'READY_FOR_PORTAL_SUBMISSION'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : app.applicationStatus === 'SUBMITTED_TO_DESK'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {app.applicationStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-200 text-slate-600">
                        <div>
                          <span><strong>Attached Documents:</strong> {app.attachedDocuments?.length || 0} files</span>
                          {app.deskNotes && <span className="ml-3 italic text-slate-500">Note: {app.deskNotes}</span>}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setPreviewAppModal({ schemeName: app.schemeName, formValues: app.formData })}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                          >
                            View Form Data
                          </button>

                          {app.officialPortalUrl && (
                            <a
                              href={app.officialPortalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold flex items-center space-x-1"
                            >
                              <span>Official Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview Application Modal */}
          {previewAppModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">Application Preview</span>
                    <h3 className="text-lg font-black text-slate-900">{previewAppModal.schemeName}</h3>
                  </div>
                  <button onClick={() => setPreviewAppModal(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Populated Beneficiary Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(previewAppModal.formValues).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-white border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{k}</p>
                        <p className="font-extrabold text-slate-800 truncate">{String(v || '—')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    This application summary is saved in MediSecure for hospital Arogya Mitra desk review and direct export to the official portal.
                  </span>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setPreviewAppModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
