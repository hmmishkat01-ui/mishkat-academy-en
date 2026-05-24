import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Download, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

export default function IDCardComponent({ student, course, batch, settings, open, onClose }) {
    const cardRef = useRef(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `ID-Card-${student.roll_number}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('ID card downloaded successfully');
        } catch (error) {
            toast.error('Error downloading');
        }
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true
            });
            canvas.toBlob(async (blob) => {
                if (navigator.share) {
                    const file = new File([blob], `ID-Card-${student.roll_number}.png`, { type: 'image/png' });
                    await navigator.share({
                        files: [file],
                        title: 'Student ID Card',
                        text: `${student.name} - ${settings?.institute_name || 'Student ID Card'}`
                    });
                } else {
                    toast.error('Sharing not supported');
                }
            });
        } catch (error) {
            toast.error('Error sharing');
        }
    };

    const primaryColor = settings?.primary_color || '#1e3a5f';
    const secondaryColor = settings?.secondary_color || '#d4af37';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Student ID Card</span>
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
                
                <div className="flex justify-center py-6">
                    {/* Professional ID Card */}
                    <div 
                        ref={cardRef}
                        className="w-[450px] h-[280px] rounded-2xl overflow-hidden shadow-2xl relative"
                        style={{ 
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` 
                        }}
                    >
                        {/* Decorative Elements */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute top-6 left-6 text-9xl font-bold text-white">
                                {settings?.institute_name?.[0] || 'A'}
                            </div>
                        </div>

                        <div 
                            className="absolute top-0 right-0 w-40 h-40 rounded-bl-full opacity-20"
                            style={{ backgroundColor: secondaryColor }}
                        />
                        
                        <div 
                            className="absolute bottom-0 left-0 w-32 h-32 rounded-tr-full opacity-10"
                            style={{ backgroundColor: secondaryColor }}
                        />

                        {/* Header Section */}
                        <div className="relative p-5 pb-3 border-b border-white/20">
                            <div className="flex items-center gap-4">
                                {settings?.logo_url ? (
                                    <img 
                                        src={settings.logo_url} 
                                        alt="Logo" 
                                        className="h-14 w-14 rounded-xl bg-white p-2 object-contain shadow-lg"
                                    />
                                ) : (
                                    <div 
                                        className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg"
                                        style={{ backgroundColor: secondaryColor, color: primaryColor }}
                                    >
                                        {settings?.institute_name?.[0] || 'A'}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-white font-bold text-lg leading-tight">
                                        {settings?.institute_name || 'Academy'}
                                    </h3>
                                    <p className="text-white/80 text-xs mt-0.5">STUDENT IDENTITY CARD</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="relative px-5 py-4 flex gap-5">
                            {/* Photo Section */}
                            <div className="flex-shrink-0">
                                {student.photo_url ? (
                                    <img 
                                        src={student.photo_url} 
                                        alt={student.name}
                                        className="h-28 w-28 rounded-2xl object-cover border-3 border-white/40 shadow-xl"
                                    />
                                ) : (
                                    <div 
                                        className="h-28 w-28 rounded-2xl flex items-center justify-center text-4xl font-bold border-3 border-white/40 shadow-xl"
                                        style={{ backgroundColor: secondaryColor, color: primaryColor }}
                                    >
                                        {student.name?.[0]}
                                    </div>
                                )}
                            </div>

                            {/* Student Details */}
                            <div className="flex-1 text-white pt-1">
                                <h4 className="font-bold text-xl mb-2 leading-tight">{student.name}</h4>
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/60 min-w-[60px]">Roll No</span>
                                        <span className="font-semibold text-base" style={{ color: secondaryColor }}>
                                            {student.roll_number}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/60 min-w-[60px]">Courses</span>
                                        <span className="font-medium">{course || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/60 min-w-[60px]">Batch</span>
                                        <span className="font-medium">{batch || 'N/A'}</span>
                                    </div>
                                    {student.phone && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-white/60 min-w-[60px]">Mobile</span>
                                            <span className="text-white/90">{student.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Bar */}
                        <div 
                            className="absolute bottom-0 left-0 right-0 px-5 py-2.5 text-center"
                            style={{ backgroundColor: secondaryColor }}
                        >
                            <div className="flex items-center justify-between text-xs font-medium" style={{ color: primaryColor }}>
                                <span>{settings?.contact_phone || ''}</span>
                                <span>{settings?.website || 'www.example.com'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}