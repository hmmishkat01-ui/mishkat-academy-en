import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Layers, Edit2, Trash2, Users, Calendar, Eye, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Batches() {
    const [batches, setBatches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [formData, setFormData] = useState({
        batch_number: '',
        course_id: '',
        course_name: '',
        start_date: '',
        status: 'active'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [batchesData, coursesData, enrollmentsData] = await Promise.all([
                base44.entities.Batch.list(),
                base44.entities.Course.list(),
                base44.entities.Enrollment.list()
            ]);
            setBatches(batchesData);
            setCourses(coursesData);
            setEnrollments(enrollmentsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (batch = null) => {
        if (batch) {
            setSelectedBatch(batch);
            setFormData({
                batch_number: batch.batch_number || '',
                course_id: batch.course_id || '',
                course_name: batch.course_name || '',
                start_date: batch.start_date || '',
                status: batch.status || 'active'
            });
        } else {
            setSelectedBatch(null);
            setFormData({
                batch_number: '',
                course_id: '',
                course_name: '',
                start_date: '',
                status: 'active'
            });
        }
        setDialogOpen(true);
    };

    const handleCourseChange = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        setFormData({
            ...formData,
            course_id: courseId,
            course_name: course?.name || ''
        });
    };

    const handleSubmit = async () => {
        if (!formData.batch_number.trim()) {
            toast.error('Enter batch number');
            return;
        }
        if (!formData.course_id) {
            toast.error('Select Course');
            return;
        }

        try {
            if (selectedBatch) {
                await base44.entities.Batch.update(selectedBatch.id, formData);
                toast.success('Batch updated');
            } else {
                await base44.entities.Batch.create(formData);
                toast.success('New batch added');
            }
            setDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleDelete = async () => {
        try {
            await base44.entities.Batch.delete(selectedBatch.id);
            toast.success('Batch deleted');
            setDeleteDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('Error deleting');
        }
    };

    const getBatchInfo = (batchId) => {
        const batchEnrollments = enrollments.filter(e => e.batch_id === batchId);
        const studentCount = batchEnrollments.length;
        const totalIncome = batchEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
        const totalDue = batchEnrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);
        return { studentCount, totalIncome, totalDue };
    };

    const statusColors = {
        active: 'bg-emerald-100 text-emerald-700',
        completed: 'bg-blue-100 text-blue-700',
        upcoming: 'bg-amber-100 text-amber-700'
    };

    const statusLabels = {
        active: 'Active',
        completed: 'Completed',
        upcoming: 'Upcoming'
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Batch Management</h1>
                    <p className="text-sm text-slate-500 mt-1">View and manage all batches across courses</p>
                </div>
                <Button 
                    onClick={() => handleOpenDialog()}
                    className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Batch
                </Button>
            </div>

            {batches.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <Layers className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">No Batches</h3>
                        <p className="text-slate-400 mt-1">Click the button above to add a new batch</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batches.map((batch) => {
                        const batchInfo = getBatchInfo(batch.id);
                        return (
                            <Card key={batch.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-[var(--primary-color)] flex items-center justify-center">
                                                <Layers className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg text-slate-800">{batch.batch_number}</h3>
                                                <p className="text-sm text-slate-500">{batch.course_name}</p>
                                            </div>
                                        </div>
                                        <Badge className={statusColors[batch.status]}>
                                            {statusLabels[batch.status]}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <Link to={createPageUrl(`BatchStudents?id=${batch.id}`)}>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                                                    <Users className="h-4 w-4" />
                                                    <span>{batchInfo.studentCount} Students</span>
                                                </div>
                                                <Eye className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </Link>

                                        {batchInfo.totalIncome > 0 && (
                                            <div className="flex items-center justify-between p-2 rounded-lg text-sm">
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span>Income:</span>
                                                </div>
                                                <span className="font-semibold text-emerald-700">
                                                    ৳{batchInfo.totalIncome.toLocaleString('en-US')}
                                                </span>
                                            </div>
                                        )}

                                        {batchInfo.totalDue > 0 && (
                                            <div className="flex items-center justify-between p-2 rounded-lg text-sm">
                                                <div className="flex items-center gap-2 text-red-600">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span>Due:</span>
                                                </div>
                                                <span className="font-semibold text-red-700">
                                                    ৳{batchInfo.totalDue.toLocaleString('en-US')}
                                                </span>
                                            </div>
                                        )}

                                        {batch.start_date && (
                                            <div className="flex items-center gap-2 text-sm text-slate-500 pt-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>Start: {new Date(batch.start_date).toLocaleDateString('bn-BD')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleOpenDialog(batch)}
                                        >
                                            <Edit2 className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                setSelectedBatch(batch);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedBatch ? 'Edit Batch' : 'Add New Batch'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Batch Number *</Label>
                            <Input
                                value={formData.batch_number}
                                onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                                placeholder="e.g. Batch 1"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Select Course *</Label>
                            <Select value={formData.course_id} onValueChange={handleCourseChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSubmit}
                                className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                            >
                                {selectedBatch ? 'Update' : 'Add'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deleting this batch will remove all related data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}