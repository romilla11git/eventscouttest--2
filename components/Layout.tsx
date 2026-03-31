"use client";

import React, { useState } from 'react';
import { User, UserRole, Notification } from '../types';
import { useToast } from './ToastProvider';
import IWorthEmblem from './IWorthEmblem';

interface LayoutProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRoleToggle: () => void;
  onLogout: () => void;
  notifications: Notification[];
  isDarkMode: boolean;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  user, activeTab, setActiveTab, onRoleToggle, onLogout, notifications,
  isDarkMode, onToggleTheme, children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const { showToast } = useToast();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-8">
        <div className="flex items-center space-x-4 mb-12">
          <IWorthEmblem size={44} />
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground leading-none">
              <span className="iw-gradient-text">Event</span>Scout
            </h1>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">iWorth Technologies</p>
          </div>
        </div>

        <nav className="space-y-2">
          {/* Reordered navigation to match strategic sidebar sequence */}
          {user?.role === UserRole.ADMIN && (
            <>
              <NavItem
                icon="fas fa-microchip"
                label="Neural Scrapers"
                active={activeTab === 'scrapers'}
                onClick={() => handleTabChange('scrapers')}
              />
              <NavItem
                icon="fas fa-database"
                label="Intelligence Feed"
                active={activeTab === 'admin'}
                onClick={() => handleTabChange('admin')}
              />
            </>
          )}

          <NavItem
            icon="fas fa-th-large"
            label="Command Center"
            active={activeTab === 'dashboard'}
            onClick={() => handleTabChange('dashboard')}
          />
          <NavItem
            icon="fas fa-brain"
            label="Intelligence Assistant"
            active={activeTab === 'assistant'}
            onClick={() => handleTabChange('assistant')}
          />

          {user?.role === UserRole.ADMIN && (
            <NavItem
              icon="fas fa-chart-line"
              label="Strategic Analytics"
              active={activeTab === 'analytics'}
              onClick={() => handleTabChange('analytics')}
            />
          )}

          {user?.role === UserRole.ADMIN && (
            <div className="pt-4 pb-3 text-[10px] font-black text-muted uppercase tracking-[0.2em] px-4 opacity-60">
              Strategic Assets
            </div>
          )}

          <NavItem
            icon="fas fa-calendar-alt"
            label="Operations Link"
            active={activeTab === 'calendar'}
            onClick={() => handleTabChange('calendar')}
          />

          {user?.role === UserRole.ADMIN && (
            <NavItem
              icon="fas fa-shield-halved"
              label="Personnel Audit"
              active={activeTab === 'users'}
              onClick={() => handleTabChange('users')}
            />
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-6">
        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <button onClick={() => { onToggleTheme(); showToast("Light Mode engaged · pure clarity"); }} className={`p-2 rounded-lg transition-all ${!isDarkMode ? 'bg-white shadow-sm text-amber-500' : 'text-gray-400 hover:text-white'}`} aria-label="Light Mode">
                <i className="fas fa-sun"></i>
              </button>
              <button onClick={() => { onToggleTheme(); showToast("Deep Space engaged · eye comfort optimized"); }} className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-gray-900 shadow-sm text-cyan-400' : 'text-gray-500 hover:text-gray-900'}`} aria-label="Dark Mode">
                <i className="fas fa-moon"></i>
              </button>
            </div>
            <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Deauthorize" aria-label="Logout">
              <i className="fas fa-power-off"></i>
            </button>
          </div>

          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center w-full p-2.5 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-card shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mr-3 shadow-inner">
              <i className="fas fa-fingerprint text-gray-400"></i>
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-xs font-black text-foreground truncate tracking-tight">{user?.email.split('@')[0]}</p>
              <p className="text-[9px] text-cyan-600 dark:text-cyan-500 uppercase font-black tracking-widest">{user?.role}</p>
            </div>
          </button>
        </div>

        <button
          onClick={() => {
            onRoleToggle();
            setIsMobileMenuOpen(false);
          }}
          className="w-full px-4 py-4 text-[10px] font-black bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-2xl hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-lg active:scale-95"
        >
          {user?.role === UserRole.ADMIN ? 'Enter Stealth View' : 'Elevate Privilege'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden transition-colors duration-500">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 glass-card border-none rounded-none flex-col shadow-2xl relative z-30 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Slide-over) */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
        <aside className={`absolute left-0 top-0 bottom-0 w-80 bg-card shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent />
        </aside>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background scroll-smooth flex flex-col relative z-10 font-sans">
        <header className="bg-card/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-border px-6 sm:px-10 py-4 flex justify-between items-center shadow-[0_1px_20px_rgba(15,23,42,0.25)]">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Open Menu"
            >
              <i className="fas fa-bars-staggered text-xl"></i>
            </button>
            <div className="flex items-center space-x-3">
              <IWorthEmblem size={32} />
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground">
                  EventScout
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  iWorth Technologies
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="hidden md:flex items-center bg-background border border-border rounded-full px-3 py-1.5 text-sm text-secondary w-56 lg:w-72">
              <i className="fas fa-magnifying-glass mr-2 text-xs text-[#9CA3AF]"></i>
              <input
                type="text"
                placeholder="Search intelligence feed..."
                className="bg-transparent border-none outline-none flex-1 text-xs text-foreground placeholder-[#9CA3AF]"
              />
            </div>
            <button
              onClick={() => {
                onToggleTheme();
                showToast(`Theme switched to ${!isDarkMode ? 'Dark' : 'Light'} Mode · eye comfort optimized`);
              }}
              className="flex items-center gap-2.5 bg-card-solid backdrop-blur-md border border-border rounded-[60px] px-4 py-2 text-[0.85rem] font-semibold text-secondary transition-all duration-200 hover:scale-[1.02] hover:border-secondary shadow-card"
              aria-label="Toggle theme"
            >
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-[1.1rem] text-secondary`}></i>
              <span className="hidden lg:inline">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <div className="relative group">
              <button className="p-2.5 bg-background rounded-full text-secondary hover:text-[#2563EB] transition-all relative" aria-label="Notifications">
                <i className="fas fa-bell text-sm"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[8px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white dark:border-[#0B1220] ring-4 ring-red-500/20">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            <div className="hidden sm:flex items-center space-x-2 rounded-full bg-background px-3 py-1.5 border border-border">
              <div className="h-6 w-6 rounded-full text-white flex items-center justify-center text-xs font-bold iw-gradient">
                {user?.email[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary">
                {user?.role ?? 'user'}
              </span>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-10 flex-1 relative animate-in fade-in duration-700">
          {/* Background Subtle Gradient for Content Area */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#22D3EE]/[0.03] via-transparent to-[#2563EB]/[0.04] pointer-events-none"></div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all mb-1 active:scale-95 ${
      active
        ? 'iw-nav-active'
        : 'text-secondary hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <i className={`${icon} w-5 text-center`}></i>
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </button>
);

export default Layout;
