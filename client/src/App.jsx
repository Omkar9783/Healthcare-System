import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DemoRoleSwitcher } from './components/DemoRoleSwitcher';
import { QRScannerModal } from './components/QRScannerModal';
import { EmergencyAccessModal } from './components/EmergencyAccessModal';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

import { PatientDashboardView } from './pages/PatientDashboardView';
import { DoctorDashboardView } from './pages/DoctorDashboardView';
import { NurseDashboardView } from './pages/NurseDashboardView';
import { LabDashboardView } from './pages/LabDashboardView';
import { PharmacistDashboardView } from './pages/PharmacistDashboardView';
import { AdminDashboardView } from './pages/AdminDashboardView';

import { ConsentPage } from './pages/ConsentPage';
import { AuditPage } from './pages/AuditPage';
import { SecurityPage } from './pages/SecurityPage';
import { GovernmentSchemesView } from './components/GovernmentSchemesView';

const MainAppContent = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'login', 'register', 'app'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatientUid, setSelectedPatientUid] = useState('PAT-2026-000001');

  // Modals state
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const handlePatientSelectFromQR = (patientUid) => {
    setSelectedPatientUid(patientUid);
    setIsQRScannerOpen(false);
    setActiveTab('dashboard');
  };

  // Render role-specific dashboard content
  const renderDashboardByRole = () => {
    if (!user) return null;
    switch (user.role) {
      case 'PATIENT':
        return <PatientDashboardView setActiveTab={setActiveTab} />;
      case 'DOCTOR':
        return (
          <DoctorDashboardView
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            selectedPatientUid={selectedPatientUid}
            onSelectPatient={setSelectedPatientUid}
          />
        );
      case 'NURSE':
        return (
          <NurseDashboardView
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            selectedPatientUid={selectedPatientUid}
            onSelectPatient={setSelectedPatientUid}
          />
        );
      case 'LAB_TECHNICIAN':
        return <LabDashboardView />;
      case 'PHARMACIST':
        return <PharmacistDashboardView />;
      case 'ADMIN':
        return <AdminDashboardView setActiveTab={setActiveTab} />;
      case 'EMERGENCY_STAFF':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <h2 className="text-xl font-extrabold text-amber-950">Emergency Response Duty Station</h2>
              <p className="text-xs text-amber-800 mt-1 mb-4">Request temporary 30-minute patient record overrides for emergency treatment</p>
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/30"
              >
                Launch Emergency Override Request
              </button>
            </div>
          </div>
        );
      default:
        return <PatientDashboardView setActiveTab={setActiveTab} />;
    }
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardByRole();
      case 'patients':
        return (
          <DoctorDashboardView
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            selectedPatientUid={selectedPatientUid}
            onSelectPatient={setSelectedPatientUid}
          />
        );
      case 'qr-scanner':
        return (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-lg mx-auto space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900">QR Identity Verification</h2>
            <p className="text-xs text-slate-500">Scan patient QR token for backend authorization lookup</p>
            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/30"
            >
              Open Camera / Token Scanner
            </button>
          </div>
        );
      case 'medical-records':
        return (
          <DoctorDashboardView
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            selectedPatientUid={selectedPatientUid}
            onSelectPatient={setSelectedPatientUid}
          />
        );
      case 'prescriptions':
        return <PharmacistDashboardView />;
      case 'lab-reports':
        return <LabDashboardView />;
      case 'appointments':
        return (
          <DoctorDashboardView
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            selectedPatientUid={selectedPatientUid}
            onSelectPatient={setSelectedPatientUid}
          />
        );
      case 'consent':
        return <ConsentPage />;
      case 'emergency':
        return (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-lg mx-auto space-y-4">
            <h2 className="text-xl font-extrabold text-amber-950">Emergency Access Protocol</h2>
            <p className="text-xs text-slate-500">Initiate 30-minute override for critical patient access</p>
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/30"
            >
              Open Emergency Access Portal
            </button>
          </div>
        );
      case 'audit-logs':
        return <AuditPage />;
      case 'admin':
        return <AdminDashboardView setActiveTab={setActiveTab} />;
      case 'government-schemes':
        return <GovernmentSchemesView onSelectTab={setActiveTab} />;
      case 'security':
        return <SecurityPage />;
      default:
        return renderDashboardByRole();
    }
  };

  // If user is NOT logged in and on landing/login/register pages
  if (!user) {
    if (currentView === 'login') {
      return (
        <LoginPage
          onRegisterClick={() => setCurrentView('register')}
          onHomeClick={() => setCurrentView('landing')}
        />
      );
    }
    if (currentView === 'register') {
      return (
        <RegisterPage
          onLoginClick={() => setCurrentView('login')}
          onHomeClick={() => setCurrentView('landing')}
        />
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <DemoRoleSwitcher />
        <Navbar
          onOpenQRScanner={() => setIsQRScannerOpen(true)}
          onOpenEmergency={() => setIsEmergencyModalOpen(true)}
          onLoginClick={() => setCurrentView('login')}
        />
        <LandingPage
          onGetStarted={() => setCurrentView('login')}
          onExploreSecurity={() => setCurrentView('login')}
        />
      </div>
    );
  }

  // Logged-In Application Layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1-Click Demo Switcher Toolbar */}
      <DemoRoleSwitcher />

      {/* Main Navbar */}
      <Navbar
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
      />

      {/* App Workspace with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Dynamic Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActiveTabContent()}
        </main>

      </div>

      {/* Global Modals */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onPatientSelect={handlePatientSelectFromQR}
      />

      <EmergencyAccessModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainAppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
