"use client";

import React, { useState } from 'react';
import { User } from '../types';
import { loginAction } from '@/app/actions/auth';
import { registerAction } from '@/app/actions/register';
import IWorthEmblem from './IWorthEmblem';

interface LoginPageProps {
  onLogin: (user: User) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isDarkMode, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [biometricLoadingMessage, setBiometricLoadingMessage] = useState<string | null>(null);

  const biometricOptions = [
    { id: 'fingerprint', name: 'Fingerprint', icon: 'fa-fingerprint', desc: 'Secure pattern scan', message: 'Awaiting fingerprint scan...', waitTime: 500 },
    { id: 'face', name: 'Facial Recognition', icon: 'fa-user-astronaut', desc: 'AI structural scan', message: 'Align face within frame...', waitTime: 800 },
    { id: 'iris', name: 'Iris Recognition', icon: 'fa-eye', desc: 'High-accuracy tracking', message: 'Scanning iris pattern...', waitTime: 1200 },
    { id: 'retina', name: 'Retina Scan', icon: 'fa-bullseye', desc: 'Capillary network map', message: 'Initiating deep retinal scan...', waitTime: 1500 },
    { id: 'voice', name: 'Voice Recognition', icon: 'fa-microphone-alt', desc: 'Acoustic signature', message: 'Awaiting voice command signature...', waitTime: 1200 },
    { id: 'signature', name: 'Signature', icon: 'fa-signature', desc: 'Stroke dynamics', message: 'Verifying kinetic signature profile...', waitTime: 1000 },
    { id: 'behavioral', name: 'Behavioral', icon: 'fa-walking', desc: 'Keystroke/Gait map', message: 'Analyzing behavioral telemetry...', waitTime: 1500 },
  ];

  const startBiometricLogin = async (option: typeof biometricOptions[0]) => {
    setError(null);
    if (!window.PublicKeyCredential) {
      setError("Hardware architecture not supported. Please use text-based auth.");
      setShowPasswordForm(true);
      return;
    }

    setBiometricLoadingMessage(option.message);
    setIsLoading(true);

    // Simulate the specific biometric initialization sequence before handing off to native OS
    setTimeout(async () => {
      // In a real app, 'challenge' would come fresh from the backend
      const requestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          userVerification: "required" as UserVerificationRequirement,
          timeout: 60000,
        }
      };

      try {
        const assertion = await navigator.credentials.get(requestOptions);
        // If successful, send 'assertion' to your backend to login
        // For this demo, we auto-login the admin
        const formData = new FormData();
        formData.append('email', 'admin@eventscout.io');
        formData.append('password', 'admin123');
        const result = await loginAction(formData);

        if (result.success && result.user) {
          onLogin(result.user as User);
        } else {
          throw new Error("Biometric signature rejected by server parameters");
        }
      } catch (err: any) {
        setError("Biometric capture failed or cancelled. System defaulting to manual override.");
        setShowPasswordForm(true); // Switch back to manual login
      } finally {
        setIsLoading(false);
        setBiometricLoadingMessage(null);
      }
    }, option.waitTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (isRegisterMode) {
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('organization', organization);
    }

    setIsLoading(true);

    try {
      const result = isRegisterMode
        ? await registerAction(formData)
        : await loginAction(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        if (isRegisterMode) {
          setSuccessMessage("Operational parameters accepted. Account synchronized successfully.");
          // Timed transition to login mode or dashboard
          setTimeout(() => {
            if (result.user) onLogin(result.user as User);
          }, 2000);
        } else if (result.user) {
          onLogin(result.user as User);
        }
      }
    } catch (err: any) {
      setError('Neural link synchronization failure. System offline.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse-slow" style={{background:'rgba(48,170,191,0.12)'}}></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse-slow" style={{background:'rgba(0,200,200,0.12)'}}></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse-slow" style={{background:'rgba(0,200,200,0.10)'}}></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        {/* Visual Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-8">
            <IWorthEmblem size={80} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter">
            <span className="iw-gradient-text">EventScout</span>
            <span className="opacity-50"> AI</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold tracking-[0.2em] text-[10px] uppercase">
            iWorth Technologies · Event Intelligence
          </p>
        </div>

        {/* Main Interface */}
        <div className="glass-card rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Success / Error Notifications */}
          <div className="space-y-4 mb-8">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
                <i className="fas fa-shield-exclamation text-sm mt-0.5"></i>
                <span className="text-[11px] font-black uppercase tracking-tight leading-tight">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-start space-x-3 text-cyan-600 dark:text-cyan-400 animate-in slide-in-from-top-2">
                <i className="fas fa-check-circle text-sm mt-0.5"></i>
                <span className="text-[11px] font-black uppercase tracking-tight leading-tight">{successMessage}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegisterMode && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">Identity Label *</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name / Handle"
                    className="w-full px-6 py-4 rounded-2xl glass-input text-gray-900 dark:text-white outline-none font-bold text-sm shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">Comms Link</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full px-6 py-4 rounded-2xl glass-input text-gray-900 dark:text-white outline-none font-bold text-sm shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">Org Sector</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Organization"
                      className="w-full px-6 py-4 rounded-2xl glass-input text-gray-900 dark:text-white outline-none font-bold text-sm shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {!showPasswordForm && !isRegisterMode ? (
              <div className="space-y-6">
                
                {isLoading ? (
                  <div className="w-full py-12 rounded-2xl glass-card flex flex-col items-center justify-center border border-cyan-500/30">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <i className={`fas ${biometricOptions.find(o => o.message === biometricLoadingMessage)?.icon || 'fa-fingerprint'} text-cyan-400 text-xl animate-pulse`}></i>
                      </div>
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-500 animate-pulse">{biometricLoadingMessage}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-2">Connecting to device hardware...</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                       <i className="fas fa-shield-alt text-cyan-500"></i>
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-400">Select Biometric Vector</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {biometricOptions.slice(0, 6).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => startBiometricLogin(option)}
                          className="group relative overflow-hidden bg-white dark:bg-card-solid border border-gray-200 dark:border-white/10 p-3 rounded-xl flex flex-col items-start text-left hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <i className={`fas ${option.icon} text-gray-400 group-hover:text-cyan-500 text-lg mb-2 transition-colors`}></i>
                          <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-1 line-clamp-1">{option.name}</span>
                          <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest line-clamp-1">{option.desc}</span>
                        </button>
                      ))}
                    </div>
                    {/* The 7th Behavioral option spans full width */}
                    <button
                      type="button"
                      onClick={() => startBiometricLogin(biometricOptions[6])}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-gray-50 to-white dark:from-white/5 dark:to-transparent border border-gray-200 dark:border-white/10 p-4 rounded-xl flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <i className={`fas ${biometricOptions[6].icon}`}></i>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{biometricOptions[6].name}</span>
                          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Continuous Analysis / Gait & Keystroke</span>
                        </div>
                      </div>
                      <i className="fas fa-chevron-right text-gray-300 dark:text-white/20 group-hover:text-indigo-400"></i>
                    </button>
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(true);
                      setError(null);
                    }}
                    className="text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-cyan-500 transition-colors uppercase tracking-[0.2em] border-b border-gray-200 dark:border-gray-800 pb-1"
                  >
                    Or use manual password
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">Access Credential</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@enterprise.io"
                    className="w-full px-6 py-4 rounded-2xl glass-input text-gray-900 dark:text-white outline-none font-bold text-sm shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">Security Key</label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-6 py-4 rounded-2xl glass-input text-gray-900 dark:text-white outline-none font-bold text-sm shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-950 font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <i className={`fas ${isRegisterMode ? 'fa-user-plus' : 'fa-lock-open'} mr-4 text-xs`}></i>
                      {isRegisterMode ? 'Initialize Protocol' : 'Sync Interface'}
                    </>
                  )}
                </button>
                <div className="text-center">
                  {!isRegisterMode && showPasswordForm && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-cyan-500 transition-colors uppercase tracking-[0.2em] pb-1"
                    >
                      Back to Biometrics
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>

          {/* Mode Switch & Theme Toggle */}
          <div className="mt-12 flex flex-col items-center space-y-8">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-cyan-500 transition-colors uppercase tracking-[0.2em] border-b border-gray-200 dark:border-gray-800 pb-1"
            >
              {isRegisterMode ? 'Back to Access Console' : 'New User? Request Alignment'}
            </button>

            <div className="flex items-center space-x-6 p-2 bg-gray-100/50 dark:bg-gray-800/30 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={onToggleTheme}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!isDarkMode ? 'bg-white text-amber-500 shadow-md scale-110' : 'text-gray-400'}`}
              >
                <i className="fas fa-sun"></i>
              </button>
              <button
                onClick={onToggleTheme}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-gray-900 text-cyan-400 shadow-md scale-110' : 'text-gray-400'}`}
              >
                <i className="fas fa-moon"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mx-auto opacity-80">
            © 2026 iWorth Technologies. EventScout is a registered product.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
