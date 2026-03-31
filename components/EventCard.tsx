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
  // Display as Day Month Year (e.g. 9 Mar 2026) for the dashboard
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

  const getBusinessTag = () => {
    const category = (event.category || '').toLowerCase();
    const text = (event.title + ' ' + event.description).toLowerCase();

    if (category.includes('edtech') || text.includes('edtech') || text.includes('smart classroom')) {
      return 'EdTech Conference';
    }
    if (category.includes('ict') || text.includes('ict') || text.includes('network')) {
      return 'ICT Opportunity';
    }
    if (category.includes('av') || text.includes('interactive display') || text.includes('audio visual')) {
      return 'AV Exhibition';
    }
    if (text.includes('summit') || text.includes('expo') || text.includes('innovation')) {
      return 'Innovation Summit';
    }
    return null;
  };

  const businessTag = getBusinessTag();

  const getRelevanceBadge = () => {
    const score = (event as any).relevanceScore as number | undefined;
    if (score == null) return null;
    if (score >= 90) return { label: 'Strategic Opportunity', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40' };
    if (score >= 70) return { label: 'Strong Opportunity', className: 'bg-blue-500/10 text-blue-400 border-blue-500/40' };
    if (score >= 60) return { label: 'Possible Opportunity', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40' };
    return null;
  };

  const relevanceBadge = getRelevanceBadge();

  const handleGeneratePlan = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (attackPlan) {
      setAttackPlan(null); // toggle off
      return;
    }
    setIsGenerating(true);
    const res = await generateAttackPlanAction(event.title, formattedDate);
    if (res.success) {
      setAttackPlan(res.plan);
    } else {
      setAttackPlan("Failed to generate intelligence plan: " + res.error);
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
      setProposal("Failed to generate custom proposal: " + res.error);
    }
    setIsGeneratingProposal(false);
  };

  return (
    <div
      className={`group relative bg-card backdrop-blur-xl border border-border rounded-[1.75rem] overflow-hidden transition-all duration-300 ease-out flex flex-col h-full shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:bg-card-solid before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-secondary before:to-transparent before:opacity-0 hover:before:opacity-60 before:transition-opacity ${event.sourceUrl ? 'cursor-pointer' : ''}`}
      onClick={() => {
        if (event.sourceUrl) {
          window.open(event.sourceUrl, '_blank');
        }
      }}
    >
      <div className="p-8 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-6">
          {relevanceBadge && (
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest border ${relevanceBadge.className}`}>
              {relevanceBadge.label}{' '}
              {(event as any).relevanceScore != null && (
                <span className="opacity-80">({(event as any).relevanceScore}/100)</span>
              )}
            </span>
          )}
          <div className="flex items-center space-x-2">
            {event.conflictStatus && (
              <div className="flex items-center text-orange-600 dark:text-orange-500 p-1.5" title="Schedule Conflict Detected">
                <i className="fas fa-exclamation-triangle text-xs"></i>
              </div>
            )}
            {event.opportunityType && (
              <span className="px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
                <i className="fas fa-building mr-1.5"></i>{event.opportunityType}
              </span>
            )}
            {onToggleSave && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                className={`p-2 rounded-xl transition-all ${isSaved
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                title={isSaved ? "Remove from Schedule" : "Add to Schedule"}
              >
                <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark`}></i>
              </button>
            )}
          </div>
        </div>

        <h3 className="text-[1.4rem] font-heading font-bold text-foreground mb-3 leading-[1.3] group-hover:text-primary transition-colors tracking-tight">
          {event.title}
        </h3>

        <p className="text-secondary text-[0.9rem] mb-4 line-clamp-3 font-medium leading-[1.48]">
          {event.description}
        </p>

        {event.whyItMattersForIworth && (
          <div className="bg-gradient-to-br from-primary/5 to-transparent border-l-[3px] border-secondary p-3 sm:p-4 rounded-xl mb-4 transition-all">
            <div className="font-bold text-[0.68rem] uppercase tracking-wider text-secondary flex items-center gap-1.5 mb-1.5">
              <i className="fas fa-chart-line"></i> Business Value · iWorth Edge
            </div>
            <div className="text-secondary font-medium text-[0.85rem] leading-snug line-clamp-2">
              {event.whyItMattersForIworth}
            </div>
          </div>
        )}

        {event.suggestedAction && (
          <div className="flex justify-between items-center flex-wrap gap-2 mb-4 mt-1 border-t border-border pt-4">
            <div className="inline-flex items-center gap-2 text-[0.7rem] font-bold text-secondary bg-primary/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <i className="fas fa-bolt"></i> SUGGESTED MOVE
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                showToast(`✓ Strategic move registered: "${event.suggestedAction}" for ${event.title} · iWorth action logged`);
              }}
              className="bg-gradient-to-r from-primary to-secondary text-white border-none py-2 px-4 rounded-full font-bold text-[0.75rem] flex items-center gap-2 transition-all duration-200 hover:scale-[0.97] hover:brightness-105 shadow-md hover:shadow-[0_8px_18px_rgba(59,130,246,0.3)] ml-auto"
            >
              <i className="fas fa-arrow-right"></i> {event.suggestedAction}
            </button>
          </div>
        )}
        
        {(event.estimatedValue != null || event.contactsPotential != null || event.iworthVertical) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {event.iworthVertical && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider rounded border border-primary/20">
                <i className="fas fa-bullseye mr-1 opacity-70"></i>{event.iworthVertical}
              </span>
            )}
            {event.estimatedValue != null && (
              <span className="px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-400 text-[9px] font-black uppercase tracking-wider rounded border border-green-500/20">
                <i className="fas fa-money-bill-wave mr-1 opacity-70"></i>KES {event.estimatedValue >= 1000000 ? (event.estimatedValue / 1000000).toFixed(1) + 'M' : event.estimatedValue.toLocaleString()}
              </span>
            )}
            {event.contactsPotential != null && (
              <span className="px-2 py-1 bg-violet-500/10 text-violet-700 dark:text-violet-400 text-[9px] font-black uppercase tracking-wider rounded border border-violet-500/20">
                <i className="fas fa-users mr-1 opacity-70"></i>{event.contactsPotential} Leads
              </span>
            )}
          </div>
        )}

        <div className="space-y-4 mt-auto">
          {event.organizer && (
            <div className="flex items-center text-secondary text-xs font-bold uppercase tracking-widest">
              <i className="fas fa-sitemap w-6 text-primary"></i>
              <span className="truncate">{event.organizer}</span>
            </div>
          )}
          <div className="flex items-center text-secondary text-xs font-bold uppercase tracking-widest">
            <i className="fas fa-calendar-day w-6 text-primary"></i>
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center text-secondary text-xs font-bold uppercase tracking-widest">
            <i className="fas fa-map-marker-alt w-6 text-primary"></i>
            <span className="truncate">{event.location}</span>
          </div>
          {sourceSite && (
            <div className="flex items-center text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">
              <i className="fas fa-globe w-6 text-primary"></i>
              <span className="truncate">{sourceSite}</span>
            </div>
          )}
          {event.sourceUrl && (
            <div className="flex items-center text-blue-500 text-xs font-bold uppercase tracking-widest pt-1">
              <i className="fas fa-link w-6 opacity-70"></i>
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                View Original Source
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-5 border-t border-border bg-background/50 flex justify-between items-center">
        <div className="flex -space-x-1">
          {event.tags.slice(0, 2).map(tag => (
            <span key={tag} className="inline-block px-3 py-1 text-[10px] font-bold bg-card text-secondary rounded-lg border border-border uppercase tracking-widest mr-2 shadow-sm">
              #{tag}
            </span>
          ))}
          {businessTag && (
            <span className="inline-block px-3 py-1 text-[10px] font-black rounded-lg bg-primary/10 text-primary border border-primary/30 uppercase tracking-widest mr-2 shadow-sm">
              {businessTag}
            </span>
          )}
        </div>
        <div className="flex space-x-3 items-center">
          <button
            onClick={handleGenerateProposal}
            disabled={isGeneratingProposal}
            className="text-amber-600 dark:text-amber-500 hover:opacity-80 text-[10px] font-black uppercase tracking-[0.2em] flex items-center space-x-2 transition-all bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20"
          >
            {isGeneratingProposal ? (
              <div className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-600 rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-file-contract"></i>
            )}
            <span>{proposal ? 'Hide Draft' : 'Draft Proposal'}</span>
          </button>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="text-violet-600 dark:text-violet-500 hover:opacity-80 text-[10px] font-black uppercase tracking-[0.2em] flex items-center space-x-2 transition-all bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20"
          >
            {isGenerating ? (
              <div className="w-3 h-3 border-2 border-violet-500/30 border-t-violet-600 rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-bolt"></i>
            )}
            <span>{attackPlan ? 'Hide Plan' : 'Attack Plan'}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (onExplore) onExplore(); }}
            className="text-[#30AABF] hover:opacity-80 text-[10px] font-black uppercase tracking-[0.2em] flex items-center space-x-2"
          >
            <span>Explore</span>
            <i className="fas fa-chevron-right text-[8px]"></i>
          </button>
        </div>
      </div>

      {/* Expanded Attack Plan Section */}
      {attackPlan && (
        <div className="px-8 py-6 bg-gradient-to-br from-violet-900/5 to-fuchsia-900/5 dark:from-violet-500/10 dark:to-fuchsia-500/10 border-t border-violet-500/20 animate-in slide-in-from-top-4 duration-300">
          <h4 className="text-xs font-black text-violet-800 dark:text-violet-400 uppercase tracking-widest mb-4 flex items-center">
            <i className="fas fa-satellite-dish mr-2"></i> Antigravity Intelligence
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none text-violet-900 dark:text-violet-100/80 leading-relaxed font-medium">
            {attackPlan.split('\n').map((line, i) => (
              <p key={i} className="mb-2 text-sm">{line.replace(/\*\*/g, '')}</p>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Proposal Plan Section */}
      {proposal && (
        <div className="px-8 py-6 bg-gradient-to-br from-amber-900/5 to-orange-900/5 dark:from-amber-500/10 dark:to-orange-500/10 border-t border-amber-500/20 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center">
              <i className="fas fa-file-signature mr-2"></i> Official Draft Proposal
            </h4>
            <button
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(proposal); }}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 text-xs" title="Copy to clipboard">
              <i className="far fa-copy"></i>
            </button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-amber-950 dark:text-amber-100/80 leading-relaxed font-medium whitespace-pre-wrap font-serif">
            {proposal.replace(/\*\*/g, '')}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCard;
