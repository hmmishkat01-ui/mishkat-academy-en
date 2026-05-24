import React from 'react';
import { Card } from '@/components/ui/card';

export default function StatCard({ icon: Icon, title, value, subtitle, color = 'blue' }) {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        pink: 'bg-pink-50 text-pink-600',
        yellow: 'bg-amber-50 text-amber-600',
        teal: 'bg-teal-50 text-teal-600',
    };

    return (
        <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm text-slate-500 font-medium">{title}</p>
                    <p className="text-3xl font-bold text-slate-800">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-slate-400">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colorStyles[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </Card>
    );
}