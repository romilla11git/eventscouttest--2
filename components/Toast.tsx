"use client";

import React from 'react';
import { Notification } from '../types';

interface ToastProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notifications, onDismiss }) => {
  const visible = notifications.slice(0, 3);

  return (
    <div className="fixed bottom-10 right-10 z-[100] space-y-4 pointer-events-none">
      {visible.map((notif, idx) => (
        <div
          key={notif.id}
          className={`pointer-events-auto group transform transition-all duration-500 flex items-center p-6 min-w-[340px] max-w-[420px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl ${notif.type === 'success' ? 'border-l-4 border-l-green-500' :
              notif.type === 'warning' ? 'border-l-4 border-l-yellow-500' :
                notif.type === 'error' ? 'border-l-4 border-l-red-500' :
                  'border-l-4 border-l-cyan-500'
            }`}
          style={{
            animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            zIndex: 100 - idx
          }}
        >
          <div className="flex-shrink-0 mr-5">
            {notif.type === 'success' && <i className="fas fa-check-circle text-green-500 text-2xl"></i>}
            {notif.type === 'warning' && <i className="fas fa-exclamation-triangle text-yellow-500 text-2xl"></i>}
            {notif.type === 'error' && <i className="fas fa-times-circle text-red-500 text-2xl"></i>}
            {notif.type === 'info' && <i className="fas fa-info-circle text-cyan-500 text-2xl"></i>}
          </div>
          <div className="flex-1 mr-4">
            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-snug">{notif.message}</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5 uppercase font-black tracking-[0.2em]">
              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={() => onDismiss(notif.id)}
            className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
            aria-label="Close notification"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
