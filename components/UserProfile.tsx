"use client";

import React, { useState } from 'react';
import { User } from '../types';

interface UserProfileProps {
  user: User | null;
  onUpdate: (user: User) => void;
  onReset: () => void;
  addNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onReset, addNotification }) => {
  const [interestInput, setInterestInput] = useState('');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  if (!user) return null;

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestInput.trim()) return;
    if (user.interests.includes(interestInput.trim())) return;

    onUpdate({
      ...user,
      interests: [...user.interests, interestInput.trim()]
    });
    setInterestInput('');
  };

  const removeInterest = (interest: string) => {
    onUpdate({
      ...user,
      interests: user.interests.filter(i => i !== interest)
    });
  };

  const handleResetClick = () => {
    if (isConfirmingReset) {
      onReset();
      setIsConfirmingReset(false);
    } else {
      setIsConfirmingReset(true);
      setTimeout(() => setIsConfirmingReset(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="h-48 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 relative">
          <div className="absolute -bottom-16 left-12 p-1.5 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-900 dark:text-white text-5xl font-black border-4 border-white dark:border-gray-900">
              {user.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="pt-24 pb-16 px-12">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">{user.email}</h2>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-[10px] font-black uppercase tracking-widest rounded-lg">
                {user.role} Status
              </span>
              <span className="text-gray-400 dark:text-gray-500 font-bold text-sm tracking-tight italic">Provisioned {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            <div className="lg:col-span-3 space-y-12">
              <section>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center tracking-tight">
                  <i className="fas fa-radar mr-4 text-cyan-600 dark:text-cyan-500"></i>
                  Intelligence Targeting
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 font-medium leading-relaxed">
                  Configure keywords to train your personal AI scout. These interests prioritize relevant organizational assets on your feed.
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  {user.interests.map(interest => (
                    <div key={interest} className="group flex items-center px-5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white transition-all hover:border-cyan-500/50 hover:shadow-lg shadow-sm">
                      <span className="text-xs font-black uppercase tracking-wider">#{interest}</span>
                      <button
                        onClick={() => removeInterest(interest)}
                        className="ml-4 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <i className="fas fa-times-circle"></i>
                      </button>
                    </div>
                  ))}
                  {user.interests.length === 0 && (
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest italic py-2">No focus areas defined</span>
                  )}
                </div>

                <form onSubmit={handleAddInterest} className="flex gap-4">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="Add focus area (e.g. Q4 Strategy)"
                    className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold text-sm"
                  />
                  <button
                    type="submit"
                    className="bg-gray-900 dark:bg-white hover:opacity-90 text-white dark:text-gray-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl"
                  >
                    Add
                  </button>
                </form>
              </section>
            </div>

            <div className="lg:col-span-2 space-y-10">
              <section className="p-8 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-inner">
                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest flex items-center">
                  <i className="fas fa-shield-halved mr-3 text-blue-600 dark:text-blue-500"></i>
                  Security Profile
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">Authorization</p>
                    <p className="text-gray-900 dark:text-white font-black text-lg tracking-tight capitalize">{user.role} Access</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">Asset Traceability</p>
                    <p className="text-gray-900 dark:text-white font-bold tracking-tight">Active Session Encrypted</p>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">Visibility Mode</p>
                      <p className="text-gray-900 dark:text-white font-bold tracking-tight">{user.isVisible ? 'Public Asset' : 'Ghost Mode'}</p>
                    </div>
                    <button
                      onClick={() => onUpdate({ ...user, isVisible: !user.isVisible })}
                      className={`w-12 h-6 rounded-full transition-all relative ${user.isVisible ? 'bg-cyan-500' : 'bg-gray-400 dark:bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.isVisible ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={handleResetClick}
                      className={`w-full py-4 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all border shadow-lg ${isConfirmingReset
                        ? 'bg-red-600 text-white border-red-700 animate-pulse'
                        : 'bg-red-50 dark:bg-red-900/10 text-red-500 border-red-500/10 hover:bg-red-500/10'
                        }`}
                    >
                      {isConfirmingReset ? 'CONFIRM RESET' : 'Reset Workspace'}
                    </button>
                    {isConfirmingReset && (
                      <p className="mt-4 text-[9px] text-red-500 font-black uppercase text-center tracking-widest">Danger: This clears all targets & schedule</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
