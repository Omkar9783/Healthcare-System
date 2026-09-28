import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../services/api';
import { RefreshCw, Ban, ShieldCheck, QrCode as QrIcon } from 'lucide-react';

export const PatientQRCard = ({ patient, onRefresh }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!patient) return null;

  const qrPayload = JSON.stringify({
    system: 'MediSecure-Identity',
    token: patient.qrToken || `MS-QR-${patient.uid}-DEFAULT`,
    uid: patient.uid,
    generatedAt: new Date().toISOString()
  });

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/qr/generate', {
        method: 'POST',
        body: JSON.stringify({ patientUid: patient.uid })
      });
      if (res.success) {
        setMessage('New secure QR token generated!');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setMessage('Failed to regenerate QR.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRevoke = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/qr/revoke', {
        method: 'POST',
        body: JSON.stringify({ patientUid: patient.uid })
      });
      if (res.success) {
        setMessage('QR token revoked!');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setMessage('Failed to revoke QR.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col items-center text-center relative overflow-hidden">
      
      {/* Card Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <QrIcon className="w-5 h-5 text-sky-600" />
          <span className="font-bold text-sm text-slate-800">{t('qr.myQrTitle')}</span>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
          {patient.uid}
        </span>
      </div>

      {/* Patient Avatar & Name */}
      <div className="mb-3">
        <h3 className="font-extrabold text-lg text-slate-900">{patient.name}</h3>
        <p className="text-xs text-slate-500">Blood Group: <span className="font-bold text-slate-700">{patient.bloodGroup}</span> | DOB: {patient.dateOfBirth}</p>
      </div>

      {/* QR Code Container */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner relative group my-2">
        {patient.qrRevoked ? (
          <div className="w-48 h-48 flex flex-col items-center justify-center text-center p-4 bg-red-50 rounded-xl border border-red-200">
            <Ban className="w-12 h-12 text-red-500 mb-2" />
            <p className="font-bold text-xs text-red-700">QR Access Revoked</p>
            <p className="text-[10px] text-red-500 mt-1">Regenerate token to restore access.</p>
          </div>
        ) : (
          <QRCodeSVG
            value={qrPayload}
            size={180}
            level="H"
            includeMargin={true}
          />
        )}
      </div>

      <p className="text-xs text-slate-600 font-medium mt-2">
        Scan for authorized healthcare access
      </p>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mt-4 w-full">
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('qr.regenerate')}</span>
        </button>

        <button
          onClick={handleRevoke}
          disabled={loading || patient.qrRevoked}
          className="flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <Ban className="w-3.5 h-3.5" />
          <span>{t('qr.revoke')}</span>
        </button>
      </div>

      {message && (
        <p className="text-xs font-semibold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200 mt-3 animate-fade-in">
          {message}
        </p>
      )}

      {/* Privacy Guarantee Note */}
      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-left flex items-start space-x-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>{t('qr.securityNotice')}</span>
      </div>

    </div>
  );
};
