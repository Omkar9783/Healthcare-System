import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { FlaskConical, CheckCircle2, Clock, Upload, Plus, FileText, RefreshCw } from 'lucide-react';

export const LabDashboardView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // Results Form
  const [resultSummary, setResultSummary] = useState('');
  const [findingsText, setFindingsText] = useState('Hemoglobin: 14.2 g/dL (Normal); RBC: 4.8 million/mcL (Normal)');

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/labs');
      if (res.success) setReports(res.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResults = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      const res = await apiFetch(`/labs/${selectedReport._id}/results`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Completed',
          resultSummary: resultSummary || 'Pathology evaluation completed successfully.',
          attachmentUrl: 'https://medisecure.health/reports/sample-cbc.pdf'
        })
      });

      if (res.success) {
        setSelectedReport(null);
        fetchLabReports();
      }
    } catch (err) {
      alert('Failed to update lab results: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Pathology & Diagnostics Lab Station</h1>
            <p className="text-xs text-slate-500 mt-0.5">Process requested diagnostic tests and submit pathology findings</p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
          {reports.filter(r => r.status === 'Requested').length} Pending Orders
        </span>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900">Diagnostic Test Requests</h3>
          <button onClick={fetchLabReports} className="text-xs text-sky-600 font-semibold flex items-center space-x-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Orders</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading pathology orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Patient UID</th>
                  <th className="p-3.5">Patient Name</th>
                  <th className="p-3.5">Test Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Ordering Doctor</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-sky-700">{r.patientUid}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{r.patientName}</td>
                    <td className="p-3.5 font-bold text-slate-800">{r.testName}</td>
                    <td className="p-3.5 text-slate-600">{r.testCategory}</td>
                    <td className="p-3.5 text-slate-600">{r.requestedByDoctor}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {r.status === 'Requested' ? (
                        <button
                          onClick={() => {
                            setSelectedReport(r);
                            setResultSummary(`Normal physiological indicators observed for ${r.testName}.`);
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-xs"
                        >
                          Enter Results
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Report Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enter Result Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-2">Submit Lab Findings: {selectedReport.testName}</h3>
            <p className="text-xs text-slate-500 mb-4">Patient: <span className="font-bold text-slate-800">{selectedReport.patientName}</span> ({selectedReport.patientUid})</p>

            <form onSubmit={handleUpdateResults} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pathology Findings Summary</label>
                <textarea
                  rows={3}
                  required
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                ></textarea>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Diagnostic Report Attachment</span>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span>Report PDF Generated Automatically (Sample PDF)</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setSelectedReport(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-xs">Publish Lab Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
