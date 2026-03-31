"use client";

import React, { useState, useEffect } from 'react';
import { User, Event, Notification, UserRole } from '../types';
import Layout from './Layout';
import Dashboard from './Dashboard';
import UserProfile from './UserProfile';
import CalendarView from './CalendarView';
import AdminEvents from './AdminEvents';
import UserManagement from './UserManagement';
import ScraperControl from './ScraperControl';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import Toast from './Toast';
import LoginPage from './LoginPage';
import ChatAssistant from './ChatAssistant';
import { toggleSavedEventAction } from '@/app/actions/schedule';
import { updateUserProfileAction } from '@/app/actions/profile';
import { getEventsAction } from '@/app/actions/events';

export default function AppContainer() {
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [events, setEvents] = useState<Event[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    // Restore session from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('es-theme');
        if (savedTheme) {
            setIsDarkMode(savedTheme === 'dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDark);
        }
        const savedUser = localStorage.getItem('es-user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('es-user');
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        localStorage.setItem('es-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('es-user', JSON.stringify(user));
            refreshEvents();
        }
    }, [user?.id]);

    const refreshEvents = async () => {
        try {
            const data = await getEventsAction();
            setEvents(data as unknown as Event[]);
        } catch (e) {
            console.error('Failed to load events:', e);
        }
    };

    const addNotification = (message: string, type: Notification['type'] = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications(prev => [{
            id,
            message,
            type,
            timestamp: new Date().toISOString(),
            isRead: false
        }, ...prev]);
    };

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        setActiveTab('dashboard');
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('es-user');
        setActiveTab('dashboard');
        setEvents([]);
        setNotifications([]);
    };

    const handleToggleSave = async (id: string) => {
        if (!user) return;

        const isSaving = !user.savedEventIds.includes(id);

        setUser(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                savedEventIds: isSaving
                    ? [...prev.savedEventIds, id]
                    : prev.savedEventIds.filter(x => x !== id)
            };
        });

        // Persist to DB
        const res = await toggleSavedEventAction(user.id, id, isSaving);
        if (res.error) {
            addNotification("Failed to synchronize schedule with secure servers. Reverting.", "error");
            // Revert on failure
            setUser(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    savedEventIds: !isSaving
                        ? [...prev.savedEventIds, id]
                        : prev.savedEventIds.filter(x => x !== id)
                };
            });
        }
    };

    const handleRoleToggle = () => {
        setUser(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                role: prev.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN
            };
        });
    };

    // Show nothing until localStorage is checked (avoid flash)
    if (!isLoaded) return null;

    // Show login/register page if not authenticated
    if (!user) {
        return (
            <div className={isDarkMode ? 'dark' : ''}>
                <LoginPage
                    onLogin={handleLogin}
                    isDarkMode={isDarkMode}
                    onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                />
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <Dashboard
                        events={events}
                        user={user}
                        onToggleSave={handleToggleSave}
                        onExplore={() => setActiveTab('calendar')}
                        onRefresh={refreshEvents}
                    />
                );
            case 'assistant':
                return (
                    <ChatAssistant user={user} />
                );
            case 'profile':
                return (
                    <UserProfile
                        user={user}
                        onUpdate={async (u) => {
                            // Optimistic update
                            setUser(u);
                            // Persist to DB
                            const res = await updateUserProfileAction(u.id, {
                                interests: u.interests,
                                isVisible: u.isVisible
                            });
                            if (res.error) {
                                addNotification("Failed to save profile settings. They may revert on refresh.", "error");
                            }
                        }}
                        onReset={handleLogout}
                        addNotification={addNotification}
                    />
                );
            case 'calendar':
                return (
                    <CalendarView
                        events={events}
                        user={user}
                        onToggleSave={handleToggleSave}
                        onSync={() => addNotification('Outlook/Google Calendar sync sequence initiated.', 'info')}
                        addNotification={addNotification}
                    />
                );
            case 'admin':
                return (
                    <AdminEvents
                        events={events}
                        onUpdate={refreshEvents}
                        adminId={user.id}
                        addNotification={addNotification}
                    />
                );
            case 'users':
                return (
                    <UserManagement
                        events={events}
                        addNotification={addNotification}
                    />
                );
            case 'scrapers':
                return (
                    <ScraperControl
                        onNewEvents={refreshEvents}
                        addNotification={addNotification}
                    />
                );
            case 'analytics':
                return (
                    <AnalyticsDashboard />
                );
            default:
                return <div>Accessing secure sector...</div>;
        }
    };

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            <Layout
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onRoleToggle={handleRoleToggle}
                onLogout={handleLogout}
                notifications={notifications}
                isDarkMode={isDarkMode}
                onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            >
                {renderContent()}
            </Layout>

            <Toast
                notifications={notifications}
                onDismiss={(id) => setNotifications(prev => prev.filter(x => x.id !== id))}
            />
        </div>
    );
}
