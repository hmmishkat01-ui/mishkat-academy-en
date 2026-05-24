import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Users, 
    BookOpen, 
    Gift, 
    CreditCard, 
    TrendingUp,
    GraduationCap,
    Layers,
    Plus,
    Award,
    DollarSign,
    AlertCircle,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    XCircle,
    Banknote,
    Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Legend,
    AreaChart,
    Area
} from 'recharts';

const MONTHS_BN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCourses: 0,
        activeBatches: 0,
        freeCourses: 0,
        paidCourses: 0,
        freeEnrollments: 0,
        paidEnrollments: 0,
        totalIncome: 0,
        totalDue: 0,
        totalPayable: 0,
        collectionRate: 0,
        freeToPaidCount: 0,
        paidCount: 0,
        partialCount: 0,
        unpaidCount: 0,
        recentStudents: [],
        courseStats: [],
        monthlyIncome: [],
        recentEnrollments: [],
        upcomingClasses: []
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [courses, students, enrollments, batches, allModules] = await Promise.all([
                base44.entities.Course.list(),
                base44.entities.Student.list('-created_date', 50),
                base44.entities.Enrollment.list(),
                base44.entities.Batch.list(),
                base44.entities.CourseModule.filter({ status: 'upcoming' })
            ]);

            const freeCourses = courses.filter(c => c.is_free);
            const paidCourses = courses.filter(c => !c.is_free);
            const activeBatches = batches.filter(b => b.status === 'active').length;

            const freeEnrollments = enrollments.filter(e => e.is_free || e.payment_status === 'free');
            const paidEnrollments = enrollments.filter(e => !e.is_free && e.payment_status !== 'free');

            const totalIncome = enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
            const totalDue = enrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);
            const totalPayable = enrollments.reduce((sum, e) => sum + (e.payable_amount || 0), 0);
            const collectionRate = totalPayable > 0 ? Math.round((totalIncome / totalPayable) * 100) : 0;

            const paidCount = enrollments.filter(e => e.payment_status === 'paid').length;
            const partialCount = enrollments.filter(e => e.payment_status === 'partial').length;
            const unpaidCount = enrollments.filter(e => e.payment_status === 'unpaid').length;

            // Free to Paid conversion
            const studentEnrollmentMap = {};
            enrollments.forEach(e => {
                if (!studentEnrollmentMap[e.student_id]) {
                    studentEnrollmentMap[e.student_id] = { free: false, paid: false };
                }
                if (e.is_free || e.payment_status === 'free') studentEnrollmentMap[e.student_id].free = true;
                else studentEnrollmentMap[e.student_id].paid = true;
            });
            const freeToPaidCount = Object.values(studentEnrollmentMap).filter(s => s.free && s.paid).length;

            // Course stats
            const courseStats = courses.map(course => ({
                name: course.name,
                students: enrollments.filter(e => e.course_id === course.id).length,
                income: enrollments
                    .filter(e => e.course_id === course.id)
                    .reduce((sum, e) => sum + (e.amount_paid || 0), 0),
                due: enrollments
                    .filter(e => e.course_id === course.id)
                    .reduce((sum, e) => sum + (e.due_amount || 0), 0)
            })).sort((a, b) => b.income - a.income).slice(0, 5);

            // Monthly income (last 6 months)
            const now = new Date();
            const monthlyIncome = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnrollments = enrollments.filter(e => {
                    if (!e.payment_date) return false;
                    const pd = new Date(e.payment_date);
                    return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
                });
                monthlyIncome.push({
                    month: MONTHS_BN[d.getMonth()],
                    Income: monthEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0),
                    Enrollments: enrollments.filter(e => {
                        if (!e.enroll_date) return false;
                        const ed = new Date(e.enroll_date);
                        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
                    }).length
                });
            }

            // Upcoming classes with daysLeft
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcomingClasses = allModules
                .filter(m => m.scheduled_date)
                .map(m => {
                    const d = new Date(m.scheduled_date);
                    d.setHours(0, 0, 0, 0);
                    const daysLeft = Math.max(0, Math.round((d - today) / (1000 * 60 * 60 * 24)));
                    return { ...m, daysLeft };
                })
                .filter(m => m.daysLeft <= 14)
                .sort((a, b) => a.daysLeft - b.daysLeft)
                .slice(0, 6);

            // Recent enrollments with student names
            const recentEnrollments = enrollments
                .filter(e => e.enroll_date)
                .sort((a, b) => new Date(b.enroll_date) - new Date(a.enroll_date))
                .slice(0, 6)
                .map(e => {
                    const student = students.find(s => s.id === e.student_id);
                    return { ...e, student_name_full: student?.name || e.student_name };
                });

            setStats({
                totalStudents: students.length,
                totalCourses: courses.length,
                activeBatches,
                freeCourses: freeCourses.length,
                paidCourses: paidCourses.length,
                freeEnrollments: freeEnrollments.length,
                paidEnrollments: paidEnrollments.length,
                totalIncome,
                totalDue,
                totalPayable,
                collectionRate,
                freeToPaidCount,
                paidCount,
                partialCount,
                unpaidCount,
                recentStudents: students.slice(0, 5),
                courseStats,
                monthlyIncome,
                recentEnrollments,
                upcomingClasses
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const paymentPieData = [
        { name: 'Fully Paid', value: stats.paidCount, color: '#10b981' },
        { name: 'Partial', value: stats.partialCount, color: '#f59e0b' },
        { name: 'Due', value: stats.unpaidCount, color: '#ef4444' },
        { name: 'Free', value: stats.freeEnrollments, color: '#3b82f6' },
    ].filter(d => d.value > 0);

    const paymentStatusConfig = {
        paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
        partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700', icon: Clock },
        unpaid: { label: 'Due', color: 'bg-red-100 text-red-700', icon: XCircle },
        free: { label: 'Free', color: 'bg-blue-100 text-blue-700', icon: Gift },
    };

    if (loading) {
        return (
            <div className="space-y-6 p-1">
                <div className="h-28 rounded-2xl bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-72 rounded-xl" />
                    <Skeleton className="h-72 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--primary-color)] to-[#2d5a9e] text-white p-6 md:p-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white translate-x-20 -translate-y-20" />
                    <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-white translate-y-16" />
                </div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-white/70 text-sm mb-1">
                            {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome! 👋</h1>
                        <p className="text-white/80 text-sm md:text-base">
                            Total <span className="font-bold text-[var(--secondary-color)]">{stats.totalStudents}</span> Students •{' '}
                            <span className="font-bold text-[var(--secondary-color)]">{stats.totalCourses}</span> Courses •{' '}
                            <span className="font-bold text-[var(--secondary-color)]">{stats.activeBatches}</span> active batches
                        </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Link to={createPageUrl('Students')}>
                            <Button className="bg-white text-[var(--primary-color)] hover:bg-white/90 font-semibold shadow-lg">
                                <Plus className="h-4 w-4 mr-2" />
                                New Student
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Courses')}>
                            <Button className="bg-[var(--secondary-color)] text-[var(--primary-color)] hover:opacity-90 font-semibold">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Courses
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden relative">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-blue-600 mb-1">Total Students</p>
                                <p className="text-3xl font-bold text-blue-800">{stats.totalStudents}</p>
                                <p className="text-xs text-blue-500 mt-1">{stats.totalCourses} courses</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-purple-600 mb-1">Total Enrollments</p>
                                <p className="text-3xl font-bold text-purple-800">
                                    {stats.freeEnrollments + stats.paidEnrollments}
                                </p>
                                <p className="text-xs text-purple-500 mt-1">
                                    Free: {stats.freeEnrollments} • Paid: {stats.paidEnrollments}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-md">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-emerald-600 mb-1">Total Income</p>
                                <p className="text-3xl font-bold text-emerald-800">
                                    ৳{stats.totalIncome >= 1000 ? (stats.totalIncome / 1000).toFixed(1) + 'K' : stats.totalIncome}
                                </p>
                                <p className="text-xs text-emerald-500 mt-1">{stats.collectionRate}% collected</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100 overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-red-600 mb-1">Total Due</p>
                                <p className="text-3xl font-bold text-red-800">
                                    ৳{stats.totalDue >= 1000 ? (stats.totalDue / 1000).toFixed(1) + 'K' : stats.totalDue}
                                </p>
                                <p className="text-xs text-red-500 mt-1">{stats.unpaidCount + stats.partialCount} pending</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center shadow-md">
                                <AlertCircle className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Overview Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5">
                        <p className="text-sm text-slate-500 mb-1">Total Payable Fee</p>
                        <p className="text-2xl font-bold text-slate-800">৳{stats.totalPayable.toLocaleString('en-US')}</p>
                        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${stats.collectionRate}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{stats.collectionRate}% collected</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-emerald-600 text-white">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-100">Collected</p>
                                <p className="text-2xl font-bold">৳{stats.totalIncome.toLocaleString('en-US')}</p>
                            </div>
                            <Banknote className="h-10 w-10 text-white/40" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-red-600 text-white">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-100">Outstanding</p>
                                <p className="text-2xl font-bold">৳{stats.totalDue.toLocaleString('en-US')}</p>
                            </div>
                            <DollarSign className="h-10 w-10 text-white/40" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Income Chart */}
                <Card className="border-0 shadow-sm lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-5 w-5 text-[var(--primary-color)]" />
                            Monthly Income (Last 6 Months)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.monthlyIncome}>
                                    <defs>
                                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <Tooltip formatter={(value) => [`৳${value.toLocaleString()}`, 'Income']} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="Income" 
                                        stroke="var(--primary-color)" 
                                        strokeWidth={2.5}
                                        fill="url(#incomeGradient)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Status Pie */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-5 w-5 text-[var(--primary-color)]" />
                            Payment Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentPieData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentPieData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {paymentPieData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconSize={10} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400">
                                <p>No Enrollments</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Classes */}
            {stats.upcomingClasses && stats.upcomingClasses.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Calendar className="h-5 w-5 text-[var(--primary-color)]" />
                            Upcoming Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {stats.upcomingClasses.map((cls, i) => (
                                <div key={i} className="relative p-4 rounded-xl border-2 border-[var(--primary-color)]/20 bg-gradient-to-br from-[var(--primary-color)]/5 to-blue-50 overflow-hidden">
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            cls.daysLeft === 0 ? 'bg-red-100 text-red-700' :
                                            cls.daysLeft <= 3 ? 'bg-amber-100 text-amber-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {cls.daysLeft === 0 ? 'Today!' : `${cls.daysLeft} days left`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-9 w-9 rounded-lg bg-[var(--primary-color)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                            {cls.class_number}
                                        </div>
                                        <div className="min-w-0 pr-12">
                                            <p className="font-semibold text-slate-800 text-sm truncate">{cls.title}</p>
                                            <p className="text-xs text-slate-500 truncate">{cls.course_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(cls.scheduled_date).toLocaleDateString('bn-BD')}
                                        </span>
                                        {cls.duration_minutes && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {cls.duration_minutes} Minutes
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Courses */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BookOpen className="h-5 w-5 text-[var(--primary-color)]" />
                                Income by Course
                            </CardTitle>
                            <Link to={createPageUrl('Reports')}>
                                <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-slate-600">
                                    View All <ArrowUpRight className="h-3 w-3 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats.courseStats.length > 0 ? stats.courseStats.map((course, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div className="h-9 w-9 rounded-lg bg-[var(--primary-color)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 text-sm truncate">{course.name}</p>
                                    <p className="text-xs text-slate-500">{course.students}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-semibold text-emerald-600 text-sm">৳{course.income.toLocaleString('en-US')}</p>
                                    {course.due > 0 && (
                                        <p className="text-xs text-red-500">Due ৳{course.due.toLocaleString('en-US')}</p>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-400">
                                <Layers className="h-12 w-12 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No Courses</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Enrollments */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <GraduationCap className="h-5 w-5 text-[var(--primary-color)]" />
                                Recent Enrollments
                            </CardTitle>
                            <Link to={createPageUrl('Students')}>
                                <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-slate-600">
                                    View All <ArrowUpRight className="h-3 w-3 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats.recentEnrollments.length > 0 ? stats.recentEnrollments.map((enrollment, index) => {
                            const statusCfg = paymentStatusConfig[enrollment.payment_status] || paymentStatusConfig.free;
                            const StatusIcon = statusCfg.icon;
                            return (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="h-9 w-9 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {enrollment.student_name_full?.[0] || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 text-sm truncate">
                                            {enrollment.student_name_full}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">{enrollment.course_name}</p>
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                        <Badge className={`${statusCfg.color} text-xs`}>
                                            {statusCfg.label}
                                        </Badge>
                                        {enrollment.enroll_date && (
                                            <p className="text-xs text-slate-400">
                                                {new Date(enrollment.enroll_date).toLocaleDateString('bn-BD')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-8 text-slate-400">
                                <Users className="h-12 w-12 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No Enrollments</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Free to Paid Conversion */}
            {stats.freeToPaidCount > 0 && (
                <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/70 text-sm mb-1">Free → Paid Conversion</p>
                                <p className="text-4xl font-bold">{stats.freeToPaidCount}</p>
                                <p className="text-white/70 text-sm mt-1">students upgraded from free to paid course</p>
                            </div>
                            <div className="bg-white/20 p-5 rounded-2xl">
                                <TrendingUp className="h-10 w-10" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}