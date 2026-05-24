import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Layers, Edit2, Receipt, Award, IdCard, MoreVertical, Trash2, Eye, CreditCard } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import IDCardComponent from '../student/IDCardComponent';
import CertificateComponent from '../student/CertificateComponent';
import EnrollmentDetailModal from './EnrollmentDetailModal';
import AddPaymentDialog from './AddPaymentDialog';

export default function EnrollmentCard({ enrollment, student, settings, onEdit, onViewReceipt, onIssueCertificate, onDelete }) {
    const [idCardOpen, setIdCardOpen] = useState(false);
    const [certificateOpen, setCertificateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [addPaymentOpen, setAddPaymentOpen] = useState(false);

    const paymentStatusColors = {
        paid: 'bg-emerald-100 text-emerald-700',
        partial: 'bg-amber-100 text-amber-700',
        unpaid: 'bg-red-100 text-red-700',
        free: 'bg-blue-100 text-blue-700'
    };
    const paymentStatusLabels = { paid: 'Paid', partial: 'Partial', unpaid: 'Due', free: 'Free' };
    const statusColors = {
        active: 'bg-green-100 text-green-700',
        completed: 'bg-blue-100 text-blue-700',
        dropped: 'bg-slate-100 text-slate-700'
    };
    const statusLabels = { active: 'Active', completed: 'Completed', dropped: 'Remove' };

    return (
        <>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-[var(--primary-color)] flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{enrollment.course_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Layers className="h-3 w-3 text-slate-400" />
                                    <span className="text-sm text-slate-500">{enrollment.batch_number}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--primary-color)]" onClick={() => setDetailOpen(true)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Badge className={paymentStatusColors[enrollment.payment_status]}>
                                {paymentStatusLabels[enrollment.payment_status]}
                            </Badge>
                            <Badge className={statusColors[enrollment.status]}>
                                {statusLabels[enrollment.status]}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {!enrollment.is_free && (
                        <div className="p-3 bg-slate-50 rounded-lg text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-600">Course Fee:</span>
                                <span className="font-semibold">৳{enrollment.course_price?.toFixed(2)}</span>
                            </div>
                            {enrollment.discount_amount > 0 && (
                                <div className="flex justify-between mb-1 text-red-600">
                                    <span>Discount:</span>
                                    <span>–৳{enrollment.discount_amount?.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between mb-1 font-medium text-blue-600">
                                <span>Payable:</span>
                                <span>৳{enrollment.payable_amount?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="text-emerald-600">Paid:</span>
                                <span className="font-semibold text-emerald-700">৳{enrollment.amount_paid?.toFixed(2)}</span>
                            </div>
                            {enrollment.due_amount > 0 && (
                                <div className="flex justify-between text-red-600 font-medium">
                                    <span>Due:</span>
                                    <span>৳{enrollment.due_amount?.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {enrollment.enroll_date && (
                        <p className="text-xs text-slate-500">
                            Enrollments: {new Date(enrollment.enroll_date).toLocaleDateString('bn-BD')}
                        </p>
                    )}

                    <div className="flex gap-2 flex-wrap">
                        {!enrollment.is_free && enrollment.due_amount > 0 && (
                            <Button variant="outline" size="sm" onClick={() => setAddPaymentOpen(true)}
                                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                                <CreditCard className="h-3 w-3 mr-1" />
                                Make Payment
                            </Button>
                        )}
                        {!enrollment.certificate_issued && (
                            <Button variant="outline" size="sm" onClick={() => onIssueCertificate(enrollment)}
                                className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50">
                                <Award className="h-3 w-3 mr-1" />
                                Issue Certificate
                            </Button>
                        )}
                        {enrollment.certificate_issued && (
                            <Button variant="outline" size="sm" onClick={() => setCertificateOpen(true)}
                                className="flex-1 border-green-300 text-green-700 hover:bg-green-50">
                                <Award className="h-3 w-3 mr-1" />
                                View Certificate
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {!enrollment.is_free && enrollment.due_amount > 0 && (
                                    <DropdownMenuItem onClick={() => setAddPaymentOpen(true)}>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Add New Payment
                                    </DropdownMenuItem>
                                )}
                                {!enrollment.is_free && (
                                    <DropdownMenuItem onClick={() => onEdit(enrollment)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit Enrollment
                                    </DropdownMenuItem>
                                )}
                                {enrollment.amount_paid > 0 && (
                                    <DropdownMenuItem onClick={() => onViewReceipt(enrollment)}>
                                        <Receipt className="h-4 w-4 mr-2" />
                                        View Receipt
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setIdCardOpen(true)}>
                                    <IdCard className="h-4 w-4 mr-2" />
                                    ID Card
                                </DropdownMenuItem>
                                {!enrollment.certificate_issued && (
                                    <DropdownMenuItem onClick={() => onIssueCertificate(enrollment)} className="text-amber-600 focus:text-amber-700">
                                        <Award className="h-4 w-4 mr-2" />
                                        Issue Certificate
                                    </DropdownMenuItem>
                                )}
                                {enrollment.certificate_issued && (
                                    <DropdownMenuItem onClick={() => setCertificateOpen(true)} className="text-green-600 focus:text-green-700">
                                        <Award className="h-4 w-4 mr-2" />
                                        View Certificate
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Enrollment
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            {/* Detail Modal */}
            <EnrollmentDetailModal
                enrollment={enrollment}
                student={student}
                settings={settings}
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                onIssueCertificate={onIssueCertificate}
                onEdit={onEdit}
                onViewReceipt={onViewReceipt}
            />

            {/* ID Card Dialog */}
            {idCardOpen && student && settings && (
                <IDCardComponent
                    student={student}
                    course={enrollment.course_name}
                    batch={enrollment.batch_number}
                    settings={settings}
                    open={idCardOpen}
                    onClose={() => setIdCardOpen(false)}
                />
            )}

            {/* Certificate Dialog */}
            {certificateOpen && student && enrollment.certificate_issued && settings && (
                <CertificateComponent
                    student={student}
                    enrollment={enrollment}
                    settings={settings}
                    open={certificateOpen}
                    onClose={() => setCertificateOpen(false)}
                />
            )}

            {/* Add Payment Dialog */}
            <AddPaymentDialog
                open={addPaymentOpen}
                onClose={() => setAddPaymentOpen(false)}
                enrollment={enrollment}
                onSuccess={() => { setAddPaymentOpen(false); window.location.reload(); }}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Enrollment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {enrollment.course_name} student's enrollment from this course will be removed. This action cannot be undone. be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { onDelete(enrollment); setDeleteDialogOpen(false); }} className="bg-red-500 hover:bg-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}