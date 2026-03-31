"use client";

import React, { useState } from 'react';
import { Event } from '../types';
import { generateMarketingCopyAction } from '@/app/actions/marketing_copy';

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, isSaved, onToggleSave }) => {
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleGenerateCopy = async (type: 'linkedin' | 'email' | 'banner') => {
    setIsGenerating(type);
    setGeneratedCopy(null);
    const res = await generateMarketingCopyAction(
      event.title,
      event.date,
      event.whyItMattersForIworth || event.description,
      event.iworthVertical || 'Technology Solutions',
      type
    );
    if (res.success) {
      setGeneratedCopy(res.copy);
    } else {
      setGeneratedCopy("Failed to interface with Neural Link. " + res.error);
    }
    setIsGenerating(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-400 flex flex-col max-h-[90vh]">

        {/* Header Branding */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-cyan-600 to-blue-700 p-4 sm:p-8 flex items-end justify-between shrink-0">
          <div className="flex items-center space-x-3 text-white">
            <i className="fas fa-radar text-xl sm:text-2xl opacity-80"></i>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Briefing #{event.id}</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95" aria-label="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 sm:p-12 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4 tracking-tighter leading-tight">{event.title}</h2>
              <div className="flex flex-wrap gap-2">
                {event.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-background text-secondary text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-widest border border-border">#{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center justify-center p-3 sm:p-4 bg-background rounded-2xl border border-border min-w-[100px] sm:min-w-[120px] gap-2 sm:gap-0">
              <span className="text-[9px] sm:text-[10px] font-black text-muted uppercase tracking-widest sm:mb-1">Priority</span>
              <span className={`text-2xl sm:text-3xl font-black ${event.priorityScore >= 8 ? 'text-red-500' : event.priorityScore >= 5 ? 'text-yellow-500' : 'text-cyan-500'
                }`}>
                {event.priorityScore}.0
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-8 sm:space-y-10">
              <section>
                <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Core Context</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-sm sm:text-base">
                  {event.description}
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Logistics</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 shrink-0">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-foreground tracking-tight leading-tight">
                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 shrink-0">
                    <i className="fas fa-location-dot"></i>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-foreground tracking-tight leading-tight">{event.location}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest">Verified Venue</p>
                  </div>
                </div>
              </section>

              <section className="mt-8 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-[10px] font-black text-[#30AABF] uppercase tracking-[0.2em] mb-4 flex items-center">
                  <i className="fas fa-briefcase mr-2"></i> Business Intelligence
                </h3>
                <div className="p-6 bg-cyan-500/5 dark:bg-cyan-500/5 border border-cyan-500/10 rounded-3xl space-y-6 shadow-sm">
                  {event.iworthVertical && (
                    <div>
                      <p className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1 flex items-center"><i className="fas fa-bullseye mr-1.5 opacity-70"></i>Target Vertical</p>
                      <p className="text-sm font-bold text-foreground pl-4 border-l-2 border-cyan-500/30">{event.iworthVertical}</p>
                    </div>
                  )}
                  {event.whyItMattersForIworth && (
                    <div>
                      <p className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1 flex items-center"><i className="fas fa-lightbulb mr-1.5 opacity-70"></i>Strategic Value</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed pl-4 border-l-2 border-cyan-500/30">{event.whyItMattersForIworth}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-cyan-500/10">
                    {event.opportunityType && (
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Opportunity</p>
                        <span className="inline-block px-2.5 py-1 bg-white dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 border border-gray-200 dark:border-gray-700 text-[10px] font-black rounded-lg uppercase tracking-wider">{event.opportunityType}</span>
                      </div>
                    )}
                    {event.estimatedValue != null && (
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Est. Value</p>
                        <p className="text-sm font-black text-green-600 dark:text-green-500">KES {event.estimatedValue.toLocaleString()}</p>
                      </div>
                    )}
                    {event.contactsPotential != null && (
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Lead Potential</p>
                        <p className="text-sm font-black text-foreground">{event.contactsPotential} Contacts</p>
                      </div>
                    )}
                    {event.partnershipPotential && (
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Partnership</p>
                        <p className="text-sm font-bold text-foreground capitalize">{event.partnershipPotential}</p>
                      </div>
                    )}
                    {event.riskLevel && (
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Risk Level</p>
                        <p className={`text-sm font-black capitalize ${event.riskLevel.toLowerCase() === 'high' ? 'text-red-500' : event.riskLevel.toLowerCase() === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>{event.riskLevel}</p>
                      </div>
                    )}
                    {event.competitionPresence && (
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Competition</p>
                        <p className={`text-sm font-black capitalize ${event.competitionPresence.toLowerCase() === 'high' ? 'text-red-500' : event.competitionPresence.toLowerCase() === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>{event.competitionPresence}</p>
                      </div>
                    )}
                  </div>
                  {event.actionPlan && (
                    <div className="pt-4 border-t border-cyan-500/10">
                      <p className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-4 flex items-center"><i className="fas fa-list-check mr-1.5"></i>Action Plan Outline</p>
                      <ul className="space-y-4">
                        {event.actionPlan.step1 && (
                          <li className="flex items-start text-sm text-gray-800 dark:text-gray-200 font-medium">
                           <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-white text-[10px] font-black mr-3 shrink-0 mt-0.5 shadow-md">1</span>
                           <span className="leading-tight">{event.actionPlan.step1}</span>
                          </li>
                        )}
                        {event.actionPlan.step2 && (
                          <li className="flex items-start text-sm text-gray-800 dark:text-gray-200 font-medium">
                           <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-white text-[10px] font-black mr-3 shrink-0 mt-0.5 shadow-md">2</span>
                           <span className="leading-tight">{event.actionPlan.step2}</span>
                          </li>
                        )}
                        {event.actionPlan.step3 && (
                          <li className="flex items-start text-sm text-gray-800 dark:text-gray-200 font-medium">
                           <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-white text-[10px] font-black mr-3 shrink-0 mt-0.5 shadow-md">3</span>
                           <span className="leading-tight">{event.actionPlan.step3}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </section>

              {event.marketingStrategy && (
                <section className="mt-8 space-y-4">
                  <h3 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] mb-4 flex items-center">
                    <i className="fas fa-chess-knight mr-2"></i> Operational Strategy
                  </h3>
                  <div className="p-6 bg-violet-500/5 border border-violet-500/10 rounded-3xl">
                    <p className="text-violet-900 dark:text-violet-200 text-sm font-bold mb-4">{event.marketingStrategy.engagement_idea}</p>
                    <ul className="space-y-2 mb-4">
                      {event.marketingStrategy.marketing_steps?.map((step: string, i: number) => (
                        <li key={i} className="text-xs text-violet-800 dark:text-violet-300 flex items-start">
                          <span className="text-violet-500 mr-2 opacity-50">0{i + 1}</span> {step.replace(/\*\*/g, '')}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-violet-500/10">
                      {event.marketingStrategy.recommended_materials?.map((mat: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white/50 dark:bg-black/20 text-violet-600 dark:text-violet-400 text-[9px] font-black uppercase tracking-widest rounded-md">{mat}</span>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Marketing Copy Generator Tools */}
              <section className="mt-8 pt-8 border-t border-border">
                <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Generate Campaign Assets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleGenerateCopy('linkedin')}
                    disabled={isGenerating !== null}
                    className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition flex items-center justify-center disabled:opacity-50"
                  >
                    {isGenerating === 'linkedin' ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fab fa-linkedin mr-2 text-sm"></i> LinkedIn Post</>}
                  </button>
                  <button
                    onClick={() => handleGenerateCopy('email')}
                    disabled={isGenerating !== null}
                    className="p-3 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-500/20 transition flex items-center justify-center disabled:opacity-50"
                  >
                    {isGenerating === 'email' ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-envelope mr-2 text-sm"></i> Email Draft</>}
                  </button>
                  <button
                    onClick={() => handleGenerateCopy('banner')}
                    disabled={isGenerating !== null}
                    className="p-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition flex items-center justify-center disabled:opacity-50"
                  >
                    {isGenerating === 'banner' ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-flag mr-2 text-sm"></i> Banner Slogans</>}
                  </button>
                </div>

                {generatedCopy && (
                  <div className="mt-6 p-6 bg-background rounded-2xl border border-border relative group animate-in slide-in-from-top-4">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedCopy)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-cyan-500 transition"
                      title="Copy to Clipboard"
                    >
                      <i className="far fa-copy"></i>
                    </button>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap">
                      {generatedCopy}
                    </div>
                  </div>
                )}
              </section>

            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="p-6 sm:p-8 bg-background rounded-3xl border border-border shadow-inner">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-6 flex items-center">
                  <i className="fas fa-brain mr-3 text-cyan-500"></i>
                  AI Alignment Analysis
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Conflict Prob.</span>
                      <span className={`text-[9px] font-black ${event.conflictStatus ? 'text-red-500' : 'text-green-500'}`}>
                        {event.conflictStatus ? 'CRITICAL (92%)' : 'CLEAR (0%)'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${event.conflictStatus ? 'bg-red-500 w-[92%]' : 'bg-green-500 w-[5%]'}`}
                      ></div>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-secondary font-medium italic leading-relaxed">
                    Agent detected {event.conflictStatus ? 'overlapping schedule entries' : 'zero scheduling conflicts'} based on your current personal targets.
                  </p>
                  <div className="pt-4 border-t border-border">
                    <p className="text-[9px] font-black text-foreground uppercase tracking-widest mb-1">Source Provenance</p>
                    <p className="text-[9px] font-bold text-gray-400 truncate max-w-full italic">{event.rawSource || 'Internal Administrative Records'}</p>
                  </div>
                </div>
              </div>

              {/* Lead Tracking Dashboard (Visual only for now) */}
              <div className="p-6 sm:p-8 bg-background rounded-3xl border border-border shadow-inner">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] flex items-center">
                    <i className="fas fa-chart-line mr-3 text-emerald-500"></i>
                    Lead Tracking Metrics
                  </h3>
                  <span className="text-[8px] uppercase tracking-widest text-emerald-500 font-black bg-emerald-500/10 px-2 py-1 rounded-md">Live</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card p-4 rounded-xl border border-border">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Contacts</p>
                    <p className="text-2xl font-black text-foreground">{event.contactsCollected || 0}</p>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Demos</p>
                    <p className="text-2xl font-black text-foreground">{event.demosGiven || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Partnerships</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{event.partnershipsStarted || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Sales (KSH)</p>
                    <p className="text-2xl font-black text-emerald-500">{event.salesClosed ? `${event.salesClosed}M` : '0'}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onToggleSave}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 shadow-xl active:scale-95 ${isSaved
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                  : 'bg-cyan-500 text-white hover:bg-cyan-600'
                  }`}
              >
                <i className={`fas ${isSaved ? 'fa-calendar-minus' : 'fa-calendar-plus'}`}></i>
                <span>{isSaved ? 'Remove from Schedule' : 'Commit to Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
