import React, { useRef, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import html2canvas from 'html2canvas';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function CertificateComponent({ student, enrollment, settings, open, onClose }) {
    const certificateRef = useRef(null);
    const [course, setCourse] = useState(null);

    useEffect(() => {
        if (enrollment?.course_id) {
            loadCourse();
        }
    }, [enrollment]);

    const loadCourse = async () => {
        try {
            const courseData = await base44.entities.Course.filter({ id: enrollment.course_id });
            if (courseData.length > 0) {
                setCourse(courseData[0]);
            }
        } catch (error) {
            console.error('Error loading course:', error);
        }
    };

    const handleDownload = async () => {
        if (!certificateRef.current) return;
        
        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `Certificate-${student.roll_number}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Certificate downloaded successfully');
        } catch (error) {
            toast.error('Error downloading');
        }
    };

    const handleShare = async () => {
        if (!certificateRef.current) return;
        
        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });
            canvas.toBlob(async (blob) => {
                if (navigator.share) {
                    const file = new File([blob], `Certificate-${student.roll_number}.png`, { type: 'image/png' });
                    await navigator.share({
                        files: [file],
                        title: 'Certificate',
                        text: `${student.name} - Certificate of Completion`
                    });
                } else {
                    toast.error('Sharing not supported');
                }
            });
        } catch (error) {
            toast.error('Error sharing');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Certificate of Completion</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleShare}>
                                <Share2 className="h-4 w-4 mr-1" />
                                Share
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                
                {/* Certificate */}
                <div 
                    ref={certificateRef}
                    className="bg-white p-12 relative overflow-hidden"
                    style={{ 
                        width: '1100px',
                        minHeight: '800px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                    }}
                >
                    {/* Decorative Border Frame */}
                    <div 
                        className="absolute inset-3 border-8 rounded-2xl"
                        style={{ 
                            borderColor: settings?.primary_color || '#1e3a5f',
                            borderStyle: 'double'
                        }}
                    />
                    <div 
                        className="absolute inset-6 border-2 rounded-xl opacity-40"
                        style={{ 
                            borderColor: settings?.secondary_color || '#d4af37'
                        }}
                    />

                    {/* Corner Decorations */}
                    <div className="absolute top-10 left-10 w-24 h-24 opacity-10">
                        <Award className="w-full h-full" style={{ color: settings?.secondary_color }} />
                    </div>
                    <div className="absolute bottom-10 right-10 w-24 h-24 opacity-10">
                        <Award className="w-full h-full" style={{ color: settings?.secondary_color }} />
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 text-center space-y-8 py-8">
                        {/* Header - Logo & Institute Name */}
                        <div className="flex flex-col items-center gap-6">
                            {settings?.logo_url && (
                                <div className="relative">
                                    <div 
                                        className="absolute inset-0 blur-xl opacity-20 rounded-full"
                                        style={{ backgroundColor: settings?.primary_color }}
                                    />
                                    <img 
                                        src={settings.logo_url} 
                                        alt="Logo" 
                                        className="relative h-28 w-28 object-contain drop-shadow-lg"
                                    />
                                </div>
                            )}
                            <div>
                                <h1 
                                    className="text-5xl font-bold mb-3 tracking-wide"
                                    style={{ color: settings?.primary_color || '#1e3a5f' }}
                                >
                                    {settings?.institute_name || 'Institute Name'}
                                </h1>
                                {settings?.address && (
                                    <p className="text-base text-slate-600 font-medium">{settings.address}</p>
                                )}
                            </div>
                        </div>

                        {/* Certificate Title */}
                        <div className="py-6">
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <div 
                                    className="h-1 w-20 rounded-full"
                                    style={{ backgroundColor: settings?.secondary_color || '#d4af37' }}
                                />
                                <h2 
                                    className="text-4xl font-bold"
                                    style={{ color: settings?.secondary_color || '#d4af37' }}
                                >
                                    {settings?.certificate_heading || 'Certificate of Completion'}
                                </h2>
                                <div 
                                    className="h-1 w-20 rounded-full"
                                    style={{ backgroundColor: settings?.secondary_color || '#d4af37' }}
                                />
                            </div>
                        </div>

                        {/* Certificate Text */}
                        <div className="space-y-6 py-4 px-16">
                            <p className="text-xl text-slate-600 leading-relaxed">This certificate is awarded to</p>
                            
                            <div className="py-6">
                                <h3 
                                    className="text-6xl font-bold py-4 px-8 inline-block relative"
                                    style={{ color: settings?.primary_color || '#1e3a5f' }}
                                >
                                    <div 
                                        className="absolute bottom-0 left-0 right-0 h-1 rounded-full opacity-30"
                                        style={{ backgroundColor: settings?.secondary_color }}
                                    />
                                    {student?.name}
                                </h3>
                            </div>

                            {course?.certificate_text ? (
                                <p className="text-lg text-slate-700 leading-relaxed max-w-3xl mx-auto px-8">
                                    {course.certificate_text}
                                </p>
                            ) : (
                                <p className="text-lg text-slate-700">
                                    <span className="font-semibold text-xl" style={{ color: settings?.primary_color }}>
                                        {enrollment?.course_name}
                                    </span> for successfully completing the course
                                </p>
                            )}
                        </div>

                        {/* Footer - Signature & Details */}
                        <div className="pt-16 px-12">
                            <div className="flex justify-between items-end">
                                {/* Left - Date */}
                                <div className="text-left space-y-2">
                                    <p className="text-sm text-slate-500 font-medium">Issue Date</p>
                                    <p className="text-lg font-semibold text-slate-700">
                                        {enrollment?.certificate_issue_date ? 
                                            new Date(enrollment.certificate_issue_date).toLocaleDateString('bn-BD', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            }) : ''
                                        }
                                    </p>
                                </div>

                                {/* Center - Certificate ID */}
                                <div className="text-center space-y-2">
                                    <div 
                                        className="w-32 h-32 rounded-full mx-auto flex items-center justify-center border-4 mb-2"
                                        style={{ 
                                            borderColor: settings?.secondary_color,
                                            backgroundColor: `${settings?.secondary_color}10`
                                        }}
                                    >
                                        <Award 
                                            className="w-16 h-16"
                                            style={{ color: settings?.secondary_color }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">Certificate No</p>
                                    <p 
                                        className="font-bold text-base tracking-wider"
                                        style={{ color: settings?.primary_color }}
                                    >
                                        {enrollment?.certificate_id}
                                    </p>
                                </div>

                                {/* Right - Authority Signature */}
                                <div className="text-right space-y-2">
                                    {settings?.signature_url && (
                                        <img 
                                            src={settings.signature_url} 
                                            alt="Signature" 
                                            className="h-20 w-auto ml-auto mb-2"
                                        />
                                    )}
                                    <div 
                                        className="h-0.5 w-56 ml-auto"
                                        style={{ backgroundColor: settings?.primary_color || '#1e3a5f' }}
                                    />
                                    <p 
                                        className="font-bold text-base"
                                        style={{ color: settings?.primary_color }}
                                    >
                                        {settings?.authority_name || 'Authority Name'}
                                    </p>
                                    <p className="text-sm text-slate-600 font-medium">
                                        {settings?.authority_title || 'Principal'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {settings?.institute_name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background Pattern */}
                    <div 
                        className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{
                            backgroundImage: `repeating-linear-gradient(45deg, ${settings?.primary_color} 0, ${settings?.primary_color} 1px, transparent 0, transparent 50%)`,
                            backgroundSize: '10px 10px'
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}