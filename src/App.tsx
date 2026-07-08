import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, ArrowLeftRight, Menu } from 'lucide-react';
import CitizenPortal from './components/CitizenPortal.js';
import LoginView from './components/LoginView.js';
import Sidebar, { SidebarTab } from './components/Sidebar.js';
import DashboardView from './components/DashboardView.js';
import DigestView from './components/DigestView.js';
import SettingsView from './components/SettingsView.js';
import Toast, { ToastProps } from './components/Toast.js';

type MainView = 'citizen' | 'login' | 'staff';

export default function App() {
  const [currentView, setCurrentView] = useState<MainView>('citizen');
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [staffUser, setStaffUser] = useState<{ email: string; name: string } | null>(null);
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAddToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, onClose: handleCloseToast }]);
  };

  const handleCloseToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (email: string, name: string) => {
    setStaffUser({ email, name });
    setCurrentView('staff');
    setActiveTab('dashboard');
    handleAddToast(`Welcome back, ${name}! Session initialized.`, 'success');
  };

  const handleLogout = () => {
    setStaffUser(null);
    setCurrentView('citizen');
    handleAddToast('Staff session terminated successfully.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Floating notifications container */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none select-none [&>*]:pointer-events-auto">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast key={t.id} {...t} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        
        {/* PUBLIC CITIZEN PORTAL */}
        {currentView === 'citizen' && (
          <motion.div
            key="citizen-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <CitizenPortal
              onAddToast={handleAddToast}
              onGoToLogin={() => setCurrentView('login')}
            />
          </motion.div>
        )}

        {/* SECURE LOGIN GATEWAY */}
        {currentView === 'login' && (
          <motion.div
            key="login-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <LoginView
              onLoginSuccess={handleLoginSuccess}
              onBackToPortal={() => setCurrentView('citizen')}
            />
          </motion.div>
        )}

        {/* PROTECTED STAFF OPERATIONS BASE */}
        {currentView === 'staff' && staffUser && (
          <motion.div
            key="staff-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-screen overflow-hidden w-full relative bg-slate-50 text-slate-800"
          >
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity" 
                onClick={() => setSidebarOpen(false)} 
              />
            )}

            {/* Left rail navigation */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
              }}
              staffName={staffUser.name}
              staffEmail={staffUser.email}
              onLogout={handleLogout}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            {/* Right main workspace pane */}
            <div className="flex-1 h-screen overflow-y-auto bg-slate-50 text-slate-800 pl-0 lg:pl-[240px] flex flex-col">
              
              {/* Context header helper for easier cross navigation */}
              <div className="bg-white text-slate-600 px-4 sm:px-8 py-3 text-[10px] font-semibold flex justify-between items-center border-b border-slate-200 select-none shrink-0">
                <span className="flex items-center gap-2">
                  {/* Mobile Hamburger toggle button */}
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors mr-1"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="tracking-wider uppercase text-[10px] text-slate-700 hidden xs:inline">
                    MP WORKSPACE • GUEST SESSION
                  </span>
                  <span className="tracking-wider uppercase text-[10px] text-slate-700 xs:hidden">
                    MP OFFICE
                  </span>
                </span>
                <button
                  onClick={() => {
                    setCurrentView('citizen');
                    handleAddToast('Returned to public submission view.', 'success');
                  }}
                  className="hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                >
                  <ArrowLeftRight className="w-3 h-3 text-indigo-600" />
                  <span className="hidden sm:inline">Return to Public Portal</span>
                  <span className="sm:hidden">Public Portal</span>
                </button>
              </div>

              {/* Workspace subviews selector */}
              <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto flex-1">
                <AnimatePresence mode="wait">
                  {activeTab === 'dashboard' && (
                    <motion.div
                      key="tab-dashboard"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <DashboardView onAddToast={handleAddToast} />
                    </motion.div>
                  )}

                  {activeTab === 'grievances' && (
                    <motion.div
                      key="tab-grievances"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <DashboardView onAddToast={handleAddToast} />
                    </motion.div>
                  )}

                  {activeTab === 'digest' && (
                    <motion.div
                      key="tab-digest"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <DigestView onAddToast={handleAddToast} staffEmail={staffUser.email} />
                    </motion.div>
                  )}

                  {activeTab === 'settings' && (
                    <motion.div
                      key="tab-settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <SettingsView onAddToast={handleAddToast} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
