"use client";

import React, { useState, useEffect } from 'react';
import { User, UserRole, Event } from '../types';
import { getUsersAction, updateUserRoleAction } from '@/app/actions/admin';
import { Role } from '@prisma/client';

interface UserManagementProps {
  events: Event[];
  addNotification: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ events, addNotification }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getUsersAction();
    setUsers(data as User[]);
    setLoading(false);
  };

  const handleToggleRole = async (userId: string, currentRole: UserRole) => {
    const newRole = currentRole === UserRole.ADMIN ? Role.user : Role.admin;
    const result = await updateUserRoleAction(userId, newRole);
    if (result.success) {
      addNotification(`Authorization level updated for record ${userId.slice(0, 5)}...`, 'success');
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole as unknown as UserRole } : null);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative min-h-[600px]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Personnel Directory</h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">System-wide governance of authorization levels and intelligence alignment profiles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User List */}
        <div className="lg:col-span-2 overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Personnel</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Auth Level</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all ${selectedUser?.id === u.id ? 'bg-cyan-500/5 dark:bg-cyan-500/5 border-l-4 border-l-cyan-500' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                      {!u.isVisible ? (
                        <div className="flex items-center space-x-3 grayscale opacity-50 italic">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                            <i className="fas fa-ghost"></i>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-400">[ Identity Hidden ]</p>
                            <p className="text-[9px] font-black uppercase tracking-tighter text-gray-300">Anonymized UUID</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-black mr-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{u.email}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${u.role === UserRole.ADMIN ? 'text-red-600 bg-red-100 dark:text-red-500 dark:bg-red-400/10' : 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-400/10'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className={`inline-flex items-center space-x-2 text-xs font-black uppercase tracking-widest transition-all ${selectedUser?.id === u.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                      <i className="fas fa-search-plus"></i>
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details Side Panel */}
        <div className="lg:col-span-1">
          {selectedUser ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 h-full shadow-2xl animate-in slide-in-from-right-8 duration-500">
              <div className="flex justify-between items-start mb-10">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">AI Alignment Audit</h3>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="space-y-10">
                <div className="p-5 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Personnel Identifier</p>
                  <p className="text-gray-900 dark:text-white font-bold tracking-tight">{selectedUser.email}</p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] mb-4">Interest Cluster</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.interests.map(i => (
                      <span key={i} className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[10px] font-black rounded-lg border border-gray-200 dark:border-gray-700 uppercase tracking-widest shadow-sm">
                        #{i}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] mb-4">Profile-Event Synchronization</p>
                  <div className="space-y-3">
                    {events.filter(e => e.tags.some(t => selectedUser.interests.includes(t))).slice(0, 3).map(e => (
                      <div key={e.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group cursor-default">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 mr-4 shadow-lg shadow-cyan-500/20 group-hover:scale-125 transition-transform"></div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate font-bold tracking-tight">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em]">Administrative Override</p>
                  <button
                    onClick={() => handleToggleRole(selectedUser.id, selectedUser.role)}
                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                  >
                    Transition to {selectedUser.role === UserRole.ADMIN ? 'User' : 'Administrator'}
                  </button>
                  <button className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-500 text-xs font-black uppercase tracking-widest rounded-2xl border border-red-100 dark:border-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all">
                    Revoke System Access
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/50 dark:bg-gray-900/30 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[500px]">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 mb-6">
                <i className="fas fa-fingerprint text-2xl"></i>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium italic max-w-xs mx-auto">
                Select personnel from the directory to inspect intelligence alignment and modify system privileges.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
