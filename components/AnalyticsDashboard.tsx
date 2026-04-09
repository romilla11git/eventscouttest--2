'use client';

import React, { useEffect, useState } from 'react';
import { getAnalyticsAction } from '@/app/actions/analytics';
import { getScraperIntelligenceAction, getRejectedEventsAction } from '@/app/actions/scraperIntelligence';
import { AlertTriangle, TrendingUp, Calendar, Hash, CheckCircle, BarChart2 } from 'lucide-react';

export function AnalyticsDashboard() {
    const [data, setData] = useState<any>(null);
    const [scraperIntel, setScraperIntel] = useState<any>(null);
    const [rejected, setRejected] = useState<any[]>([]);
    const [reasonFilter, setReasonFilter] = useState<string>('');
    const [debugMode, setDebugMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [analyticsRes, intelRes, rejectedRes] = await Promise.all([
                getAnalyticsAction(),
                getScraperIntelligenceAction(),
                getRejectedEventsAction(),
            ]);
            if (analyticsRes.success) setData(analyticsRes.data);
            setScraperIntel(intelRes);
            setRejected(rejectedRes || []);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return (
        <div className="p-8 text-gray-400 dark:text-white/50 animate-pulse">
            Analyzing tech market intelligence...
        </div>
    );
    if (!data) return (
        <div className="p-8 text-red-500 dark:text-red-400">
            Failed to load analytics engine.
        </div>
    );

    const maxTagCount = Math.max(...data.trendingTags.map((t: any) => t.count), 1);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── Daily Digest Banner ── */}
            {data.dailyCount > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="w-6 h-6 shrink-0" />
                    <div>
                        <h3 className="font-bold text-lg">Daily Digest Ready</h3>
                        <p className="text-sm opacity-80">
                            Antigravity AI discovered <strong>{data.dailyCount}</strong> new intelligence assets in the last 24 hours.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Strategic Analytics Grid ── */}
            <div className="mb-4">
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Strategic Analytics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Opportunities', value: data.totalEvents, icon: Hash, color: 'text-indigo-600 dark:text-indigo-400' },
                    { label: 'High-Priority Deals', value: data.topEvents.length, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Conflicts', value: data.conflictingEvents.length, icon: AlertTriangle, color: data.conflictingEvents.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-300 dark:text-white/20' },
                    { label: 'Audit Logs', value: data.auditLogsCount, icon: BarChart2, color: 'text-blue-600 dark:text-blue-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                        <span className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/40 font-bold">{stat.label}</span>
                        <div className="absolute inset-0 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                ))}
            </div>

            {/* ── Scraper Intelligence Stats ── */}
            {scraperIntel && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Events Discovered', value: scraperIntel.eventsDiscovered },
                        { label: 'Events Saved', value: scraperIntel.eventsSaved },
                        { label: 'Events Rejected', value: scraperIntel.eventsRejected },
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/40 font-bold mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Trending Tech Tags ── */}
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Sector Trends</h3>
                    </div>
                    <div className="space-y-4">
                        {data.trendingTags.map((tag: any, i: number) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/50 px-1">
                                    <span>{tag.name}</span>
                                    <span>{tag.count}</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-1000 ease-out"
                                        style={{ width: `${(tag.count / maxTagCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {data.trendingTags.length === 0 && (
                            <p className="text-center text-sm text-gray-400 dark:text-white/20 py-8">No trending data yet.</p>
                        )}
                    </div>
                </div>

                {/* ── Priority High-Relevance Assets ── */}
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart2 className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Top Priority Intelligence</h3>
                    </div>
                    <div className="space-y-3">
                        {data.topEvents.map((event: any, i: number) => (
                            <div key={i} className="bg-white dark:bg-white/5 p-3 rounded-xl flex items-center gap-3 group hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-gray-100 dark:border-transparent">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
                                    {event.priorityScore}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-sm truncate text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {event.title}
                                    </h4>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/40">
                                        {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Conflict Warning Panel ── */}
            {data.conflictingEvents.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-6 h-6" />
                        <h3 className="text-xl font-black tracking-tight uppercase">Strategic Conflict Alert</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.conflictingEvents.map((event: any, i: number) => (
                            <div key={i} className="bg-white dark:bg-white/5 p-4 rounded-xl border-l-4 border-amber-400 dark:border-amber-500/50">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{event.title}</h4>
                                <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-white/50 uppercase tracking-widest font-bold">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {new Date(event.date).toLocaleDateString()}
                                    </span>
                                    <span>{event.locationCity || 'Nairobi'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Rejection Analytics ── */}
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Scraper Rejection Intelligence</h3>
                        <p className="text-xs text-gray-500 dark:text-white/60">Every filtered event is logged with a structured reason for audit.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-white/60 flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="accent-emerald-500"
                                checked={debugMode}
                                onChange={(e) => setDebugMode(e.target.checked)}
                            />
                            Debug Mode
                        </label>
                        <select
                            value={reasonFilter}
                            onChange={async (e) => {
                                const value = e.target.value;
                                setReasonFilter(value);
                                const rows = await getRejectedEventsAction(value || undefined);
                                setRejected(rows || []);
                            }}
                            className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/20 rounded-md px-2 py-1 text-xs text-gray-900 dark:text-white"
                        >
                            <option value="">All Reasons</option>
                            <option value="MISSING_TITLE">MISSING_TITLE</option>
                            <option value="MISSING_DATE">MISSING_DATE</option>
                            <option value="MISSING_LOCATION">MISSING_LOCATION</option>
                            <option value="INVALID_DATE">INVALID_DATE</option>
                            <option value="PAST_EVENT">PAST_EVENT</option>
                            <option value="BLOCKED_KEYWORD">BLOCKED_KEYWORD</option>
                            <option value="NOT_RELEVANT_TO_IWORTH">NOT_RELEVANT_TO_IWORTH</option>
                            <option value="DUPLICATE_EVENT">DUPLICATE_EVENT</option>
                            <option value="HTTP_ERROR">HTTP_ERROR</option>
                            <option value="SCRAPER_FAILURE">SCRAPER_FAILURE</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[360px]">
                    <table className="min-w-full text-xs text-left">
                        <thead className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-white/40 border-b border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="py-2 pr-4">URL</th>
                                <th className="py-2 pr-4">Title</th>
                                <th className="py-2 pr-4">Source</th>
                                <th className="py-2 pr-4">Reason</th>
                                <th className="py-2 pr-4 whitespace-nowrap">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rejected.map((row, i) => (
                                <tr key={row.id ?? i} className="border-b border-gray-100 dark:border-white/5 align-top">
                                    <td className="py-2 pr-4 max-w-xs">
                                        <a href={row.url} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline break-all">
                                            {row.url}
                                        </a>
                                    </td>
                                    <td className="py-2 pr-4 max-w-xs text-gray-800 dark:text-white/80">
                                        {row.titleExtracted || '—'}
                                        {debugMode && row.extractedJson && (
                                            <details className="mt-1 text-[10px] text-gray-500 dark:text-white/60">
                                                <summary className="cursor-pointer">JSON</summary>
                                                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap bg-gray-100 dark:bg-black/30 p-2 rounded-md border border-gray-200 dark:border-white/10">
{JSON.stringify(row.extractedJson, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-500 dark:text-white/60">{row.sourceSite || '—'}</td>
                                    <td className="py-2 pr-4 text-amber-600 dark:text-amber-300 whitespace-nowrap">{row.reason}</td>
                                    <td className="py-2 pr-4 text-gray-400 dark:text-white/50 whitespace-nowrap">
                                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                                    </td>
                                </tr>
                            ))}
                            {rejected.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-gray-400 dark:text-white/40 text-xs">
                                        No rejected events recorded for the current filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
