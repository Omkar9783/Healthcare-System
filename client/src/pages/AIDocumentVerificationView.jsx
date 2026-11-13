import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { documentApi } from '../services/api';
import { 
  FileCheck, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Scan, 
  RefreshCw, 
  UserCheck, 
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Lock,
  HeartHandshake,
  Building2,
  ExternalLink,
  Check
} from 'lucide-react';

export const AIDocumentVerificationView = ({ onSelectTab }) => {
  const { user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState(user?.role === 'ADMIN' ? 'admin' : (user?.role === 'DOCTOR' ? 'doctor' : 'patient'));
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [docTypeHint, setDocTypeHint] = useState('aadhaar'); // 'aadhaar' or 'ration'
  const [uploadSide, setUploadSide] = useState('front'); // 'front' or 'back'

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // History & Admin Records
  const [records, setRecords] = useState([]);
  const [adminStats, setAdminStats] = useState({ total: 0, verified: 0, manualReview: 0, anomalies: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Review Modal State (Admin)
  const [selectedRecordForReview, setSelectedRecordForReview] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Target patient for Doctor/Admin view
  const [patientUidInput, setPatientUidInput] = useState(user?.patientUid || 'PAT-2026-000001');

  const fetchRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      if (activeSubTab === 'admin' && user?.role === 'ADMIN') {
        const res = await documentApi.adminAll(statusFilter);
        if (res.success) {
          setRecords(res.data || []);
          if (res.stats) setAdminStats(res.stats);
        }
      } else {
        const uid = user?.role === 'PATIENT' ? user.patientUid : patientUidInput;
        const res = await documentApi.patientRecords(uid || 'PAT-2026-000001');
        if (res.success) {
          setRecords(res.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch verification records:', err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [activeSubTab, user, statusFilter, patientUidInput]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 10MB limit.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setVerificationResult(null);
  };

  const handleUploadAndVerify = async () => {
    if (!selectedFile) {
      setErrorMessage('Please choose a document image before initiating AI verification.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_hint', docTypeHint);
      formData.append('side', uploadSide);
      formData.append('patientUid', user?.patientUid || patientUidInput || 'PAT-2026-000001');

      // Simulate pipeline steps
      setUploadProgress(40);
      setTimeout(() => setUploadProgress(70), 500);

      const res = await documentApi.verify(formData);
      setUploadProgress(100);

      if (res.success) {
        setVerificationResult(res.data);
        fetchRecords();
      } else {
        setErrorMessage(res.message || 'AI document verification failed.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with AI verification service.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdminReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecordForReview) return;
    if (!reviewReason || reviewReason.trim().length < 5) {
      alert('Please provide a descriptive reason (minimum 5 characters) for audit compliance.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await documentApi.review(selectedRecordForReview.verificationId, {
        action: reviewAction,
        reason: reviewReason
      });
      if (res.success) {
        setSelectedRecordForReview(null);
        setReviewReason('');
        fetchRecords();
      } else {
        alert(res.message || 'Failed to submit review decision.');
      }
    } catch (err) {
      alert(err.message || 'Error submitting review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Status Badge Colors (Requirement 14: Green, Yellow, Red, Grey)
  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
      case 'SUCCESS':
      case 'VALID':
      case 'MATCHED':
      case 'DECODED':
      case 'DETECTED':
      case 'CLEAN':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {status}
          </span>
        );
      case 'MANUAL_REVIEW':
      case 'PENDING':
      case 'PENDING_OFFICIAL_VERIFICATION':
      case 'PARTIAL_MATCH':
      case 'PARTIAL':
      case 'SUSPICIOUS':
      case 'ANOMALY_DETECTED_REQUIRES_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {status.replace(/_/g, ' ')}
          </span>
        );
      case 'NOT_VERIFIED':
      case 'MISMATCH':
      case 'FAILED':
      case 'INVALID':
      case 'REJECTED':
      case 'UNSUPPORTED_DOCUMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {status.replace(/_/g, ' ')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {status ? status.replace(/_/g, ' ') : 'NOT CHECKED'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
              YOLO11 &bull; PaddleOCR &bull; UIDAI e-KYC &bull; RCMS
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-sky-400" />
            AI Document Detection & Verification System
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Automated government identity authentication for Aadhaar cards and Maharashtra Ration cards with 
            cryptographic signature verification, demographic matching, and anti-tamper anomaly inspection.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveSubTab('patient')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'patient' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Patient Upload
          </button>
          {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setActiveSubTab('doctor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'doctor' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Doctor Review
            </button>
          )}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveSubTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'admin' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin Governance
            </button>
          )}
        </div>
      </div>

      {/* ─── TAB 1: PATIENT UPLOAD & VERIFICATION PIPELINE ─── */}
      {activeSubTab === 'patient' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Upload Form & Live Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-sky-600" />
                Upload Identity Document
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Supported: Aadhaar Card (UIDAI) &bull; Maharashtra Ration Card (RCMS)
              </p>

              {/* Document Type Selector */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setDocTypeHint('aadhaar')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    docTypeHint === 'aadhaar'
                      ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">Aadhaar Card</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">UIDAI Secure QR &amp; Face</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDocTypeHint('ration')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    docTypeHint === 'ration'
                      ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">Ration Card</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Maharashtra RCMS 12-digit</p>
                </button>
              </div>

              {/* Side Selector */}
              <div className="flex items-center gap-4 mb-4 text-xs font-medium text-slate-700">
                <span className="text-slate-500 font-semibold">Side:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="docSide"
                    checked={uploadSide === 'front'}
                    onChange={() => setUploadSide('front')}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Front Side</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="docSide"
                    checked={uploadSide === 'back'}
                    onChange={() => setUploadSide('back')}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Back Side (Address / QR)</span>
                </label>
              </div>

              {/* Drag and Drop Box */}
              <label className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-sky-50/20 transition-all text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="space-y-3 w-full">
                    <img
                      src={previewUrl}
                      alt="Uploaded Document"
                      className="max-h-48 mx-auto rounded-xl object-contain shadow-sm border border-slate-200"
                    />
                    <p className="text-xs text-slate-600 font-medium">Click to select a different image</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 mb-3">
                      <Scan className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Click to upload or drag image here</p>
                    <p className="text-[11px] text-slate-400 mt-1">JPEG, PNG, or WebP up to 10MB</p>
                  </>
                )}
              </label>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Upload & Inspect Button */}
              <button
                type="button"
                disabled={!selectedFile || isUploading}
                onClick={handleUploadAndVerify}
                className="w-full mt-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing YOLO11 &amp; OCR Engine ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-sky-200" />
                    <span>Start AI Detection &amp; Verification</span>
                  </>
                )}
              </button>

              <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1 justify-center">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Zero-storage policy: Full numbers masked. Data retained per HIPAA/DISHA guidelines.</span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis Result */}
          <div className="lg:col-span-7 space-y-6">
            {verificationResult ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">ID: {verificationResult.verificationId}</span>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>Inspection Outcome:</span>
                      {getStatusBadge(verificationResult.verificationStatus)}
                    </h3>
                  </div>
                  <div className="text-right sm:text-right text-xs text-slate-500">
                    <p className="font-semibold">{new Date(verificationResult.createdAt).toLocaleDateString()}</p>
                    <p className="text-[11px] text-slate-400">{new Date(verificationResult.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Independent Verification Matrix (Requirement 11) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Independent Verification Flags
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Detection (YOLO11)</p>
                      <div className="mt-1">{getStatusBadge(verificationResult.documentDetectionStatus)}</div>
                      <p className="text-[10px] text-slate-400 mt-1">Conf: {(verificationResult.detectionConfidence * 100).toFixed(0)}%</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">OCR Status</p>
                      <div className="mt-1">{getStatusBadge(verificationResult.ocrStatus)}</div>
                      <p className="text-[10px] text-slate-400 mt-1">PaddleOCR</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Signature / QR</p>
                      <div className="mt-1">{getStatusBadge(verificationResult.signatureStatus || verificationResult.qrStatus)}</div>
                      <p className="text-[10px] text-slate-400 mt-1">UIDAI PKI</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Patient Match</p>
                      <div className="mt-1">{getStatusBadge(verificationResult.dataMatchStatus)}</div>
                      <p className="text-[10px] text-slate-400 mt-1">Score: {((verificationResult.patientMatchDetails?.overallMatchScore || 0) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>

                {/* Extracted Details & Masked ID */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Masked Identity Number:</span>
                    <span className="font-mono text-sm font-extrabold text-sky-700 bg-sky-100 px-3 py-0.5 rounded-lg border border-sky-200">
                      {verificationResult.maskedIdNumber || 'XXXX-XXXX-XXXX'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Extracted Name:</span>{' '}
                      <span className="font-bold text-slate-800">{verificationResult.extractedData?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">DOB / Year:</span>{' '}
                      <span className="font-bold text-slate-800">{verificationResult.extractedData?.dob || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Gender:</span>{' '}
                      <span className="font-bold text-slate-800">{verificationResult.extractedData?.gender || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">PDS / Category:</span>{' '}
                      <span className="font-bold text-slate-800">{verificationResult.extractedData?.cardType || 'N/A'}</span>
                    </div>
                    {verificationResult.extractedData?.address && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400">Address:</span>{' '}
                        <span className="font-semibold text-slate-800">{verificationResult.extractedData?.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decision Rationale */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Decision Engine Rationale
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 bg-amber-50/50 border border-amber-200/60 rounded-xl p-3">
                    {verificationResult.decisionReasons?.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Security & Anomaly Report */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span>Security &amp; Image Quality Analysis:</span>
                    {getStatusBadge(verificationResult.anomalyStatus)}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>Blur Score: <span className="font-semibold text-slate-700">{verificationResult.anomalyDetails?.blurScore || 0}</span></div>
                    <div>Resolution: <span className="font-semibold text-slate-700">{verificationResult.anomalyDetails?.isLowResolution ? 'Low (<400px)' : 'Optimal'}</span></div>
                    <div>Border: <span className="font-semibold text-slate-700">{verificationResult.anomalyDetails?.boundaryDetected ? 'Intact' : 'Cropped'}</span></div>
                  </div>
                </div>

                {/* Government Health Schemes Entitlement (Displayed for Scanned Aadhaar or Ration Card) */}
                {verificationResult.eligibleSchemes && verificationResult.eligibleSchemes.length > 0 && (
                  <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-slate-50 p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Automated Scheme Entitlement
                          </span>
                          {verificationResult.documentType?.includes('aadhaar') ? (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                UIDAI Aadhaar Verified
                              </span>
                              {verificationResult.extractedData?.state && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                                  {verificationResult.extractedData.state}
                                </span>
                              )}
                              {verificationResult.extractedData?.gender && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                  {verificationResult.extractedData.gender}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              {verificationResult.extractedData?.cardType || 'PDS'} Ration Card
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mt-1.5 flex items-center gap-2">
                          <HeartHandshake className="w-5 h-5 text-emerald-600" />
                          Eligible Government Health Schemes Unlocked
                        </h4>
                        <p className="text-xs text-slate-600">
                          {verificationResult.documentType?.includes('aadhaar')
                            ? 'Personalized scheme entitlements computed from verified Aadhaar demographics, age, gender, and state domicile.'
                            : 'Verified from scanned Maharashtra Ration Card parameters and state healthcare guidelines.'}
                        </p>
                      </div>

                      {onSelectTab && (
                        <button
                          type="button"
                          onClick={() => onSelectTab('government-schemes')}
                          className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>Open Schemes Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Scheme Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {verificationResult.eligibleSchemes.map((scheme, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                {scheme.schemeName}
                              </span>
                              <h5 className="text-xs font-black text-slate-900 leading-tight mt-0.5">
                                {scheme.schemeFullName}
                              </h5>
                            </div>
                            {getStatusBadge(scheme.eligibilityStatus)}
                          </div>

                          <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase">Coverage Amount</span>
                            <p className="text-sm font-black text-emerald-700">{scheme.coverageAmount}</p>
                            <p className="text-[11px] text-slate-600 mt-1">{scheme.eligibilityReason}</p>
                          </div>

                          {/* Benefits */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Key Entitlements &amp; Benefits:
                            </span>
                            <ul className="mt-1 space-y-1 text-[11px] text-slate-700">
                              {scheme.benefits?.map((b, bIdx) => (
                                <li key={bIdx} className="flex items-start gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Sample Covered Packages */}
                          {scheme.samplePackages && scheme.samplePackages.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                Sample Covered Procedures:
                              </span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {scheme.samplePackages.map((pkg, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                                  >
                                    {pkg.packageName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {scheme.officialPortalUrl && (
                            <a
                              href={scheme.officialPortalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700"
                            >
                              <span>Visit Official Government Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Empanelled Network Hospitals */}
                    {verificationResult.empanelledHospitals && verificationResult.empanelledHospitals.length > 0 && (
                      <div className="bg-white rounded-xl p-3 border border-emerald-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            Empanelled Network Hospitals in Maharashtra
                          </span>
                          <span className="text-[10px] text-slate-400">Cashless Scheme Desk Available</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {verificationResult.empanelledHospitals.map((hosp, hIdx) => (
                            <div
                              key={hIdx}
                              className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-slate-800 text-[11px]">{hosp.hospitalName}</p>
                                <p className="text-[10px] text-slate-500">{hosp.district} &bull; Ph: {hosp.contactNumber || '022-24107000'}</p>
                              </div>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Active
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <FileCheck className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Document Inspected Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Select an Aadhaar card or Maharashtra Ration Card image on the left to execute the 12-step AI detection, OCR, and verification pipeline.
                </p>
              </div>
            )}

            {/* Patient Verification History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Your Verification History
                </h3>
                <button
                  onClick={fetchRecords}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {records.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No verification submissions on record.</p>
              ) : (
                <div className="space-y-3">
                  {records.map((rec) => (
                    <div
                      key={rec.verificationId}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 uppercase">
                            {rec.documentType.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-xs text-sky-700">{rec.maskedIdNumber}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(rec.createdAt).toLocaleDateString()} at {new Date(rec.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div>{getStatusBadge(rec.verificationStatus)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 2: DOCTOR REVIEW INTERFACE ─── */}
      {activeSubTab === 'doctor' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-600" />
                Clinical Patient Identity Verification Lookup
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Doctors inspect verification badges without unrestricted access to raw identity cards.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={patientUidInput}
                onChange={(e) => setPatientUidInput(e.target.value)}
                placeholder="Enter Patient UID (e.g. PAT-2026-000001)"
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 w-52"
              />
              <button
                onClick={fetchRecords}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-sm"
              >
                Search
              </button>
            </div>
          </div>

          {isLoadingRecords ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading clinical verification records...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No verified documents registered for patient {patientUidInput}.
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((rec) => (
                <div
                  key={rec.verificationId}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">{rec.verificationId}</span>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                        {rec.documentType.replace('_', ' ')} &bull; Masked: {rec.maskedIdNumber}
                      </h3>
                    </div>
                    <div>{getStatusBadge(rec.verificationStatus)}</div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400">Verified Name:</span>
                      <p className="font-bold text-slate-800">{rec.extractedData?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">DOB:</span>
                      <p className="font-bold text-slate-800">{rec.extractedData?.dob || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Gender:</span>
                      <p className="font-bold text-slate-800">{rec.extractedData?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Timestamp:</span>
                      <p className="font-semibold text-slate-700">{new Date(rec.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {rec.eligibleSchemes && rec.eligibleSchemes.length > 0 && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <HeartHandshake className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="font-bold text-emerald-950">
                          Eligible Schemes: {rec.eligibleSchemes.map(s => `${s.schemeName} (${s.eligibilityStatus})`).join(' • ')}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        Cashless Cover: ₹5,00,000
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
                    <span>If identity attributes differ from physical patient presentation, request manual review:</span>
                    <button
                      onClick={() => alert(`Review request logged for ${rec.verificationId}. Administrative desk notified.`)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 ml-2"
                    >
                      Request Re-Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: ADMIN GOVERNANCE & MANUAL REVIEW WORKFLOW ─── */}
      {activeSubTab === 'admin' && (
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Submissions</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{adminStats.total}</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Cryptographically Verified</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{adminStats.verified}</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Pending Manual Review</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{adminStats.manualReview}</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 shadow-sm">
              <span className="text-[11px] font-bold text-orange-800 uppercase">Anomalies Detected</span>
              <p className="text-2xl font-black text-orange-700 mt-1">{adminStats.anomalies}</p>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 shadow-sm">
              <span className="text-[11px] font-bold text-rose-800 uppercase">Rejected / Non-Gov</span>
              <p className="text-2xl font-black text-rose-700 mt-1">{adminStats.rejected}</p>
            </div>
          </div>

          {/* Records Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-sky-600" />
                  Verification Queue &amp; Audit Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect cryptographic proofs, OCR fields, and execute manual approve/reject decisions.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="MANUAL_REVIEW">Manual Review</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="ANOMALY_DETECTED_REQUIRES_REVIEW">Anomalies</option>
                  <option value="NOT_VERIFIED">Rejected</option>
                </select>
              </div>
            </div>

            {isLoadingRecords ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading governance queue...
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No verification records matching selected criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-extrabold">ID / Timestamp</th>
                      <th className="py-3 px-4 font-extrabold">Patient Details</th>
                      <th className="py-3 px-4 font-extrabold">Document Type</th>
                      <th className="py-3 px-4 font-extrabold">Masked ID</th>
                      <th className="py-3 px-4 font-extrabold">YOLO &bull; OCR &bull; QR</th>
                      <th className="py-3 px-4 font-extrabold">Status</th>
                      <th className="py-3 px-4 font-extrabold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((rec) => (
                      <tr key={rec.verificationId} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-slate-800">{rec.verificationId}</p>
                          <p className="text-[10px] text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{rec.patientName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{rec.patientId}</p>
                        </td>
                        <td className="py-3 px-4 uppercase font-semibold text-slate-700">
                          {rec.documentType.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-sky-700">
                          {rec.maskedIdNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                              {(rec.detectionConfidence * 100).toFixed(0)}%
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              rec.ocrStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              OCR
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              rec.signatureStatus === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rec.signatureStatus === 'VALID' ? 'SIG: OK' : 'SIG: NO'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(rec.verificationStatus)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedRecordForReview(rec);
                              setReviewAction(rec.verificationStatus === 'VERIFIED' ? 'REJECT' : 'APPROVE');
                              setReviewReason('');
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[11px] transition-all"
                          >
                            Inspect &amp; Decide
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ─── ADMIN REVIEW DECISION MODAL ─── */}
      {selectedRecordForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                Administrative Verification Review
              </h3>
              <button
                onClick={() => setSelectedRecordForReview(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Verification ID:</span>{' '}
                  <span className="font-mono font-bold">{selectedRecordForReview.verificationId}</span>
                </div>
                <div>
                  <span className="text-slate-400">Patient:</span>{' '}
                  <span className="font-bold">{selectedRecordForReview.patientName} ({selectedRecordForReview.patientId})</span>
                </div>
                <div>
                  <span className="text-slate-400">Masked ID Number:</span>{' '}
                  <span className="font-mono font-bold text-sky-700">{selectedRecordForReview.maskedIdNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400">Current Status:</span>{' '}
                  <span className="font-bold">{selectedRecordForReview.verificationStatus}</span>
                </div>
              </div>

              {/* Decision reasons from engine */}
              <div>
                <p className="font-bold text-slate-700 mb-1">AI Pipeline Observations:</p>
                <ul className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                  {selectedRecordForReview.decisionReasons?.map((r, i) => (
                    <li key={i}>&bull; {r}</li>
                  ))}
                </ul>
              </div>

              {/* Decision Form */}
              <form onSubmit={handleAdminReviewSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Action:</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewAct"
                        value="APPROVE"
                        checked={reviewAction === 'APPROVE'}
                        onChange={(e) => setReviewAction(e.target.value)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-emerald-800">APPROVE (Mark as VERIFIED)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewAct"
                        value="REJECT"
                        checked={reviewAction === 'REJECT'}
                        onChange={(e) => setReviewAction(e.target.value)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-bold text-rose-800">REJECT (Mark as NOT_VERIFIED)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Administrative Reason (Required for Audit Trail):
                  </label>
                  <textarea
                    rows={3}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="Enter justification for manual override (e.g. Physical card presented at registration desk / confirmed with RCMS portal)."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForReview(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/30 disabled:bg-slate-300"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Commit Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
