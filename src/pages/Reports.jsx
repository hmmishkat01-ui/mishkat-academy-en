import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
    FileText, 
    Users, 
    BookOpen, 
    TrendingUp,
    Gift,
    CreditCard,
    Download,
    Layers,
    DollarSign,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

export default function Reports() {
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesData, batchesData, enrollmentsData] = await Promise.all([
                base44.entities.Course.list(),
                base44.entities.Batch.list(),
                base44.entities.Enrollment.list()
            ]);
            setCourses(coursesData);
            setBatches(batchesData);
            setEnrollments(enrollmentsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // By Course Reports
    const getCourseStats = () => {
        return courses.map(course => {
            const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
            const totalStudents = courseEnrollments.length;
            const totalIncome = courseEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
            const totalDue = courseEnrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);
            const totalPayable = courseEnrollments.reduce((sum, e) => sum + (e.payable_amount || 0), 0);
            
            const paidCount = courseEnrollments.filter(e => e.payment_status === 'paid').length;
            const partialCount = courseEnrollments.filter(e => e.payment_status === 'partial').length;
            const unpaidCount = courseEnrollments.filter(e => e.payment_status === 'unpaid').length;
            const freeCount = courseEnrollments.filter(e => e.payment_status === 'free' || e.is_free).length;

            return {
                course_id: course.id,
                name: course.name,
                is_free: course.is_free,
                course_fee: course.price || 0,
                students: totalStudents,
                totalPayable,
                totalIncome,
                totalDue,
                paidCount,
                partialCount,
                unpaidCount,
                freeCount
            };
        }).sort((a, b) => b.totalIncome - a.totalIncome);
    };

    // By Batch Reports
    const getBatchStats = () => {
        return batches.map(batch => {
            const batchEnrollments = enrollments.filter(e => e.batch_id === batch.id);
            const totalStudents = batchEnrollments.length;
            const totalIncome = batchEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
            const totalDue = batchEnrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);
            const totalPayable = batchEnrollments.reduce((sum, e) => sum + (e.payable_amount || 0), 0);

            return {
                batch_id: batch.id,
                batch_number: batch.batch_number,
                course_name: batch.course_name,
                students: totalStudents,
                totalPayable,
                totalIncome,
                totalDue,
                status: batch.status
            };
        }).sort((a, b) => b.totalIncome - a.totalIncome);
    };

    // Payment Status Reports
    const getPaymentStats = () => {
        const paid = enrollments.filter(e => e.payment_status === 'paid').length;
        const partial = enrollments.filter(e => e.payment_status === 'partial').length;
        const unpaid = enrollments.filter(e => e.payment_status === 'unpaid').length;
        const free = enrollments.filter(e => e.payment_status === 'free' || e.is_free).length;
        
        return [
            { name: 'Fully Paid', value: paid, color: '#10b981' },
            { name: 'Partial Paid', value: partial, color: '#f59e0b' },
            { name: 'Outstanding', value: unpaid, color: '#ef4444' },
            { name: 'Free', value: free, color: '#3b82f6' }
        ];
    };

    // Income and Due Information
    const getFinancialSummary = () => {
        const totalPayable = enrollments.reduce((sum, e) => sum + (e.payable_amount || 0), 0);
        const totalIncome = enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
        const totalDue = enrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);
        const collectionRate = totalPayable > 0 ? ((totalIncome / totalPayable) * 100).toFixed(1) : 0;

        return { totalPayable, totalIncome, totalDue, collectionRate };
    };


    // ===== EXCEL DOWNLOAD FUNCTIONS =====

    const downloadEnrollmentsExcel = async () => {
        setDownloading('enrollments');
        try {
            const data = enrollments.map(e => {
                const student = students.find(s => s.id === e.student_id);
                return {
                    'Student Name': e.student_name || student?.name || '',
                    'Roll Number': e.student_roll || student?.roll_number || '',
                    'Phone': student?.phone || '',
                    'Email': student?.email || '',
                    'Courses': e.course_name || '',
                    'Batch': e.batch_number || '',
                    'Enrollment Date': e.enroll_date || '',
                    'Course Fee': e.course_price || 0,
                    'Discount': e.discount_amount || 0,
                    'Payable': e.payable_amount || 0,
                    'Paid': e.amount_paid || 0,
                    'Due': e.due_amount || 0,
                    'Payment Status': { paid: 'Paid', partial: 'Partial', unpaid: 'Due', free: 'Free' }[e.payment_status] || '',
                    'Payment Method': e.payment_method || '',
                    'Transaction ID': e.transaction_id || '',
                    'Status': { active: 'Active', completed: 'Completed', dropped: 'Remove' }[e.status] || '',
                    'Certificate': e.certificate_issued ? 'Yes' : 'No',
                };
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Enrollment');
            ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));
            XLSX.writeFile(wb, `Enrollment_Reports_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
        } finally { setDownloading(''); }
    };

    const downloadDuePaymentsExcel = async () => {
        setDownloading('due');
        try {
            const dueEnrollments = enrollments.filter(e => e.due_amount > 0);
            const data = dueEnrollments.map(e => {
                const student = students.find(s => s.id === e.student_id);
                return {
                    'Student Name': e.student_name || student?.name || '',
                    'Roll Number': e.student_roll || student?.roll_number || '',
                    'Phone': student?.phone || '',
                    'Courses': e.course_name || '',
                    'Batch': e.batch_number || '',
                    'Payable': e.payable_amount || 0,
                    'Paid': e.amount_paid || 0,
                    'Due Amount': e.due_amount || 0,
                    'Payment Status': { paid: 'Paid', partial: 'Partial', unpaid: 'Due', free: 'Free' }[e.payment_status] || '',
                };
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Due Payment');
            ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));
            XLSX.writeFile(wb, `Due_Payment_Reports_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
        } finally { setDownloading(''); }
    };

    const downloadCourseReportExcel = async () => {
        setDownloading('course');
        try {
            const data = getCourseStats().map(c => ({
                'Course Name': c.name,
                'Type': c.is_free ? 'Free' : 'Paid',
                'Course Fee': c.course_fee,
                'Total Students': c.students,
                'Total Payable': c.totalPayable,
                'Total Income': c.totalIncome,
                'Total Due': c.totalDue,
                'Paid': c.paidCount,
                'Partial': c.partialCount,
                'Due': c.unpaidCount,
                'Free': c.freeCount,
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Courses Reports');
            ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 16 }));
            XLSX.writeFile(wb, `Courses_Reports_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
        } finally { setDownloading(''); }
    };

    const downloadBatchReportExcel = async () => {
        setDownloading('batch');
        try {
            const data = getBatchStats().map(b => ({
                'Batch Number': b.batch_number,
                'Courses': b.course_name,
                'Status': { active: 'Active', completed: 'Completed', upcoming: 'Upcoming' }[b.status] || b.status,
                'Total Students': b.students,
                'Total Payable': b.totalPayable,
                'Total Income': b.totalIncome,
                'Total Due': b.totalDue,
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Batch Reports');
            ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 16 }));
            XLSX.writeFile(wb, `Batch_Reports_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
        } finally { setDownloading(''); }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    const courseStats = getCourseStats();
    const batchStats = getBatchStats();
    const paymentStats = getPaymentStats();
    const financialSummary = getFinancialSummary();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Reports & Accounts</h1>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-100">Total Students</p>
                                <p className="text-3xl font-bold">{enrollments.length}</p>
                                <p className="text-xs text-blue-100 mt-1">Enrollment</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-100">Total Fee</p>
                                <p className="text-3xl font-bold">৳{financialSummary.totalPayable.toLocaleString('en-US')}</p>
                                <p className="text-xs text-purple-100 mt-1">Payable</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <DollarSign className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-100">Total Income</p>
                                <p className="text-3xl font-bold">৳{financialSummary.totalIncome.toLocaleString('en-US')}</p>
                                <p className="text-xs text-emerald-100 mt-1">{financialSummary.collectionRate}% collected</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-red-500 to-red-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-100">Total Due</p>
                                <p className="text-3xl font-bold">৳{financialSummary.totalDue.toLocaleString('en-US')}</p>
                                <p className="text-xs text-red-100 mt-1">Incomplete Payment</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="courses">By Course</TabsTrigger>
                    <TabsTrigger value="batches">By Batch</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                </TabsList>

                {/* By Course Reports */}
                <TabsContent value="courses" className="mt-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-[var(--primary-color)]" />
                                Detailed Reports by Course
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[250px]">Courses</TableHead>
                                            <TableHead className="text-center">Students</TableHead>
                                            <TableHead className="text-right">Course Fee</TableHead>
                                            <TableHead className="text-right">Total Income</TableHead>
                                            <TableHead className="text-right">Due</TableHead>
                                            <TableHead className="text-center">Payment Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {courseStats.map((course, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {course.name}
                                                        {course.is_free && (
                                                            <Badge className="bg-blue-100 text-blue-700 text-xs">Free</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="font-semibold">
                                                        {course.students}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-purple-600">
                                                    ৳{course.course_fee.toLocaleString('en-US')}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-emerald-600">
                                                    ৳{course.totalIncome.toLocaleString('en-US')}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-red-600">
                                                    ৳{course.totalDue.toLocaleString('en-US')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        {course.paidCount > 0 && (
                                                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                                                Paid: {course.paidCount}
                                                            </Badge>
                                                        )}
                                                        {course.partialCount > 0 && (
                                                            <Badge className="bg-amber-100 text-amber-700 text-xs">
                                                                Partial: {course.partialCount}
                                                            </Badge>
                                                        )}
                                                        {course.unpaidCount > 0 && (
                                                            <Badge className="bg-red-100 text-red-700 text-xs">
                                                                Due: {course.unpaidCount}
                                                            </Badge>
                                                        )}
                                                        {course.freeCount > 0 && (
                                                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                                Free: {course.freeCount}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Chart */}
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Income by Course</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={courseStats}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" fontSize={12} />
                                            <YAxis fontSize={12} />
                                            <Tooltip 
                                                formatter={(value) => [`৳${value.toLocaleString('en-US')}`, 'Income']}
                                            />
                                            <Bar dataKey="totalIncome" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* By Batch Reports */}
                <TabsContent value="batches" className="mt-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-[var(--primary-color)]" />
                                Detailed Reports by Batch
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Batch</TableHead>
                                            <TableHead>Courses</TableHead>
                                            <TableHead className="text-center">Students</TableHead>
                                            <TableHead className="text-right">Total Fee</TableHead>
                                            <TableHead className="text-right">Income</TableHead>
                                            <TableHead className="text-right">Due</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batchStats.map((batch, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{batch.batch_number}</TableCell>
                                                <TableCell>{batch.course_name}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="font-semibold">
                                                        {batch.students}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-purple-600">
                                                    ৳{batch.totalPayable.toLocaleString('en-US')}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-emerald-600">
                                                    ৳{batch.totalIncome.toLocaleString('en-US')}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-red-600">
                                                    ৳{batch.totalDue.toLocaleString('en-US')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={
                                                        batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                        batch.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }>
                                                        {batch.status === 'active' ? 'Active' : 
                                                         batch.status === 'completed' ? 'Completed' : 'Upcoming'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payment Status */}
                <TabsContent value="payment" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle>Payment Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={paymentStats}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {paymentStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle>Payment Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {paymentStats.map((stat, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-xl"
                                        style={{ backgroundColor: `${stat.color}15` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: stat.color }}
                                            />
                                            <span className="font-medium">{stat.name}</span>
                                        </div>
                                        <span className="text-2xl font-bold" style={{ color: stat.color }}>
                                            {stat.value}
                                        </span>
                                    </div>
                                ))}

                                <div className="pt-4 mt-4 border-t space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">Total Enrollments</span>
                                        <span className="text-2xl font-bold text-slate-800">
                                            {enrollments.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">Collection Rate</span>
                                        <span className="text-2xl font-bold text-purple-600">
                                            {financialSummary.collectionRate}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}