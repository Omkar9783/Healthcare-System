import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { ClinicalSummaryModal } from '../components/ClinicalSummaryModal';
import { VitalsTrendChart } from '../components/VitalsTrendChart';
import { 
  Users, 
  Calendar, 
  FlaskConical, 
  Search, 
  Sparkles, 
  FileText, 
  Pill, 
  Heart, 
  CheckCircle2, 
  Lock, 
  Plus,
  RefreshCw,
  QrCode
} from 'lucide-react';

export const DoctorDashboardView = ({ onOpenQRScanner, selectedPatientUid: externalPatientUid, onSelectPatient }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientUid, setSelectedPatientUid] = useState(externalPatientUid || 'PAT-2026-000001');
  const [patientRecord, setPatientRecord] = useState(null);
  const [activeRecordTab, setActiveRecordTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRecord, setLoadingRecord] = useState(false);

  // New Record Form State
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [newRecordData, setNewRecordData] = useState({ chiefComplaint: '', diagnosis: '', treatmentNotes: '' });
  
  // AI Summary Modal
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    fetchPatientsList();
  }, []);

  useEffect(() => {
    if (externalPatientUid) {
      setSelectedPatientUid(externalPatientUid);
    }
  }, [externalPatientUid]);

  useEffect(() => {
    if (selectedPatientUid) {
      fetchPatientRecord(selectedPatientUid);
    }
  }, [selectedPatientUid]);

  const handlePatientSelect = (uid) => {
    setSelectedPatientUid(uid);
    if (onSelectPatient) onSelectPatient(uid);
  };

  const fetchPatientsList = async () => {
    try {
      const res = await apiFetch('/patients');
      if (res.success) setPatients(res.patients);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPatientRecord = async (uid) => {
    if (!uid) return;
    try {
      setLoadingRecord(true);
      const res = await apiFetch(`/patients/${uid}`);
      if (res.success) {
        setPatientRecord(res);
      }
    } catch (err) {
      console.warn('Unable to fetch patient record:', err.message);
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/medical-records', {
        method: 'POST',
        body: JSON.stringify({
          patientUid: selectedPatientUid,
          ...newRecordData
        })
      });

      if (res.success) {
        setShowNewRecordModal(false);
        setNewRecordData({ chiefComplaint: '', diagnosis: '', treatmentNotes: '' });
        fetchPatientRecord(selectedPatientUid);
      }
    } catch (err) {
      alert('Failed to save record: ' + err.message);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.uid.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Today's Appointments</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">4 Patients</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Assigned Patients</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{patients.length} Active</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Pending Lab Reviews</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">2 Reports</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Identity QR Scan</span>
            <button
              onClick={onOpenQRScanner}
              className="mt-1 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan Patient</span>
            </button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Grid: Patient Selector Sidebar + Patient Full Record View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Patient Search & List Column */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col h-[650px]">
          <h3 className="font-bold text-xs text-slate-900 mb-3">Authorized Patient Roster</h3>
          
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search UID or Name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredPatients.map(p => (
              <button
                key={p.uid}
                onClick={() => handlePatientSelect(p.uid)}
                className={`w-full p-3 rounded-xl text-left transition-all border ${
                  selectedPatientUid === p.uid 
                    ? 'bg-sky-50 border-sky-300 text-sky-950 font-semibold shadow-2xs' 
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{p.name}</span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                    {p.uid}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {p.gender} • Blood: <span className="font-bold">{p.bloodGroup}</span>
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Full Record View */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col min-h-[650px]">
          
          {loadingRecord ? (
            <div className="py-24 text-center my-auto">
              <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Validating Context Access & Fetching Patient Record...</p>
            </div>
          ) : patientRecord ? (
            <>
              {/* Record Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-extrabold text-slate-900">{patientRecord.patient.name}</h2>
                    <span className="font-mono text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                      {patientRecord.patient.uid}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    DOB: {patientRecord.patient.dateOfBirth} | Gender: {patientRecord.patient.gender} | Blood: <span className="font-bold text-slate-800">{patientRecord.patient.bloodGroup}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Clinical Summary</span>
                  </button>

                  <button
                    onClick={() => setShowNewRecordModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs flex items-center space-x-1 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Consultation Note</span>
                  </button>
                </div>
              </div>

              {/* Record Navigation Tabs */}
              <div className="flex items-center space-x-1 border-b border-slate-200 mb-5 overflow-x-auto text-xs font-medium">
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'history', label: 'Medical History', icon: FileText },
                  { id: 'allergies', label: 'Allergies & Conditions', icon: Heart },
                  { id: 'vitals', label: 'Vitals', icon: Heart },
                  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
                  { id: 'lab-reports', label: 'Lab Reports', icon: FlaskConical },
                  { id: 'consents', label: 'Consents', icon: Lock }
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveRecordTab(t.id)}
                      className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-semibold transition-all ${
                        activeRecordTab === t.id
                          ? 'border-sky-600 text-sky-600'
                          : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Record Content Panes */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                
                {activeRecordTab === 'overview' && (
                  <div className="space-y-4">
                    <VitalsTrendChart vitalsList={patientRecord.vitalsList} />

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-xs text-slate-900 mb-2">Recent Clinical Diagnoses</h4>
                      {patientRecord.medicalRecords.length > 0 ? (
                        <div className="space-y-3">
                          {patientRecord.medicalRecords.map(r => (
                            <div key={r._id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{r.diagnosis}</span>
                                <span className="text-[10px] text-slate-400">{new Date(r.encounterDate).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-600 mt-1">Complaint: {r.chiefComplaint}</p>
                              <p className="text-slate-700 font-medium mt-1">Notes: {r.treatmentNotes}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No prior clinical diagnoses recorded.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeRecordTab === 'history' && (
                  <div className="space-y-3">
                    {patientRecord.medicalRecords.map(r => (
                      <div key={r._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-slate-900">{r.diagnosis}</span>
                          <span className="text-xs text-slate-500">{new Date(r.encounterDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600"><span className="font-bold">Attending Doctor:</span> {r.doctorName} ({r.department})</p>
                        <p className="text-slate-700"><span className="font-bold">Chief Complaint:</span> {r.chiefComplaint}</p>
                        <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-2 font-mono text-[11px]">{r.treatmentNotes}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeRecordTab === 'allergies' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50/60 rounded-xl border border-red-200">
                      <h4 className="font-bold text-xs text-red-900 mb-2">Recorded Allergies</h4>
                      {patientRecord.patient.allergies && patientRecord.patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {patientRecord.patient.allergies.map((a, i) => (
                            <div key={i} className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs text-red-800 font-semibold shadow-2xs">
                              {a.allergen} — Severity: {a.severity} ({a.reaction})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">No known drug allergies reported.</p>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-xs text-slate-900 mb-2">Chronic Conditions</h4>
                      <div className="flex flex-wrap gap-2">
                        {patientRecord.patient.chronicConditions.map((c, i) => (
                          <span key={i} className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeRecordTab === 'vitals' && (
                  <div className="space-y-3">
                    {patientRecord.vitalsList.map(v => (
                      <div key={v._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-5 gap-2 text-xs">
                        <div><span className="text-slate-500 block text-[10px]">Blood Pressure</span><span className="font-bold text-slate-900">{v.bloodPressure}</span></div>
                        <div><span className="text-slate-500 block text-[10px]">Heart Rate</span><span className="font-bold text-slate-900">{v.heartRate} bpm</span></div>
                        <div><span className="text-slate-500 block text-[10px]">SpO2</span><span className="font-bold text-slate-900">{v.spO2}%</span></div>
                        <div><span className="text-slate-500 block text-[10px]">Temperature</span><span className="font-bold text-slate-900">{v.temperature}°C</span></div>
                        <div><span className="text-slate-500 block text-[10px]">Recorded By</span><span className="font-semibold text-sky-700">{v.recordedByName}</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {activeRecordTab === 'prescriptions' && (
                  <div className="space-y-3">
                    {patientRecord.prescriptions.map(p => (
                      <div key={p._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{p.diagnosis}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.dispensingStatus === 'Dispensed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {p.dispensingStatus}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {p.medicines.map((m, i) => (
                            <div key={i} className="p-2 bg-white rounded border border-slate-200 flex justify-between font-mono text-[11px]">
                              <span>{m.name} ({m.dosage})</span>
                              <span className="text-slate-600">{m.frequency} — {m.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeRecordTab === 'lab-reports' && (
                  <div className="space-y-3">
                    {patientRecord.labReports.map(l => (
                      <div key={l._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{l.testName} ({l.testCategory})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                            {l.status}
                          </span>
                        </div>
                        <p className="text-slate-600">{l.resultSummary || 'Awaiting lab processing findings.'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeRecordTab === 'consents' && (
                  <div className="space-y-3">
                    {patientRecord.activeConsents.map(c => (
                      <div key={c._id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-emerald-950">Consent Granted by Patient</p>
                          <p className="text-emerald-800 text-[11px]">Purpose: {c.purpose}</p>
                        </div>
                        <span className="text-[10px] bg-white px-2 py-1 rounded text-emerald-800 font-bold border border-emerald-200">
                          Active Consent
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </>
          ) : (
            <div className="py-24 text-center my-auto">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Select a patient from roster or scan patient QR</p>
            </div>
          )}

        </div>

      </div>

      {/* Add New Medical Record Consultation Modal */}
      {showNewRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-4">Add Consultation Record ({selectedPatientUid})</h3>
            <form onSubmit={handleCreateRecord} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint</label>
                <input
                  type="text"
                  required
                  value={newRecordData.chiefComplaint}
                  onChange={(e) => setNewRecordData({ ...newRecordData, chiefComplaint: e.target.value })}
                  placeholder="e.g. Chest pain and fatigue"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  required
                  value={newRecordData.diagnosis}
                  onChange={(e) => setNewRecordData({ ...newRecordData, diagnosis: e.target.value })}
                  placeholder="e.g. Stage 1 Essential Hypertension"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Notes & Plan</label>
                <textarea
                  required
                  rows={4}
                  value={newRecordData.treatmentNotes}
                  onChange={(e) => setNewRecordData({ ...newRecordData, treatmentNotes: e.target.value })}
                  placeholder="Clinical observations and dosage modifications..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowNewRecordModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-xs">Save Clinical Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      <ClinicalSummaryModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        patientUid={selectedPatientUid}
      />

    </div>
  );
};
