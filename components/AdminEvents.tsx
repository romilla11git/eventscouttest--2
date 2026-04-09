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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filteredEvents = events.filter(e => filter === 'ALL' || e.state === filter);

  const handlePublish = async (id: string) => {
    const result = await updateEventAction(id, { state: EventState.REVIEWED });
    if (result.success) {
      addNotification("Intelligence published. Now visible on dashboards.", "success");
      onUpdate();
    } else {
      addNotification(result.error || "Failed to publish event.", "error");
    }
  };

  const handleArchive = async (id: string) => {
    const result = await updateEventAction(id, { state: EventState.ARCHIVED });
    if (result.success) {
      addNotification("Intelligence archived.", "info");
      onUpdate();
    } else {
      addNotification(result.error || "Failed to archive event.", "error");
    }
  };

  const handleDeleteConfirm = (id: string) => {
    setConfirmId(id);
  };

  const handleDeleteExecute = async (id: string) => {
    setDeletingId(id);
    setConfirmId(null);
    const result = await deleteEventAction(id);
    setDeletingId(null);
    if (result.success) {
      addNotification("Record permanently deleted.", "info");
      onUpdate();
    } else {
      addNotification(result.error || "Failed to delete event.", "error");
    }
  };

  // Priority score color
  const priorityColor = (score: number) =>
    score >= 8 ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
    : score >= 5 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
    : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Intelligence Feed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
            Review and manage AI-discovered opportunities before publishing to the Command Center.
          </p>
        </div>
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {(['ALL', EventState.DISCOVERED, EventState.REVIEWED, EventState.ARCHIVED] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all uppercase tracking-widest border ${
                filter === s
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 border-transparent shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              {s}
              {s !== 'ALL' && (
                <span className="ml-1.5 opacity-60">
                  ({events.filter(e => e.state === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: events.length, color: 'text-gray-700 dark:text-gray-200', bg: 'bg-gray-50 dark:bg-gray-800/50' },
          { label: 'Awaiting Review', value: events.filter(e => e.state === EventState.DISCOVERED).length, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Published', value: events.filter(e => e.state === EventState.REVIEWED).length, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'High Priority', value: events.filter(e => e.priorityScore >= 8).length, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-2xl p-4 border border-gray-100 dark:border-white/5`}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Event</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] hidden md:table-cell">Source Intelligence</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Status</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] hidden sm:table-cell">Priority</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredEvents.map(event => (
              <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                {/* Event Identity */}
                <td className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-sm">
                      <i className={`fas ${event.opportunityType === 'Tender' ? 'fa-gavel text-amber-500' : event.opportunityType === 'Product Demo' ? 'fa-display text-blue-500' : 'fa-calendar-check text-cyan-500'}`}></i>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{event.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px] mt-0.5">{event.description}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                        <i className="fas fa-calendar-day"></i>
                        {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {event.location && <><i className="fas fa-map-marker-alt ml-2"></i>{event.location}</>}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Sourcing Intelligence */}
                <td className="px-6 py-5 hidden md:table-cell">
                  <div className="flex flex-col gap-1.5">
                    {event.opportunityType && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                        <i className="fas fa-bullseye text-cyan-500 text-[10px]"></i>
                        {event.opportunityType}
                      </span>
                    )}
                    {event.organizer && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <i className="fas fa-building text-[10px]"></i>
                        {event.organizer}
                      </span>
                    )}
                    {event.suggestedAction && (
                      <span className="inline-block text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800/30 w-fit">
                        {event.suggestedAction}
                      </span>
                    )}
                    {event.sourceUrl && (
                      <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-fit">
                        <i className="fas fa-external-link-alt text-[10px]"></i>
                        Source
                      </a>
                    )}
                  </div>
                </td>

                {/* State Badge */}
                <td className="px-6 py-5">
                  <span className={`inline-block px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${
                    event.state === EventState.REVIEWED
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : event.state === EventState.DISCOVERED
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400'
                  }`}>
                    {event.state}
                  </span>
                </td>

                {/* Priority */}
                <td className="px-6 py-5 hidden sm:table-cell">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${priorityColor(event.priorityScore)}`}>
                    <span>{event.priorityScore}</span>
                    <span className="opacity-60">/10</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-5">
                  {/* Confirm delete dialog */}
                  {confirmId === event.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">Delete?</span>
                      <button
                        onClick={() => handleDeleteExecute(event.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg uppercase tracking-widest transition-all"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-black rounded-lg uppercase tracking-widest transition-all"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      {event.state === EventState.DISCOVERED && (
                        <button
                          onClick={() => handlePublish(event.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest transition-all shadow-sm"
                        >
                          <i className="fas fa-check mr-1"></i>
                          Publish
                        </button>
                      )}
                      {event.state !== EventState.ARCHIVED && (
                        <button
                          onClick={() => handleArchive(event.id)}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-black rounded-lg uppercase tracking-widest transition-all border border-gray-200 dark:border-gray-700"
                        >
                          Archive
                        </button>
                      )}
                      {/* DELETE — always visible, clearly styled */}
                      <button
                        onClick={() => handleDeleteConfirm(event.id)}
                        disabled={deletingId === event.id}
                        title="Delete permanently"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all border border-red-200 dark:border-red-500/30 disabled:opacity-50"
                      >
                        {deletingId === event.id
                          ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          : <i className="fas fa-trash-alt text-xs"></i>
                        }
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-600">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-inbox text-2xl"></i>
                    </div>
                    <p className="font-medium text-sm">No events match the selected filter.</p>
                    <p className="text-xs opacity-70">Try switching to "ALL" or run a new scan.</p>
                  </div>
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
