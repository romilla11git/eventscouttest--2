"use client";

import React, { useState } from 'react';
import { Event, User } from '../types';
import EventCard from './EventCard';

interface CalendarViewProps {
  events: Event[];
  user: User | null;
  onToggleSave: (id: string) => void;
  onSync: () => void;
  addNotification: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, user, onToggleSave, onSync, addNotification }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const savedEvents = events
    .filter(e => user?.savedEventIds.includes(e.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    onSync(); // Global toast

    // Simulate real sync logic
    setTimeout(() => {
      setIsSyncing(false);
      addNotification(`Pushing ${savedEvents.length} events to enterprise cloud.`, 'success');
    }, 2500);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">Personal Schedule</h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-2xl">
            Critical intelligence assets you've bookmarked for participation.
            Automated synchronization ensures these appear in your local workspace.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`px-8 py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center space-x-3 shadow-xl ${isSyncing
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 hover:opacity-90 active:scale-95'
            }`}
        >
          {isSyncing ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-cyan-500 rounded-full animate-spin"></div>
          ) : (
            <i className="fab fa-google"></i>
          )}
          <span>{isSyncing ? 'Syncing...' : 'External Sync'}</span>
        </button>
      </div>

      {savedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isSaved={true}
              onToggleSave={() => onToggleSave(event.id)}
              onExplore={() => { }} // Could wire this to explore modal too
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-24 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 mb-8 shadow-inner">
            <i className="fas fa-calendar-plus text-4xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">Schedule is Empty</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-10 font-medium">
            You haven't committed to any intelligence assets yet. Return to the dashboard to begin discovery.
          </p>
        </div>
      )}

      {savedEvents.length > 0 && (
        <div className="mt-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-10 py-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">Operational Timeline</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {savedEvents.map(event => (
              <div key={event.id} className="px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors group">
                <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm group-hover:border-cyan-500/50 transition-colors">
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-500 font-black uppercase tracking-tighter mb-0.5">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight mb-1">{event.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onToggleSave(event.id)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-red-300 hover:text-red-500 transition-colors bg-red-500/5 border border-red-500/10"
                  >
                    <i className="fas fa-calendar-minus text-sm"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
