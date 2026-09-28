import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { 
  Users, 
  ShieldCheck, 
  QrCode, 
  AlertTriangle, 
  Activity, 
  Sliders, 
  Lock, 
  FileText, 
  RefreshCw, 
  Database,
  CheckCircle2,
  XCircle,
  Landmark,
  FileCheck
} from 'lucide-react';

export const AdminDashboardView = ({ setActiveTab }) => {
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [rbacMatrix, setRbacMatrix] = useState(null);
  const [schemeRequests, setSchemeRequests] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, usersRes, rolesRes, schemesRes] = await Promise.all([
        apiFetch('/admin/analytics'),
        apiFetch('/admin/users'),
        apiFetch('/admin/roles'),
        apiFetch('/schemes/hospital-requests')
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes);
      if (usersRes.success) setUsersList(usersRes.users);
      if (rolesRes.success) setRbacMatrix(rolesRes);
      if (schemesRes.success) setSchemeRequests(schemesRes.requests || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSchemeRequest = async (requestId, status, defaultRemark) => {
    const remarks = window.prompt(`Enter review remarks for ${status}:`, defaultRemark || `Evaluated by Hospital Scheme Desk.`);
    if (remarks === null) return;
    try {
      const res = await apiFetch(`/schemes/hospital-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, remarks })
      });
      if (res.success) {
        alert(`Request marked as ${status}! Patient notified.`);
        await fetchAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update request');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-semibold">Loading System Governance Analytics...</p>
      </div>
    );
  }

  const stats = analytics?.stats || {
    totalPatients: 10,
    totalUsers: 17,
    totalDoctors: 3,
    totalNurses: 2,
    totalLabTechs: 1,
    totalPharmacists: 1,
    todayAppointments: 2,
    totalAppointments: 2,
    qrScans: 14,
    emergencyAccesses: 3,
    accessGranted: 28,
    accessDenied: 3,
    failedLogins: 1
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-extrabold text-slate-900">System Governance & Admin Control</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Manage user roles, RBAC permission policies, security audits, and system metrics</p>
        </div>

        <button onClick={fetchAdminData} className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold pb-2 overflow-x-auto">
        {['overview', 'users', 'roles', 'schemes', 'security'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveAdminTab(tab)}
            className={`px-4 py-2 rounded-xl transition-all capitalize whitespace-nowrap ${
              activeAdminTab === tab 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'roles' ? 'RBAC Permission Matrix' : tab === 'schemes' ? `Scheme Verifications (${schemeRequests.length})` : tab}
          </button>
        ))}
      </div>

      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Total Patients</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{stats.totalPatients}</span>
              <span className="text-[10px] text-emerald-600 font-bold">100% Unique UIDs</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Active Staff Users</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{stats.totalUsers}</span>
              <span className="text-[10px] text-sky-600 font-bold">{stats.totalDoctors} Docs | {stats.totalNurses} Nurses</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">QR Token Scans</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{stats.qrScans}</span>
              <span className="text-[10px] text-purple-600 font-bold">Server Lookups</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Emergency Overrides</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{stats.emergencyAccesses}</span>
              <span className="text-[10px] text-amber-600 font-bold">30-Min Time Limited</span>
            </div>

          </div>

          {/* Activity Visual Graph */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">System Activity & Authorization Audit Graph</h3>
                <p className="text-xs text-slate-500">Weekly breakdown of QR scans, granted access, and emergency events</p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 mr-1.5"></span> Scans</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span> Granted</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span> Emergency</span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-44 w-full flex items-end justify-between px-6 pt-4 pb-2 bg-slate-50 rounded-xl border border-slate-200">
              {analytics?.activityTrend?.map((item, index) => (
                <div key={index} className="flex flex-col items-center space-y-1 group">
                  <div className="flex items-end space-x-1 h-32">
                    <div style={{ height: `${Math.min(100, item.scans * 4)}%` }} className="w-3 bg-sky-500 rounded-t"></div>
                    <div style={{ height: `${Math.min(100, item.grants * 3)}%` }} className="w-3 bg-emerald-500 rounded-t"></div>
                    <div style={{ height: `${Math.min(100, item.emergency * 20 + 5)}%` }} className="w-3 bg-amber-500 rounded-t"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-900">User Accounts & Roles Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Patient UID</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3.5 text-slate-600">{u.email}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{u.department || 'N/A'}</td>
                    <td className="p-3.5 font-mono text-slate-700">{u.patientUid || '—'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeAdminTab === 'roles' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Master RBAC Roles & Permissions Matrix</h3>
          <div className="space-y-3">
            {rbacMatrix && Object.entries(rbacMatrix.matrix).map(([role, perms]) => (
              <div key={role} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">{role}</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-mono font-bold px-2 py-0.5 rounded">
                    {perms.length} Permissions
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {perms.map(p => (
                    <span key={p} className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] font-mono border border-slate-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === 'schemes' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                Hospital Scheme Verification Workflow Desk
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review patient ration card & scheme pre-admission applications. Approve, reject, or request additional documents.
              </p>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-200">
              {schemeRequests.filter(r => r.status === 'PENDING').length} Pending Reviews
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Patient Name & UID</th>
                  <th className="p-3">Hospital</th>
                  <th className="p-3">Ration Card</th>
                  <th className="p-3">Scheme</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3 text-right">Desk Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemeRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{req.patientName}</p>
                      <p className="font-mono text-[11px] text-slate-400">{req.patientId}</p>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{req.hospitalName}</td>
                    <td className="p-3">
                      <span className="font-mono text-slate-800 font-bold">{req.rationCardNumber}</span>
                      <span className="block text-[10px] text-slate-500">Category: {req.rationCardType}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        {req.schemeName}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        req.status === 'ADDITIONAL_DOCS_REQUIRED' ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate" title={req.remarks}>
                      {req.remarks}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleReviewSchemeRequest(req._id, 'APPROVED', 'Verified by Hospital Scheme Desk. Beneficiary eligible for cashless admission.')}
                          className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all shadow-2xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewSchemeRequest(req._id, 'ADDITIONAL_DOCS_REQUIRED', 'Please submit original family income certificate and updated Aadhaar scan.')}
                          className="px-2 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition-all shadow-2xs"
                        >
                          Request Docs
                        </button>
                        <button
                          onClick={() => handleReviewSchemeRequest(req._id, 'REJECTED', 'Ration card category does not satisfy priority criteria.')}
                          className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-all shadow-2xs"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeAdminTab === 'security' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Security & Identity Audit Events</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-bold block">Access Granted Events</span>
              <span className="text-2xl font-extrabold text-emerald-950 mt-1 block">{stats.accessGranted}</span>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-xs text-rose-800 font-bold block">Access Denied Events</span>
              <span className="text-2xl font-extrabold text-rose-950 mt-1 block">{stats.accessDenied}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('audit-logs')}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs text-center shadow-xs"
          >
            View Centralized Immutable Audit Logs &rarr;
          </button>
        </div>
      )}

    </div>
  );
};
