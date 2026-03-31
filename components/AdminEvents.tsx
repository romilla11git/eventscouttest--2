"use client";

import React, { useState } from 'react';
import { Event, EventState, UserRole } from '../types';
import { updateEventAction, deleteEventAction } from '@/app/actions/events';

interface AdminEventsProps {
  events: Event[];
  onUpdate: () => void;
  adminId: string;
  addNotification: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const AdminEvents: React.FC<AdminEventsProps> = ({ events, onUpdate, adminId, addNotification }) => {
  const [filter, setFilter] = useState<EventState | 'ALL'>('ALL');

  const filteredEvents = events.filter(e => filter === 'ALL' || e.state === filter);

  const handlePublish = async (id: string) => {
    const result = await updateEventAction(id, { state: EventState.REVIEWED });
    if (result.success) {
      addNotification("Intelligence published. Now visible on standard dashboards.", "success");
      onUpdate();
    }
  };

  const handleArchive = async (id: string) => {
    const result = await updateEventAction(id, { state: EventState.ARCHIVED });
    if (result.success) {
      addNotification("Intelligence archived.", "info");
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("CONFIRM: Permanently expunge this record from organizational history?")) {
      const result = await deleteEventAction(id);
      if (result.success) {
        addNotification("Record expunged successfully.", "info");
        onUpdate();
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Moderation Queue</h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Verify AI-normalized intelligence before broad internal distribution.</p>
        </div>
        <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 shadow-sm">
          {(['ALL', EventState.DISCOVERED, EventState.REVIEWED, EventState.ARCHIVED] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-widest ${filter === s
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-md scale-105'
                : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Asset Identity</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Sourcing Intelligence</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Lifecycle Status</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Priority Index</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Governance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredEvents.map(event => (
              <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <div className="ml-5">
                      <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{event.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] font-medium">{event.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col space-y-1">
                    {event.opportunityType && (
                      <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">
                        <i className="fas fa-bullseye text-cyan-500 mr-2"></i>{event.opportunityType}
                      </span>
                    )}
                    {event.organizer && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        <i className="fas fa-building mr-2"></i>{event.organizer}
                      </span>
                    )}
                    {event.suggestedAction && (
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider mt-1 block bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded inline-block w-fit">
                        {event.suggestedAction}
                      </span>
                    )}
                    {event.sourceUrl && (
                      <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline inline-flex items-center mt-1">
                        Source Link <i className="fas fa-external-link-alt ml-1 text-[10px]"></i>
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${event.state === EventState.REVIEWED ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500' :
                    event.state === EventState.DISCOVERED ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-500'
                    }`}>
                    {event.state}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${event.priorityScore >= 8 ? 'bg-red-500' : event.priorityScore >= 5 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{event.priorityScore}/10</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end space-x-4">
                    {event.state === EventState.DISCOVERED && (
                      <button
                        onClick={() => handlePublish(event.id)}
                        className="text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 text-xs font-black uppercase tracking-widest"
                      >
                        Release
                      </button>
                    )}
                    <button
                      onClick={() => handleArchive(event.id)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-black uppercase tracking-widest"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-300 dark:text-red-900/40 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-gray-400 dark:text-gray-600 italic font-medium">
                  Queue is currently empty for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEvents;
