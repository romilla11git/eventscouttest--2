"use client";

import React from 'react';
import { Event, User, EventState } from '../types';
import EventCard from './EventCard';

interface DashboardProps {
  events: Event[];
  user: User | null;
  onToggleSave: (id: string) => void;
  onExplore: () => void;
  onRefresh: () => void | Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ events, user, onToggleSave, onExplore, onRefresh }) => {
  const rankedEvents = [...events]
    .filter(e => e.state === EventState.REVIEWED)
    .sort((a, b) => {
      const aMatches = a.tags.filter(t => user?.interests.includes(t)).length;
      const bMatches = b.tags.filter(t => user?.interests.includes(t)).length;
      const aScore = a.priorityScore + (aMatches * 2);
      const bScore = b.priorityScore + (bMatches * 2);
      return bScore - aScore;
    });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col mb-4 gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-[2.2rem] font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-secondary tracking-tight flex items-center gap-3">
              <i className="fas fa-chart-network text-primary"></i> EventScout · Command Centre
            </h1>
            <p className="text-secondary font-medium text-sm sm:text-[0.9rem] mt-2 flex items-center gap-2">
              <i className="fas fa-microchip text-primary/70"></i> AI-driven intelligence · Strategic foresight for iWorth
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.interests.map(interest => (
              <span key={interest} className="px-3 sm:px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20 shadow-sm uppercase tracking-wider">
                #{interest}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-8 bg-card-solid backdrop-blur-xl rounded-[2rem] p-4 sm:px-8 sm:py-4 border border-border shadow-card w-fit">
          <div className="flex items-baseline gap-2 text-[0.8rem] text-secondary">
             <span className="font-heading font-extrabold text-[1.3rem] text-secondary">{events.filter(e => e.priorityScore >= 8).length}</span> <span>🔥 High Impact</span>
          </div>
          <div className="flex items-baseline gap-2 text-[0.8rem] text-secondary">
             <span className="font-heading font-extrabold text-[1.3rem] text-secondary">{events.filter(e => e.priorityScore >= 5 && e.priorityScore < 8).length}</span> <span>⚡ Strategic Opps</span>
          </div>
          <div className="flex items-baseline gap-2 text-[0.8rem] text-secondary">
             <span className="font-heading font-extrabold text-[1.3rem] text-secondary">{events.length}</span> <span>📡 Total Signals</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {rankedEvents.length > 0 ? (
          rankedEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isSaved={user?.savedEventIds.includes(event.id)}
              onToggleSave={() => onToggleSave(event.id)}
              onExplore={() => onExplore()}
            />
          ))
        ) : (
          <div className="col-span-full py-16 sm:py-24 text-center bg-card border border-border rounded-3xl">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background border border-border text-muted mb-6">
              <i className="fas fa-calendar-times text-2xl sm:text-3xl"></i>
            </div>
            <p className="text-muted text-base sm:text-lg font-medium px-4">No published events found matching your profile targets yet.</p>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mt-12 bg-card border border-border rounded-3xl p-6 sm:p-10 overflow-hidden relative shadow-sm">
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
            System Status
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 tracking-tight">Autonomous Scouting Active</h3>
          <p className="text-secondary mb-6 sm:mb-8 leading-relaxed font-medium text-sm sm:text-base">
            Our AI agents are currently crawling 12 shared platforms including internal Wikis, Slack, and Regional Hubs.
            Intelligence is queued for review 24/7.
          </p>
          <div className="flex items-center space-x-3 text-cyan-600 dark:text-cyan-400">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Real-time synchronization active</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/3 opacity-[0.03] dark:opacity-[0.07] pointer-events-none text-foreground">
          <i className="fas fa-brain text-[120px] sm:text-[160px] translate-x-12 translate-y-12 sm:translate-x-12 sm:translate-y-12"></i>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
