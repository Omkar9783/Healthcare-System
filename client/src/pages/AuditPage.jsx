import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { ShieldAlert, Search, RefreshCw, CheckCircle2, XCircle, Filter } from 'lucide-react';

export const AuditPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/audit-logs');
      if (res.success) setAuditLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.auditId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.patientUid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Immutable System Audit Logs</h1>
            <p className="text-xs text-slate-500 mt-0.5">Append-only security event transparency for HIPAA & GDPR compliance</p>
          </div>
        </div>

        <button onClick={fetchAuditLogs} className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Audit ID, User, Patient UID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
          >
            <option value="ALL">All Event Actions</option>
            <option value="QR_SCANNED">QR Scanned</option>
            <option value="PATIENT_VIEWED">Patient Viewed</option>
            <option value="EMERGENCY_ACCESS_REQUESTED">Emergency Access</option>
            <option value="CONSENT_GRANTED">Consent Granted</option>
            <option value="CONSENT_REVOKED">Consent Revoked</option>
          </select>
        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Fetching audit trail events...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 font-semibold">
                <tr>
                  <th className="p-3.5">Audit ID</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor (Role)</th>
                  <th className="p-3.5">Patient UID</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Purpose</th>
                  <th className="p-3.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">{log.auditId}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{log.userName}</span>
                      <span className="block text-[10px] text-sky-700 font-semibold">{log.userRole}</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-sky-700">{log.patientUid}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{log.purpose}</td>
                    <td className="p-3.5">
                      {log.result === 'SUCCESS' ? (
                        <span className="flex items-center text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" /> SUCCESS
                        </span>
                      ) : (
                        <span className="flex items-center text-rose-700 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-rose-500 mr-1" /> DENIED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
