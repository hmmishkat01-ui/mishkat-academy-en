import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

export default function PaymentReceiptComponent({ student, settings }) {
    const receiptRef = useRef(null);

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `Receipt-${student.receipt_id || student.roll_number}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Receipt downloaded successfully');
        } catch (error) {
            toast.error('Error downloading');
        }
    };

    const handleShare = async () => {
        if (!receiptRef.current) return;
        
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });
            canvas.toBlob(async (blob) => {
                if (navigator.share) {
                    const file = new File([blob], `Receipt-${student.receipt_id || student.roll_number}.png`, { type: 'image/png' });
                    await navigator.share({
                        files: [file],
                        title: 'Payment Receipt',
                        text: `Payment Receipt - ${student.name}`
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

    const paymentMethodLabels = {
        bkash: 'bKash',
        nagad: 'Cash',
        rocket: 'Rocket',
        bank: 'Bank Transfer',
        cash: 'Cash'
    };

    if (!student.amount_paid || student.amount_paid === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Payment Receipt
                        </span>
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
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-8 overflow-x-auto">
                    <div className="flex justify-center min-w-[600px]">
                        {/* Receipt */}
                        <div 
                            ref={receiptRef}
                            className="w-[600px] bg-white p-8 relative border-2"
                            style={{ borderColor: primaryColor }}
                        >
                            {/* Header */}
                            <div className="mb-6 pb-4 border-b-2" style={{ borderColor: secondaryColor }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        {settings?.logo_url && (
                                            <img 
                                                src={settings.logo_url} 
                                                alt="Logo" 
                                                className="h-20 w-20 object-contain"
                                            />
                                        )}
                                        <div className="text-left">
                                            <h1 
                                                className="text-2xl font-bold mb-1"
                                                style={{ color: primaryColor }}
                                            >
                                                {settings?.institute_name || 'Academy'}
                                            </h1>
                                            {settings?.address && (
                                                <p className="text-xs text-slate-600">{settings.address}</p>
                                            )}
                                            {settings?.contact_phone && (
                                                <p className="text-xs text-slate-600">Phone: {settings.contact_phone}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div 
                                            className="inline-block px-4 py-2 rounded-lg"
                                            style={{ backgroundColor: secondaryColor }}
                                        >
                                            <span className="font-bold text-white text-sm">Official Receipt</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Official Payment Receipt</p>
                                    </div>
                                </div>
                            </div>

                            {/* Receipt Info */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-sm">
                                <div>
                                    <span className="text-slate-500">Receipt No:</span>
                                    <span className="font-semibold ml-2" style={{ color: primaryColor }}>
                                        {student.receipt_id || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Date:</span>
                                    <span className="font-semibold ml-2">
                                        {student.payment_date 
                                            ? format(new Date(student.payment_date), 'dd/MM/yyyy')
                                            : format(new Date(), 'dd/MM/yyyy')
                                        }
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Student Name:</span>
                                    <span className="font-semibold ml-2">{student.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Roll No:</span>
                                    <span className="font-semibold ml-2">{student.roll_number}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-slate-500">Course:</span>
                                    <span className="font-semibold ml-2">{student.course_name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Batch:</span>
                                    <span className="font-semibold ml-2">{student.batch_number}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Phone:</span>
                                    <span className="font-semibold ml-2">{student.phone}</span>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: `${primaryColor}30`, backgroundColor: `${secondaryColor}10` }}>
                                <h3 className="font-semibold mb-3 flex items-center justify-between" style={{ color: primaryColor }}>
                                    <span>Payment Details</span>
                                    <span className="text-xs font-normal text-slate-500">Payment Breakdown</span>
                                </h3>
                                <div className="space-y-2 text-sm bg-white p-3 rounded">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Course Fee:</span>
                                        <span className="font-semibold">৳ {student.course_price?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {student.discount_amount > 0 && (
                                        <>
                                            <div className="flex justify-between text-red-600">
                                                <span>
                                                    Discount ({student.discount_type === 'percentage' ? `${student.discount_value}%` : 'Fixed'}):
                                                </span>
                                                <span className="font-semibold">– ৳ {student.discount_amount?.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t-2 pt-2" style={{ borderColor: primaryColor }}>
                                                <div className="flex justify-between font-semibold" style={{ color: primaryColor }}>
                                                    <span>Payable:</span>
                                                    <span>৳ {student.payable_amount?.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-600">Payment Method:</span>
                                            <span className="font-semibold">
                                                {paymentMethodLabels[student.payment_method] || 'N/A'}
                                            </span>
                                        </div>
                                        {student.payment_number && (
                                            <div className="flex justify-between mb-1">
                                                <span className="text-slate-600">Payment Number:</span>
                                                <span className="font-semibold">{student.payment_number}</span>
                                            </div>
                                        )}
                                        {student.transaction_id && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Transaction ID:</span>
                                                <span className="font-mono text-xs">{student.transaction_id}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div 
                                        className="flex justify-between pt-3 mt-2 border-t-2 text-lg"
                                        style={{ borderColor: primaryColor }}
                                    >
                                        <span className="font-bold" style={{ color: primaryColor }}>Amount Received:</span>
                                        <span className="font-bold" style={{ color: primaryColor }}>
                                            ৳ {student.amount_paid?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                    {student.due_amount > 0 && (
                                        <div className="flex justify-between text-red-600 font-semibold">
                                            <span>Due:</span>
                                            <span>৳ {student.due_amount?.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Discount Note */}
                            {student.discount_amount > 0 && student.discount_reason && (
                                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                                    <p className="text-xs text-slate-600 mb-1">Discount Note:</p>
                                    <p className="text-sm font-medium text-slate-700">
                                        {student.discount_type === 'percentage' ? `${student.discount_value}%` : `৳${student.discount_value}`} Discount applied করা হয়েছে - 
                                        {student.discount_reason === 'special_offer' && ' Special Offer'}
                                        {student.discount_reason === 'financial_support' && ' Financial Aid'}
                                        {student.discount_reason === 'ramadan_offer' && ' Ramadan Special Offer'}
                                        {student.discount_reason === 'early_batch' && ' Early Batch Offer'}
                                        {student.discount_reason === 'authority_approved' && ' Authority Approved Special Discount'}
                                        {student.discount_reason === 'custom' && ' Special Discount'}
                                    </p>
                                </div>
                            )}

                            {student.payment_notes && (
                                <div className="mb-4 p-3 bg-slate-50 rounded">
                                    <span className="text-slate-500 text-xs">Additional Note:</span>
                                    <p className="text-sm mt-1">{student.payment_notes}</p>
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="mb-6 text-center">
                                <div 
                                    className="inline-block px-8 py-3 rounded-lg shadow-md"
                                    style={{ 
                                        background: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
                                        color: 'white' 
                                    }}
                                >
                                    <span className="font-bold text-lg">✓ Payment Completed</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">PAYMENT RECEIVED</p>
                            </div>

                            {/* Footer */}
                            <div className="pt-4 border-t-2" style={{ borderColor: primaryColor }}>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-slate-600">
                                        <p className="font-medium mb-1" style={{ color: primaryColor }}>
                                            Payment officially verified by {settings?.institute_name || 'Institute'}
                                        </p>
                                        <p className="text-slate-500">Payment received and verified - Accounts Dept.</p>
                                    </div>
                                    <div className="text-right">
                                        {settings?.signature_url && (
                                            <img 
                                                src={settings.signature_url} 
                                                alt="Signature" 
                                                className="h-14 mb-1 ml-auto"
                                            />
                                        )}
                                        <div className="border-t-2 pt-1 min-w-[140px]" style={{ borderColor: primaryColor }}>
                                            <p className="font-bold text-sm" style={{ color: primaryColor }}>
                                                {settings?.authority_name || 'Authority'}
                                            </p>
                                            <p className="text-xs text-slate-600 font-medium">
                                                {settings?.authority_title || 'Director'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">Authorized Signature</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}