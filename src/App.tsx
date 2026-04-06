import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Dashboard from './components/dashboard/Dashboard';
import RABCalculator from './components/rab/RABCalculator';
import AHSPDatabase from './components/ahsp/AHSPDatabase';
import DailyLog from './components/daily-log/DailyLog';
import ProjectManagement from './components/rab/ProjectManagement';
import StructuralAnalysis from './components/analysis/StructuralAnalysis';
import AuthPage from './components/auth/AuthPage';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfService from './components/legal/TermsOfService';
import AboutUs from './components/legal/AboutUs';
import Contact from './components/legal/Contact';
import { useStore } from './store/useStore';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastProvider } from './components/common/Toast';
import Onboarding from './components/common/Onboarding';
import AIChat from './components/common/AIChat';

function App() {
  const { activeTab, isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <ToastProvider><AuthPage /></ToastProvider>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'kalkulator':
        return <RABCalculator />;
      case 'ahsp':
        return <AHSPDatabase />;
      case 'buku-harian':
        return <DailyLog />;
      case 'manajemen':
        return <ProjectManagement />;
      case 'analysis':
        return <StructuralAnalysis />;
      case 'privacy-policy':
        return <PrivacyPolicy />;
      case 'terms-of-service':
        return <TermsOfService />;
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <Contact />;
      case 'notifikasi':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-bounce">
              <span className="text-3xl font-bold">!</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Belum Ada Notifikasi</h2>
            <p className="text-text-secondary max-w-md">
              Anda akan menerima pembaruan di sini saat ada aktivitas baru pada proyek atau sistem.
            </p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <ToastProvider>
      <Onboarding />
      <AIChat />
      <div className="min-h-screen bg-background text-text-primary flex flex-col">
        <Sidebar />
        <Navbar />
        
        <main className="pl-64 pt-20 transition-all duration-300 flex-1 flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-8"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
          <Footer />
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
