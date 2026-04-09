"use client";

import React, { useState } from 'react';
import { Event } from '../types';
import { useToast } from './ToastProvider';
import { generateAttackPlanAction } from '@/app/actions/marketing';
import { generateMarketingCopyAction } from '@/app/actions/marketing_copy';

interface EventCardProps {
  event: Event;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onExplore?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isSaved, onToggleSave, onExplore }) => {
  const [attackPlan, setAttackPlan] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const [proposal, setProposal] = useState<string | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);

  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const sourceSite =
    event.sourceSite ||
    (event.sourceUrl
      ? (() => {
          try {
            return new URL(event.sourceUrl).hostname.replace(/^www\./, '');
          } catch {
            return '';
          }
        })()
      : '');

  const getRelevanceBadge = () => {
    const score = (event as any).relevanceScore as number | undefined;
    if (score == null) return null;
    if (score >= 90) return { label: 'Strategic', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    if (score >= 70) return { label: 'Strong', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
    if (score >= 60) return { label: 'Possible', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    return null;
  };

  const relevanceBadge = getRelevanceBadge();

  const handleGeneratePlan = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (attackPlan) {
      setAttackPlan(null);
      return;
    }
    setIsGenerating(true);
    const res = await generateAttackPlanAction(event.title, formattedDate);
    if (res.success) {
      setAttackPlan(res.plan);
    } else {
      setAttackPlan("Failed to generate plan: " + res.error);
    }
    setIsGenerating(false);
  };

  const handleGenerateProposal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (proposal) {
      setProposal(null);
      return;
    }
    setIsGeneratingProposal(true);
    const context = `Targeting ${event.organizer || 'the organizers'} for an ${event.opportunityType || 'Event'} opportunity.`;
    const res = await generateMarketingCopyAction(event.title, formattedDate, context, event.iworthVertical || 'Technology Infrastructure', 'proposal');
    if (res.success) {
      setProposal(res.copy);
    } else {
      setProposal("Failed to generate proposal: " + res.error);
    }
    setIsGeneratingProposal(false);
  };

  return (
    <div
      className={`group relative bg-white dark:bg-card-solid backdrop-blur-xl border border-gray-200 dark:border-border rounded-3xl overflow-hidden transition-all duration-300 ease-out flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 ${event.sourceUrl ? 'cursor-pointer' : ''}`}
      onClick={() => {
        if (event.sourceUrl) {
          window.open(event.sourceUrl, '_blank');
        }
      }}
    >
      {/* Top Banner indicating Opportunity Type */}
      {event.opportunityType && (
        <div className="bg-gradient-to-r from-gray-100 to-white dark:from-[#0f111a] dark:to-card px-5 py-2.5 flex justify-between items-center border-b border-gray-100 dark:border-border/50">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-500">
            <i className="fas fa-building"></i>
            {event.opportunityType}
          </div>
          {event.conflictStatus && (
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-500 flex items-center gap-1.5">
              <i className="fas fa-exclamation-triangle"></i> Conflict
            </span>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        
        {/* Title and Save Button */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          {onToggleSave && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
              className={`shrink-0 w-8 h-8 flex flex-col justify-center items-center rounded-xl transition-all ${
                isSaved
                  ? 'text-primary bg-primary/10 shadow-sm'
                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-500'
              }`}
              title={isSaved ? "Remove from Schedule" : "Add to Schedule"}
            >
              <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark text-sm`}></i>
            </button>
          )}
        </div>

        {/* Relevance Badge & Tags Area */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
            Priority Score: {event.priorityScore}/10
          </span>
          {relevanceBadge && (
            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest border ${relevanceBadge.className}`}>
              {relevanceBadge.label} {(event as any).relevanceScore && `(${(event as any).relevanceScore})`}
            </span>
          )}
          {event.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 text-[9px] font-bold rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase tracking-widest border border-gray-200 dark:border-gray-700">
              #{tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-5 leading-relaxed font-medium">
          {event.description}
        </p>

        {/* Business Value Highlight (Compact) */}
        {event.whyItMattersForIworth && (
          <div className="mt-auto mb-5 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent border-l-2 border-blue-500 p-3 rounded-r-xl">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
              🔥 Business Impact for iWorth
            </h4>
            <p className="text-xs text-blue-900 dark:text-blue-200/80 font-medium leading-snug line-clamp-2">
              {event.whyItMattersForIworth}
            </p>
          </div>
        )}

        {/* Recommended Action (Inline Button) */}
        {event.suggestedAction && (
          <div className="mb-5 flex justify-between items-center py-3 border-y border-gray-100 dark:border-border/50">
            <span className="text-[11px] font-black tracking-widest text-gray-700 dark:text-gray-300">
              ⚡ Recommended Action
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                showToast(`✓ Move registered: "${event.suggestedAction}"`);
              }}
              className="text-xs font-bold bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 px-4 py-1.5 rounded-full transition-all shadow-sm flex items-center gap-2"
            >
              {event.suggestedAction} <i className="fas fa-arrow-right text-[10px]"></i>
            </button>
          </div>
        )}

        {/* Metrics/Revenue Intelligence */}
        {(event.estimatedValue != null || event.contactsPotential != null || event.iworthVertical) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {event.iworthVertical && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded-lg border border-gray-200 dark:border-gray-700">
                <i className="fas fa-bullseye opacity-50"></i> {event.iworthVertical}
              </span>
            )}
            {event.estimatedValue != null && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-lg border border-green-200 dark:border-green-500/20">
                <i className="fas fa-coins opacity-50"></i> KES {event.estimatedValue >= 1000000 ? (event.estimatedValue / 1000000).toFixed(1) + 'M' : event.estimatedValue.toLocaleString()}
              </span>
            )}
            {event.contactsPotential != null && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-[10px] font-bold rounded-lg border border-violet-200 dark:border-violet-500/20">
                <i className="fas fa-users opacity-50"></i> {event.contactsPotential} Leads
              </span>
            )}
          </div>
        )}

        {/* Metadata Footer Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-medium text-gray-600 dark:text-gray-400 mt-auto">
          <div className="flex items-center gap-2 truncate">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 shrink-0">
              <i className="fas fa-calendar-alt text-[10px]"></i>
            </div>
            <span className="truncate">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 shrink-0">
              <i className="fas fa-map-marker-alt text-[10px]"></i>
            </div>
            <span className="truncate">{event.location}</span>
          </div>
          {event.organizer && (
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 shrink-0">
                <i className="fas fa-sitemap text-[10px]"></i>
              </div>
              <span className="truncate">{event.organizer}</span>
            </div>
          )}
          {sourceSite && (
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 shrink-0">
                <i className="fas fa-globe text-[10px]"></i>
              </div>
              <span className="truncate">{sourceSite}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar (Bottom) */}
      <div className="px-5 sm:px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-border/60 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          {/* Draft Proposal Button */}
          <button
            onClick={handleGenerateProposal}
            disabled={isGeneratingProposal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
              proposal 
                ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' 
                : 'bg-white hover:bg-amber-50 text-gray-600 hover:text-amber-600 border-gray-200 hover:border-amber-200 dark:bg-gray-800 dark:hover:bg-amber-500/10 dark:text-gray-400 dark:hover:text-amber-400 dark:border-gray-700 dark:hover:border-amber-500/30'
            }`}
          >
            {isGeneratingProposal ? (
              <div className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-600 rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-file-signature"></i>
            )}
            <span className="hidden sm:inline">{proposal ? 'Hide Draft' : 'Draft'}</span>
            <span className="sm:hidden">Draft</span>
          </button>

          {/* Attack Plan Button */}
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
              attackPlan 
                ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30' 
                : 'bg-white hover:bg-violet-50 text-gray-600 hover:text-violet-600 border-gray-200 hover:border-violet-200 dark:bg-gray-800 dark:hover:bg-violet-500/10 dark:text-gray-400 dark:hover:text-violet-400 dark:border-gray-700 dark:hover:border-violet-500/30'
            }`}
          >
            {isGenerating ? (
              <div className="w-3 h-3 border-2 border-violet-500/30 border-t-violet-600 rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-bolt"></i>
            )}
            <span className="hidden sm:inline">{attackPlan ? 'Hide Plan' : 'Plan'}</span>
            <span className="sm:hidden">Plan</span>
          </button>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); if (onExplore) onExplore(); }}
          className="text-primary hover:text-primary/80 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
        >
          Explore <i className="fas fa-arrow-right text-[8px]"></i>
        </button>
      </div>

      {/* Expanded Attack Plan Section */}
      {attackPlan && (
        <div className="px-5 sm:px-6 py-5 bg-violet-50 dark:bg-violet-500/10 border-t border-violet-100 dark:border-violet-500/20 shadow-inner">
          <h4 className="text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <i className="fas fa-satellite-dish"></i> Tactical AI Plan
          </h4>
          <div className="text-xs text-violet-900 dark:text-violet-200/90 leading-relaxed font-medium space-y-2">
            {attackPlan.split('\n').map((line, i) => (
              <p key={i}>{line.replace(/\*\*/g, '')}</p>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Proposal Plan Section */}
      {proposal && (
        <div className="px-5 sm:px-6 py-5 bg-amber-50 dark:bg-amber-500/10 border-t border-amber-100 dark:border-amber-500/20 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-file-signature"></i> Draft Proposal
            </h4>
            <button
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(proposal); showToast('Copied to clipboard!'); }}
              className="w-6 h-6 rounded flex items-center justify-center bg-amber-200/50 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/40 text-amber-700 dark:text-amber-400 transition-colors"
              title="Copy to clipboard"
            >
              <i className="far fa-copy text-[10px]"></i>
            </button>
          </div>
          <div className="text-xs text-amber-950 dark:text-amber-100/90 leading-relaxed font-serif whitespace-pre-wrap">
            {proposal.replace(/\*\*/g, '')}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCard;
