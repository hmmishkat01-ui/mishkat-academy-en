import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';

export default function EnrollmentForm({ open, onClose, student, enrollment, onSuccess }) {
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [filteredBatches, setFilteredBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        course_id: '',
        course_name: '',
        batch_id: '',
        batch_number: '',
        is_free: true,
        course_price: 0,
        discount_type: '',
        discount_value: 0,
        discount_reason: '',
        discount_amount: 0,
        payable_amount: 0,
        amount_paid: 0,
        due_amount: 0,
        payment_status: 'free',
        payment_method: '',
        payment_number: '',
        transaction_id: '',
        payment_date: '',
        payment_notes: '',
        enroll_date: new Date().toISOString().split('T')[0],
        status: 'active'
    });

    useEffect(() => {
        if (open) {
            loadData();
            if (enrollment) {
                setFormData({
                    course_id: enrollment.course_id || '',
                    course_name: enrollment.course_name || '',
                    batch_id: enrollment.batch_id || '',
                    batch_number: enrollment.batch_number || '',
                    is_free: enrollment.is_free ?? true,
                    course_price: enrollment.course_price || 0,
                    discount_type: enrollment.discount_type || '',
                    discount_value: enrollment.discount_value || 0,
                    discount_reason: enrollment.discount_reason || '',
                    discount_amount: enrollment.discount_amount || 0,
                    payable_amount: enrollment.payable_amount || 0,
                    amount_paid: enrollment.amount_paid || 0,
                    due_amount: enrollment.due_amount || 0,
                    payment_status: enrollment.payment_status || 'free',
                    payment_method: enrollment.payment_method || '',
                    payment_number: enrollment.payment_number || '',
                    transaction_id: enrollment.transaction_id || '',
                    payment_date: enrollment.payment_date || '',
                    payment_notes: enrollment.payment_notes || '',
                    enroll_date: enrollment.enroll_date || new Date().toISOString().split('T')[0],
                    status: enrollment.status || 'active'
                });
            }
        }
    }, [open, enrollment]);

    const loadData = async () => {
        const [coursesData, batchesData] = await Promise.all([
            base44.entities.Course.list(),
            base44.entities.Batch.list()
        ]);
        setCourses(coursesData);
        setBatches(batchesData);
    };

    const calculateDiscount = (coursePrice, discountType, discountValue) => {
        if (!discountType || !discountValue) return 0;
        return discountType === 'percentage' ? (coursePrice * discountValue) / 100 : discountValue;
    };

    const handleCourseChange = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        const courseBatches = batches.filter(b => b.course_id === courseId);
        setFilteredBatches(courseBatches);
        
        const isFree = course?.is_free ?? true;
        const coursePrice = course?.price || 0;
        
        setFormData({
            ...formData,
            course_id: courseId,
            course_name: course?.name || '',
            batch_id: '',
            batch_number: '',
            is_free: isFree,
            course_price: coursePrice,
            payable_amount: coursePrice,
            due_amount: coursePrice,
            payment_status: isFree ? 'free' : 'unpaid'
        });
    };

    const handleDiscountChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        
        if (field === 'discount_type' || field === 'discount_value') {
            const discountAmount = calculateDiscount(
                newFormData.course_price,
                newFormData.discount_type,
                parseFloat(newFormData.discount_value) || 0
            );
            const payableAmount = Math.max(0, newFormData.course_price - discountAmount);
            
            newFormData.discount_amount = discountAmount;
            newFormData.payable_amount = payableAmount;
            newFormData.due_amount = payableAmount - newFormData.amount_paid;
        }
        
        setFormData(newFormData);
    };

    const handleSubmit = async () => {
        if (!formData.course_id || !formData.batch_id) {
            toast.error('Please select Course and Batch');
            return;
        }

        setLoading(true);
        try {
            const dueAmount = formData.payable_amount - formData.amount_paid;
            let paymentStatus = formData.payment_status;
            
            if (!formData.is_free) {
                if (formData.amount_paid >= formData.payable_amount) {
                    paymentStatus = 'paid';
                } else if (formData.amount_paid > 0) {
                    paymentStatus = 'partial';
                } else {
                    paymentStatus = 'unpaid';
                }
            }

            const receiptId = formData.amount_paid > 0 && !enrollment 
                ? `RC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`
                : enrollment?.receipt_id || '';

            const enrollmentData = {
                ...formData,
                student_id: student.id,
                student_name: student.name,
                student_roll: student.roll_number,
                due_amount: dueAmount,
                payment_status: paymentStatus,
                receipt_id: receiptId
            };

            if (enrollment) {
                await base44.entities.Enrollment.update(enrollment.id, enrollmentData);
                toast.success('Enrollment updated');
            } else {
                await base44.entities.Enrollment.create(enrollmentData);
                toast.success('Enrolled in new course');
            }
            
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {enrollment ? 'Edit Enrollment' : 'Enroll in New Course'}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Select Course *</Label>
                            <Select value={formData.course_id} onValueChange={handleCourseChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.name} {course.is_free ? '(Free)' : `(৳${course.price})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Select Batch *</Label>
                            <Select 
                                value={formData.batch_id} 
                                onValueChange={(value) => {
                                    const batch = batches.find(b => b.id === value);
                                    setFormData({...formData, batch_id: value, batch_number: batch?.batch_number || ''});
                                }}
                                disabled={!formData.course_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredBatches.map(batch => (
                                        <SelectItem key={batch.id} value={batch.id}>
                                            {batch.batch_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Enrollment Date</Label>
                            <Input
                                type="date"
                                value={formData.enroll_date}
                                onChange={(e) => setFormData({...formData, enroll_date: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="dropped">Remove</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {!formData.is_free && (
                        <>
                            {/* ... keep existing code (discount and payment sections) ... */}
                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="font-semibold text-slate-800">Discount System</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Discount Type</Label>
                                        <Select 
                                            value={formData.discount_type} 
                                            onValueChange={(value) => handleDiscountChange('discount_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Discount Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={null}>No Discount</SelectItem>
                                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {formData.discount_type && (
                                        <div className="space-y-2">
                                            <Label>
                                                {formData.discount_type === 'percentage' ? 'Discount (%)' : 'Discount (৳)'}
                                            </Label>
                                            <Input
                                                type="number"
                                                value={formData.discount_value}
                                                onChange={(e) => handleDiscountChange('discount_value', parseFloat(e.target.value) || 0)}
                                                placeholder={formData.discount_type === 'percentage' ? '20' : '1000'}
                                            />
                                        </div>
                                    )}
                                </div>

                                {formData.discount_type && (
                                    <div className="space-y-2">
                                        <Label>Reason for Discount</Label>
                                        <Select 
                                            value={formData.discount_reason} 
                                            onValueChange={(value) => setFormData({...formData, discount_reason: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Reason" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="special_offer">Special Offer</SelectItem>
                                                <SelectItem value="financial_support">Financial Aid</SelectItem>
                                                <SelectItem value="ramadan_offer">Ramadan Offer</SelectItem>
                                                <SelectItem value="early_batch">Early Batch Offer</SelectItem>
                                                <SelectItem value="authority_approved">Authority Approved</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Course Fee:</span>
                                    <span className="font-semibold">৳{formData.course_price?.toFixed(2) || '0.00'}</span>
                                </div>
                                {formData.discount_amount > 0 && (
                                    <div className="flex justify-between items-center mb-2 text-red-600">
                                        <span className="text-sm">
                                            Discount ({formData.discount_type === 'percentage' ? `${formData.discount_value}%` : '৳'}):
                                        </span>
                                        <span className="font-semibold">–৳{formData.discount_amount?.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-slate-300">
                                    <span className="text-sm font-medium text-slate-700">Payable:</span>
                                    <span className="font-bold text-blue-600">৳{formData.payable_amount?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Paid:</span>
                                    <span className="font-semibold text-emerald-600">৳{formData.amount_paid?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-sm font-medium text-slate-700">Due:</span>
                                    <span className="font-bold text-red-600">৳{(formData.payable_amount - formData.amount_paid)?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Amount Paid</Label>
                                    <Input
                                        type="number"
                                        value={formData.amount_paid}
                                        onChange={(e) => setFormData({...formData, amount_paid: parseFloat(e.target.value) || 0})}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select 
                                        value={formData.payment_method} 
                                        onValueChange={(value) => setFormData({...formData, payment_method: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bkash">bKash</SelectItem>
                                            <SelectItem value="nagad">Cash</SelectItem>
                                            <SelectItem value="rocket">Rocket</SelectItem>
                                            <SelectItem value="bank">Bank Transfer</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Payment Number</Label>
                                    <Input
                                        value={formData.payment_number}
                                        onChange={(e) => setFormData({...formData, payment_number: e.target.value})}
                                        placeholder="01XXXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Transaction ID</Label>
                                    <Input
                                        value={formData.transaction_id}
                                        onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                                        placeholder="TXN123456"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Date</Label>
                                <Input
                                    type="date"
                                    value={formData.payment_date}
                                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Note (Optional)</Label>
                                <Input
                                    value={formData.payment_notes}
                                    onChange={(e) => setFormData({...formData, payment_notes: e.target.value})}
                                    placeholder="Write any special notes here"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                        >
                            {loading ? 'Processing...' : enrollment ? 'Update' : 'Enroll'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}