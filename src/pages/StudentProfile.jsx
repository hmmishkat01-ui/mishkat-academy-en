import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
    ArrowLeft,
    Plus,
    Phone,
    Mail,
    Briefcase,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import EnrollmentCard from '../components/enrollment/EnrollmentCard';
import AssignmentSection from '../components/student/AssignmentSection';
import EnrollmentForm from '../components/enrollment/EnrollmentForm';
import EnrollmentReceiptComponent from '../components/enrollment/EnrollmentReceiptComponent';
import IDCardComponent from '../components/student/IDCardComponent';
import CertificateComponent from '../components/student/CertificateComponent';

export default function StudentProfile() {
    const [student, setStudent] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrollmentFormOpen, setEnrollmentFormOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [selectedReceiptEnrollment, setSelectedReceiptEnrollment] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const studentId = urlParams.get('id');
            
            if (!studentId) {
                setLoading(false);
                return;
            }

            const [studentsData, enrollmentsData, coursesData, settingsData] = await Promise.all([
                base44.entities.Student.filter({ id: studentId }),
                base44.entities.Enrollment.filter({ student_id: studentId }),
                base44.entities.Course.list(),
                base44.entities.Settings.list()
            ]);

            if (studentsData.length > 0) {
                setStudent(studentsData[0]);
            }

            setEnrollments(enrollmentsData || []);
            setCourses(coursesData || []);

            if (settingsData.length > 0) {
                setSettings(settingsData[0]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditEnrollment = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setEnrollmentFormOpen(true);
    };

    const handleAddEnrollment = () => {
        setSelectedEnrollment(null);
        setEnrollmentFormOpen(true);
    };

    const handleViewReceipt = (enrollment) => {
        setSelectedReceiptEnrollment(enrollment);
        setReceiptDialogOpen(true);
    };

    const handleIssueCertificate = async (enrollment) => {
        const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}`;
        const issueDate = new Date().toISOString().split('T')[0];

        try {
            await base44.entities.Enrollment.update(enrollment.id, {
                certificate_issued: true,
                certificate_id: certificateId,
                certificate_issue_date: issueDate
            });
            toast.success('Certificate issued successfully');
            loadData();
        } catch (error) {
            toast.error('Error issuing certificate');
        }
    };

    const handleDeleteEnrollment = async (enrollment) => {
        try {
            await base44.entities.Enrollment.delete(enrollment.id);
            toast.success('Enrollment deleted');
            loadData();
        } catch (error) {
            toast.error('Error deleting');
        }
    };

    const totalPaid = enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
    const totalDue = enrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="text-center py-16">
                <p className="text-slate-500">Student Not Found</p>
                <Link to={createPageUrl('Students')}>
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Student List
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={createPageUrl('Students')}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">Student Profile</h1>
                </div>
                <Button 
                    onClick={handleAddEnrollment}
                    className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll in New Course
                </Button>
            </div>

            {/* Student Info Card */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-[var(--primary-color)] to-[#2d4a6f]" />
                <CardContent className="relative pt-0 pb-6 px-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="-mt-12">
                            {student.photo_url ? (
                                <img 
                                    src={student.photo_url} 
                                    alt={student.name}
                                    className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="h-24 w-24 rounded-2xl bg-[var(--secondary-color)] flex items-center justify-center text-3xl font-bold text-[var(--primary-color)] border-4 border-white shadow-lg">
                                    {student.name?.[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 pt-2 md:pt-4">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
                                    <p className="text-slate-500">Roll Number: {student.roll_number}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <span>{student.phone}</span>
                                </div>
                                {student.email && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span>{student.email}</span>
                                    </div>
                                )}
                                {student.occupation && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Briefcase className="h-4 w-4 text-slate-400" />
                                        <span>{student.occupation}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span>{new Date(student.created_date).toLocaleDateString('bn-BD')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Summary */}
            {enrollments.some(e => !e.is_free) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <CardContent className="p-6">
                            <p className="text-sm text-emerald-700 mb-1">Total Paid</p>
                            <p className="text-3xl font-bold text-emerald-800">৳{totalPaid.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
                        <CardContent className="p-6">
                            <p className="text-sm text-red-700 mb-1">Total Due</p>
                            <p className="text-3xl font-bold text-red-800">৳{totalDue.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardContent className="p-6">
                            <p className="text-sm text-blue-700 mb-1">Total Enrollments</p>
                            <p className="text-3xl font-bold text-blue-800">{enrollments.length}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Enrollments */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle>Enrolled Courses</CardTitle>
                </CardHeader>
                <CardContent>
                    {enrollments.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Not yet enrolled in any course</p>
                            <Button 
                                onClick={handleAddEnrollment}
                                className="mt-4 bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Enroll in First Course
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {enrollments.map(enrollment => (
                                <EnrollmentCard
                                    key={enrollment.id}
                                    enrollment={enrollment}
                                    student={student}
                                    settings={settings}
                                    onEdit={handleEditEnrollment}
                                    onViewReceipt={handleViewReceipt}
                                    onIssueCertificate={handleIssueCertificate}
                                    onDelete={handleDeleteEnrollment}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assignments */}
            <AssignmentSection student={student} enrollments={enrollments} />

            {/* Enrollment Form Dialog */}
            <EnrollmentForm
                open={enrollmentFormOpen}
                onClose={() => { setEnrollmentFormOpen(false); setSelectedEnrollment(null); }}
                student={student}
                enrollment={selectedEnrollment}
                onSuccess={() => { setEnrollmentFormOpen(false); setSelectedEnrollment(null); loadData(); }}
            />

            {/* Receipt */}
            {selectedReceiptEnrollment && (
                <EnrollmentReceiptComponent
                    enrollment={selectedReceiptEnrollment}
                    student={student}
                    settings={settings}
                    open={receiptDialogOpen}
                    onClose={() => {
                        setReceiptDialogOpen(false);
                        setSelectedReceiptEnrollment(null);
                    }}
                />
            )}
        </div>
    );
}