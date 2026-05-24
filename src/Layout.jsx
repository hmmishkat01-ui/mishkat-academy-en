import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    BookOpen,
    Search,
    FileText,
    Settings,
    Menu,
    X,
    LogOut,
    Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settingsList = await base44.entities.Settings.list();
        if (settingsList.length > 0) {
            setSettings(settingsList[0]);
        }
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { name: 'Courses', icon: BookOpen, label: 'Courses' },
        { name: 'Batches', icon: Layers, label: 'Batch' },
        { name: 'Students', icon: Users, label: 'Students' },
        { name: 'Expenses', icon: FileText, label: 'Expenses' },
        { name: 'Search', icon: Search, label: 'Search' },
        { name: 'Reports', icon: FileText, label: 'Reports' },
        { name: 'ExamTimer', icon: GraduationCap, label: 'Exam Timer' },
        { name: 'Settings', icon: Settings, label: 'Settings' },
    ];

    const handleLogout = () => {
        base44.auth.logout();
    };

    return (
        <div className="min-h-screen bg-slate-50" dir="ltr">
            <style>{`
                :root {
                    --primary-color: ${settings?.primary_color || '#1e3a5f'};
                    --secondary-color: ${settings?.secondary_color || '#d4af37'};
                }
            `}</style>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--primary-color)] text-white px-4 py-3 flex items-center justify-between shadow-lg">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-white hover:bg-white/10"
                >
                    {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
                <div className="flex items-center gap-2">
                    {settings?.logo_url && (
                        <img src={settings.logo_url} alt="Logo" className="h-8 w-8 object-contain rounded" />
                    )}
                    <span className="font-semibold text-lg">
                        {settings?.institute_name || 'Course Management'}
                    </span>
                </div>
                <div className="w-10" />
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-40 h-screen w-64 
                bg-[var(--primary-color)] text-white
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Section */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded-lg bg-white p-1" />
                        ) : (
                            <div className="h-12 w-12 rounded-lg bg-[var(--secondary-color)] flex items-center justify-center">
                                <GraduationCap className="h-7 w-7 text-[var(--primary-color)]" />
                            </div>
                        )}
                        <div>
                            <h1 className="font-bold text-lg leading-tight">
                                {settings?.institute_name || 'Course Management'}
                            </h1>
                            <p className="text-xs text-white/60">Management System</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = currentPageName === item.name;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={createPageUrl(item.name)}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl
                                    transition-all duration-200
                                    ${isActive 
                                        ? 'bg-[var(--secondary-color)] text-[var(--primary-color)] font-semibold shadow-lg' 
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'}
                                `}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}