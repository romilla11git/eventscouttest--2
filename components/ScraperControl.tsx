"use client";

import React, { useState, useEffect } from 'react';
import { ScraperLog } from '../types';
import { getScraperLogsAction, deleteScraperLogAction, deleteAllScraperLogsAction } from '@/app/actions/admin';

interface ScraperControlProps {
  onNewEvents: () => void;
  addNotification: (msg: string, type: 'info' | 'success' | 'error') => void;
}

const ScraperControl: React.FC<ScraperControlProps> = ({ onNewEvents, addNotification }) => {
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    getScraperLogsAction().then(l => setLogs(l as ScraperLog[]));
  }, []);

  const handleDeleteLog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await deleteScraperLogAction(id);
    if (res.success) {
      setLogs(prev => prev.filter(log => log.id !== id));
      addNotification("Log deleted", "success");
    } else {
      addNotification("Failed to delete log", "error");
    }
  };

  const handleClearLogs = async () => {
    const res = await deleteAllScraperLogsAction();
    if (res.success) {
      setLogs([]);
      addNotification("All logs cleared", "success");
    } else {
      addNotification("Failed to clear logs", "error");
    }
  };

  const runScraper = async () => {
    setIsScraping(true);
    addNotification("AI Scraper sequence initiated. Parsing global assets...", "info");

    try {
      const res = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        if (result.log) {
          setLogs(prev => [result.log as ScraperLog, ...prev]);
        }
        addNotification(`Normalization successful. ${result.eventsCreated ?? 0} asset(s) queued for moderation.`, "success");
        onNewEvents();
      } else {
        if (result.log) {
          setLogs(prev => [result.log as ScraperLog, ...prev]);
        }
        addNotification(`Scraper completed with errors: ${result.error ?? 'Unknown error'}`, "error");
      }
    } catch (error) {
      console.error(error);
      addNotification("Scraper encountered a critical error.", "error");
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-8 sticky top-24 shadow-sm">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-500 mb-8 shadow-lg shadow-cyan-500/5">
            <i className="fas fa-robot text-3xl"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter uppercase">Scout Control</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-10 leading-relaxed font-medium">
            Manually trigger AI agents to scan configured enterprise channels.
            All findings will appear as unverified records in the Event Queue.
          </p>

          <button
            onClick={runScraper}
            disabled={isScraping}
            className={`w-full py-5 px-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 shadow-xl ${isScraping
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
              : 'bg-cyan-500 hover:bg-cyan-600 text-white'
              }`}
          >
            {isScraping ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-white dark:border-t-gray-950 rounded-full animate-spin"></div>
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <i className="fas fa-play text-[10px]"></i>
                <span>Initiate Scan</span>
              </>
            )}
          </button>

          <div className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-6">Neural API Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Exa Search</span>
                <span className="text-[9px] px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-500 rounded-md font-black tracking-widest">OPERATIONAL</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Firecrawl Scraper</span>
                <span className="text-[9px] px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-500 rounded-md font-black tracking-widest">OPERATIONAL</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Gemini API</span>
                <span className="text-[9px] px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-500 rounded-md font-black tracking-widest">PRIMARY</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Groq LLM</span>
                <span className="text-[9px] px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-500 rounded-md font-black tracking-widest">OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center tracking-tight">
            <i className="fas fa-stream mr-4 text-gray-400"></i>
            Operational Audit Log
          </h3>
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="max-h-[700px] overflow-y-auto scrollbar-hide">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-8 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all group relative">
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteLog(log.id, e)}
                      className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      title="Delete log"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${log.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500'}`}>
                      {log.status}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-bold tracking-tight mb-3">{log.message}</p>
                  {log.eventsFound > 0 && (
                    <div className="inline-flex items-center space-x-2 text-[10px] text-cyan-600 dark:text-cyan-500 font-black uppercase tracking-widest">
                      <i className="fas fa-plus-circle"></i>
                      <span>{log.eventsFound} draft(s) created</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-32 text-center text-gray-400 dark:text-gray-600 font-medium italic">
                <p>No activity records present in the local cache.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScraperControl;
