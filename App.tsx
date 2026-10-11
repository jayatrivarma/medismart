import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { FindDoctorsPage } from './pages/FindDoctorsPage';
import { DoctorProfilePage } from './pages/DoctorProfilePage';
import { BookAppointmentPage } from './pages/BookAppointmentPage';
import { AppointmentConfirmationPage } from './pages/AppointmentConfirmationPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { HospitalDirectoryPage } from './pages/HospitalDirectoryPage';
import { MediSmartAssistantPage } from './pages/MediSmartAssistantPage';
import { AuthPages } from './pages/AuthPages';
import { AboutPage, FAQPage, PrivacyPage, TermsPage, PatientProfilePage } from './pages/InfoPages';
import { DigitalAppointmentCard } from './components/DigitalAppointmentCard';
import { LiveQueueWidget } from './components/LiveQueueWidget';
import { Doctor, Hospital } from './data/vizagDoctors';
import { Appointment } from './services/api';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [initialSlotTime, setInitialSlotTime] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchSpecialty, setSearchSpecialty] = useState<string>('');

  const navigate = (tab: string, param?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'doctor-profile' && param) {
      setSelectedDoctor(param);
    } else if (tab === 'book-appointment' && param) {
      setSelectedDoctor(param.doctor || param);
      setInitialSlotTime(param.slotTime);
    } else if (tab === 'appointment-confirmation' && param) {
      setSelectedAppointment(param);
    } else if (tab === 'appointment-card' && param) {
      setSelectedAppointment(param);
    } else if (tab === 'live-queue' && param) {
      setSelectedAppointment(param);
    }
    setCurrentTab(tab);
  };

  const handleHeroSearch = (query: string, specialty?: string) => {
    setSearchQuery(query);
    setSearchSpecialty(specialty || '');
    setCurrentTab('doctors');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Universal Navigation */}
      <Navbar currentTab={currentTab} onNavigate={navigate} />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={navigate}
            onSearchDoctors={handleHeroSearch}
          />
        )}

        {currentTab === 'doctors' && (
          <FindDoctorsPage
            initialSearch={searchQuery}
            initialSpecialty={searchSpecialty}
            onViewDoctor={(doc) => navigate('doctor-profile', doc)}
            onBookDoctor={(doc) => navigate('book-appointment', { doctor: doc })}
          />
        )}

        {currentTab === 'doctor-profile' && selectedDoctor && (
          <DoctorProfilePage
            doctor={selectedDoctor}
            onBack={() => navigate('doctors')}
            onBookAppointment={(doc, slotTime) => navigate('book-appointment', { doctor: doc, slotTime })}
          />
        )}

        {currentTab === 'book-appointment' && selectedDoctor && (
          <BookAppointmentPage
            doctor={selectedDoctor}
            initialTime={initialSlotTime}
            onBack={() => navigate('doctor-profile', selectedDoctor)}
            onBookingSuccess={(apt) => navigate('appointment-confirmation', apt)}
            onPromptLogin={() => navigate('login')}
          />
        )}

        {currentTab === 'appointment-confirmation' && selectedAppointment && (
          <AppointmentConfirmationPage
            appointment={selectedAppointment}
            onTrackQueue={(apt) => navigate('live-queue', apt)}
            onGoToDashboard={() => navigate('my-appointments')}
            onAskAssistant={() => navigate('assistant')}
          />
        )}

        {currentTab === 'my-appointments' && (
          <MyAppointmentsPage
            onViewCard={(apt) => navigate('appointment-card', apt)}
            onTrackQueue={(apt) => navigate('live-queue', apt)}
            onBookNew={() => navigate('doctors')}
          />
        )}

        {currentTab === 'appointment-card' && selectedAppointment && (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <DigitalAppointmentCard
              appointment={selectedAppointment}
              onClose={() => navigate('my-appointments')}
            />
          </div>
        )}

        {currentTab === 'live-queue' && selectedAppointment && (
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
            <button
              onClick={() => navigate('my-appointments')}
              className="text-xs font-semibold text-slate-600 hover:text-teal-700"
            >
              ← Back to My Appointments
            </button>
            <LiveQueueWidget appointment={selectedAppointment} />
          </div>
        )}

        {currentTab === 'patient-dashboard' && (
          <PatientDashboardPage onNavigate={navigate} />
        )}

        {currentTab === 'doctor-dashboard' && (
          <DoctorDashboardPage />
        )}

        {currentTab === 'doctor-queue' && (
          <DoctorDashboardPage />
        )}

        {currentTab === 'admin-dashboard' && (
          <AdminDashboardPage />
        )}

        {currentTab === 'hospitals' && (
          <HospitalDirectoryPage
            onSelectHospital={(hosp) => {
              setSearchQuery(hosp.network);
              setCurrentTab('doctors');
            }}
          />
        )}

        {currentTab === 'assistant' && (
          <MediSmartAssistantPage />
        )}

        {currentTab === 'login' && (
          <AuthPages
            initialMode="login"
            onSuccess={() => {
              if (user?.role === 'doctor') navigate('doctor-dashboard');
              else if (user?.role === 'admin') navigate('admin-dashboard');
              else navigate('patient-dashboard');
            }}
          />
        )}

        {currentTab === 'register' && (
          <AuthPages
            initialMode="register"
            onSuccess={() => navigate('patient-dashboard')}
          />
        )}

        {currentTab === 'about' && <AboutPage />}
        {currentTab === 'faq' && <FAQPage />}
        {currentTab === 'privacy' && <PrivacyPage />}
        {currentTab === 'terms' && <TermsPage />}
        {currentTab === 'patient-profile' && <PatientProfilePage />}
      </main>

      {/* Universal Footer */}
      <Footer onNavigate={navigate} />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
