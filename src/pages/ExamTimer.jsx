import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Pause, RotateCcw, Settings, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExamTimer() {
    const [settings, setSettings] = useState(null);
    const [examTitle, setExamTitle] = useState('');
    const [hours, setHours] = useState(1);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [running, setRunning] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [finished, setFinished] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        base44.entities.Settings.list().then(d => { if (d.length > 0) setSettings(d[0]); });
    }, []);

    useEffect(() => {
        if (running && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        setRunning(false);
                        setFinished(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [running]);

    const totalSeconds = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);

    const handleStart = () => {
        if (!running && timeLeft === 0) {
            setTimeLeft(totalSeconds);
            setFinished(false);
        }
        setRunning(true);
        setFullscreen(true);
    };

    const handlePause = () => setRunning(false);

    const handleReset = () => {
        setRunning(false);
        setTimeLeft(0);
        setFinished(false);
    };

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    };

    const progress = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0;
    const urgentColor = timeLeft <= 60 ? '#ef4444' : timeLeft <= 300 ? '#f59e0b' : 'var(--primary-color, #1e3a5f)';

    if (fullscreen) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
                 style={{ background: finished ? '#1a1a1a' : `linear-gradient(135deg, ${urgentColor}22, ${urgentColor}11, #0a0a0a)`, backgroundColor: '#0a0a0a' }}>
                {/* Close button */}
                <button onClick={() => { setFullscreen(false); setRunning(false); }}
                    className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
                    <X className="h-8 w-8" />
                </button>

                {/* Institute name */}
                <div className="text-center mb-6">
                    {settings?.logo_url && (
                        <img src={settings.logo_url} alt="logo" className="h-16 w-16 object-contain mx-auto mb-3 rounded-xl" />
                    )}
                    <h1 className="text-3xl font-bold text-white/90 tracking-wide">
                        {settings?.institute_name || 'Academy'}
                    </h1>
                </div>

                {/* Exam title */}
                {examTitle && (
                    <p className="text-xl text-white/70 mb-8 font-medium">{examTitle}</p>
                )}

                {/* Timer circle */}
                <div className="relative flex items-center justify-center mb-10">
                    <svg width="320" height="320" viewBox="0 0 320 320">
                        <circle cx="160" cy="160" r="145" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                        <circle cx="160" cy="160" r="145" fill="none"
                            stroke={finished ? '#ef4444' : urgentColor}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 145}`}
                            strokeDashoffset={`${2 * Math.PI * 145 * (1 - progress / 100)}`}
                            transform="rotate(-90 160 160)"
                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
                        />
                    </svg>
                    <div className="absolute text-center">
                        {finished ? (
                            <div>
                                <p className="text-5xl font-bold text-red-400 animate-pulse">Time's Up!</p>
                            </div>
                        ) : (
                            <p className="text-6xl font-bold text-white tabular-nums tracking-tight"
                               style={{ color: timeLeft <= 60 ? '#fca5a5' : 'white' }}>
                                {formatTime(timeLeft)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4">
                    {!finished && (
                        running ? (
                            <button onClick={handlePause}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors">
                                <Pause className="h-5 w-5" /> Pause
                            </button>
                        ) : (
                            <button onClick={() => setRunning(true)}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-colors"
                                style={{ backgroundColor: urgentColor }}>
                                <Play className="h-5 w-5" /> Resume
                            </button>
                        )
                    )}
                    <button onClick={() => { handleReset(); setFullscreen(false); }}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors">
                        <RotateCcw className="h-5 w-5" /> Reset
                    </button>
                </div>

                {timeLeft <= 60 && !finished && running && (
                    <p className="mt-6 text-red-400 font-semibold text-lg animate-pulse">⚠️ Only 1 minute left!</p>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color, #1e3a5f)' }}>
                    <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Exam Timer</h1>
                    <p className="text-sm text-slate-500">Set time and start fullscreen</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Timer Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Exam Title</Label>
                        <Input
                            value={examTitle}
                            onChange={e => setExamTitle(e.target.value)}
                            placeholder="e.g. Class Test - 1"
                        />
                    </div>

                    <div>
                        <Label className="block mb-2">Set Time</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 text-center">Hours</p>
                                <Input type="number" min="0" max="23" value={hours}
                                    onChange={e => setHours(e.target.value)}
                                    className="text-center text-2xl font-bold h-14" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 text-center">Minutes</p>
                                <Input type="number" min="0" max="59" value={minutes}
                                    onChange={e => setMinutes(e.target.value)}
                                    className="text-center text-2xl font-bold h-14" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 text-center">Seconds</p>
                                <Input type="number" min="0" max="59" value={seconds}
                                    onChange={e => setSeconds(e.target.value)}
                                    className="text-center text-2xl font-bold h-14" />
                            </div>
                        </div>
                    </div>

                    {/* Quick presets */}
                    <div>
                        <p className="text-xs text-slate-500 mb-2">Quick Set:</p>
                        <div className="flex gap-2 flex-wrap">
                            {[{h:0,m:15,s:0,l:'15 Minutes'},{h:0,m:30,s:0,l:'30 Minutes'},{h:1,m:0,s:0,l:'1 Hour'},{h:2,m:0,s:0,l:'2 Hours'},{h:3,m:0,s:0,l:'3 Hours'}].map(p => (
                                <button key={p.l} onClick={() => { setHours(p.h); setMinutes(p.m); setSeconds(p.s); }}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">
                                    {p.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleStart} disabled={totalSeconds === 0}
                        className="w-full h-12 text-base font-semibold gap-2"
                        style={{ backgroundColor: 'var(--primary-color, #1e3a5f)' }}>
                        <Maximize2 className="h-5 w-5" />
                        Start Timer in Fullscreen
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}