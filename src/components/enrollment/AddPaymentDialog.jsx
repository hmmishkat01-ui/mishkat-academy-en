import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Banknote, Calendar, Receipt } from 'lucide-react';

export default function AddPaymentDialog({ open, onClose, enrollment, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        new_payment: '',
        payment_method: '',
        payment_number: '',
        transaction_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_notes: '',
    });

    if (!enrollment) return null;

    const dueAmount = enrollment.due_amount || 0;
    const amountPaid = enrollment.amount_paid || 0;
    const payableAmount = enrollment.payable_amount || 0;

    const paymentStatusColors = {
        paid: 'bg-emerald-100 text-emerald-700',
        partial: 'bg-amber-100 text-amber-700',
        unpaid: 'bg-red-100 text-red-700',
        free: 'bg-blue-100 text-blue-700'
    };
    const paymentStatusLabels = { paid: 'Paid', partial: 'Partial', unpaid: 'Due', free: 'Free' };

    const handleSubmit = async () => {
        const newPayment = parseFloat(formData.new_payment);
        if (!newPayment || newPayment <= 0) {
            toast.error('Enter a valid payment amount');
            return;
        }
        if (newPayment > dueAmount) {
            toast.error(`Cannot exceed due amount (Maximum ৳${dueAmount})`);
            return;
        }
        if (!formData.payment_method) {
            toast.error('Select a payment method');
            return;
        }

        setLoading(true);
        try {
            const newAmountPaid = amountPaid + newPayment;
            const newDueAmount = payableAmount - newAmountPaid;
            const newPaymentStatus = newDueAmount <= 0 ? 'paid' : 'partial';

            await base44.entities.Enrollment.update(enrollment.id, {
                amount_paid: newAmountPaid,
                due_amount: Math.max(0, newDueAmount),
                payment_status: newPaymentStatus,
                payment_method: formData.payment_method,
                payment_number: formData.payment_number,
                transaction_id: formData.transaction_id,
                payment_date: formData.payment_date,
                payment_notes: formData.payment_notes,
            });

            toast.success(`৳${newPayment} payment added successfully!`);
            onSuccess();
            onClose();
            setFormData({
                new_payment: '',
                payment_method: '',
                payment_number: '',
                transaction_id: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_notes: '',
            });
        } catch (error) {
            toast.error('Error adding payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-[var(--primary-color)]" />
                        Add New Payment
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Courses & Payment Summary */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-700">{enrollment.course_name}</span>
                            <Badge className={paymentStatusColors[enrollment.payment_status]}>
                                {paymentStatusLabels[enrollment.payment_status]}
                            </Badge>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Batch:</span>
                            <span>{enrollment.batch_number}</span>
                        </div>
                        <div className="border-t pt-2 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Total Payable:</span>
                                <span className="font-medium">৳{payableAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600">
                                <span>Previously Paid:</span>
                                <span className="font-semibold">৳{amountPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-600 font-semibold border-t pt-1">
                                <span>Still Outstanding:</span>
                                <span>৳{dueAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* New Payment Amount */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">
                            How much are you paying? <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">৳</span>
                            <Input
                                type="number"
                                placeholder={`Maximum ${dueAmount}`}
                                value={formData.new_payment}
                                onChange={e => setFormData({ ...formData, new_payment: e.target.value })}
                                className="pl-7"
                                max={dueAmount}
                            />
                        </div>
                        {formData.new_payment && parseFloat(formData.new_payment) > 0 && (
                            <p className="text-xs text-emerald-600">
                                Remaining due after payment: ৳{Math.max(0, dueAmount - parseFloat(formData.new_payment)).toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">
                            Payment Method <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.payment_method} onValueChange={v => setFormData({ ...formData, payment_method: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bkash">bKash</SelectItem>
                                <SelectItem value="nagad">Cash</SelectItem>
                                <SelectItem value="rocket">Rocket</SelectItem>
                                <SelectItem value="bank">Bank</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Number & Transaction */}
                    {formData.payment_method && formData.payment_method !== 'cash' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Payment Number</Label>
                                <Input
                                    placeholder="01XXXXXXXXX"
                                    value={formData.payment_number}
                                    onChange={e => setFormData({ ...formData, payment_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Transaction ID</Label>
                                <Input
                                    placeholder="TXN ID"
                                    value={formData.transaction_id}
                                    onChange={e => setFormData({ ...formData, transaction_id: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Date */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Payment Date
                        </Label>
                        <Input
                            type="date"
                            value={formData.payment_date}
                            onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                        />
                    </div>

                    {/* Note */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Note (Optional)</Label>
                        <Input
                            placeholder="Any comments..."
                            value={formData.payment_notes}
                            onChange={e => setFormData({ ...formData, payment_notes: e.target.value })}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                        >
                            <Receipt className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : 'Add Payment'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
