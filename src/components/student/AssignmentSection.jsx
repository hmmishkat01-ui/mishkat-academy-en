import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Award, BookOpen, Trash2, Edit2, CheckCircle2, Clock, XCircle, AlertCircle, ImageIcon, X, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const statusConfig = {
    submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    graded: { label: 'Evaluated', color: 'bg-emerald-100 text-emerald-700', icon: Award },
    late: { label: 'Late', color: 'bg-amber-100 text-amber-700', icon: Clock },
    missing: { label: 'Not Submitted', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AssignmentSection({ student, enrollments }) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [form, setForm] = useState({
        enrollment_id: '',
        course_id: '',
        course_name: '',
        batch_id: '',
        class_number: '',
        title: '',
        score: '',
        max_score: 10,
        submitted_date: new Date().toISOString().split('T')[0],
        notes: '',
        image_urls: [],
        status: 'submitted'
    });

    useEffect(() => {
        if (student?.id) loadAssignments();
    }, [student?.id]);

    const loadAssignments = async () => {
        setLoading(true);
        const data = await base44.entities.Assignment.filter({ student_id: student.id });
        setAssignments(data.sort((a, b) => (a.class_number || 0) - (b.class_number || 0)));
        setLoading(false);
    };

    const handleOpen = (assignment = null) => {
        if (assignment) {
            setSelected(assignment);
            setForm({
                enrollment_id: assignment.enrollment_id || '',
                course_id: assignment.course_id || '',
                course_name: assignment.course_name || '',
                batch_id: assignment.batch_id || '',
                class_number: assignment.class_number || '',
                title: assignment.title || '',
                score: assignment.score ?? '',
                max_score: assignment.max_score || 10,
                submitted_date: assignment.submitted_date || new Date().toISOString().split('T')[0],
                notes: assignment.notes || '',
                image_urls: assignment.image_urls || [],
                status: assignment.status || 'submitted'
            });
        } else {
            setSelected(null);
            setForm({
                enrollment_id: '', course_id: '', course_name: '', batch_id: '',
                class_number: '', title: '', score: '', max_score: 10,
                submitted_date: new Date().toISOString().split('T')[0],
                notes: '', image_urls: [], status: 'submitted'
            });
        }
        setDialogOpen(true);
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploadingImages(true);
        const uploadedUrls = [];
        for (const file of files) {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            uploadedUrls.push(file_url);
        }
        setForm(f => ({ ...f, image_urls: [...(f.image_urls || []), ...uploadedUrls] }));
        setUploadingImages(false);
        toast.success(`${uploadedUrls.length} images uploaded`);
    };

    const removeImage = (idx) => {
        setForm(f => ({ ...f, image_urls: f.image_urls.filter((_, i) => i !== idx) }));
    };

    const handleEnrollmentChange = (enrollmentId) => {
        const enrollment = enrollments.find(e => e.id === enrollmentId);
        setForm(f => ({
            ...f,
            enrollment_id: enrollmentId,
            course_id: enrollment?.course_id || '',
            course_name: enrollment?.course_name || '',
            batch_id: enrollment?.batch_id || ''
        }));
    };

    const handleSubmit = async () => {
        if (!form.enrollment_id || !form.class_number || !form.title) {
            toast.error('Enter course, class number and title');
            return;
        }
        const data = {
            ...form,
            student_id: student.id,
            student_name: student.name,
            class_number: Number(form.class_number),
            score: form.score !== '' ? Number(form.score) : 0,
            max_score: Number(form.max_score) || 10
        };
        if (selected) {
            await base44.entities.Assignment.update(selected.id, data);
            toast.success('Assignment updated');
        } else {
            await base44.entities.Assignment.create(data);
            toast.success('Assignment added');
        }
        setDialogOpen(false);
        loadAssignments();
    };

    const handleDelete = async (id) => {
        await base44.entities.Assignment.delete(id);
        toast.success('Deleted successfully');
        loadAssignments();
    };

    // Summary stats
    const totalSubmitted = assignments.filter(a => a.status !== 'missing').length;
    const totalScore = assignments.reduce((sum, a) => sum + (a.score || 0), 0);
    const maxPossible = assignments.filter(a => a.status !== 'missing').length * 10;
    const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

    // Group by course
    const byCourse = {};
    assignments.forEach(a => {
        const key = a.course_name || a.course_id;
        if (!byCourse[key]) byCourse[key] = [];
        byCourse[key].push(a);
    });

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[var(--primary-color)]" />
                        Assignment Tracker
                    </CardTitle>
                    <Button
                        onClick={() => handleOpen()}
                        className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary */}
                {assignments.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[var(--primary-color)]">{totalSubmitted}</p>
                            <p className="text-xs text-slate-500">Submitted</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-600">{totalScore}</p>
                            <p className="text-xs text-slate-500">Total Marks</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{percentage}%</p>
                            <p className="text-xs text-slate-500">Average Score</p>
                        </div>
                    </div>
                )}

                {/* Assignments by course */}
                {loading ? (
                    <p className="text-slate-400 text-sm text-center py-4">Loading...</p>
                ) : assignments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No Assignments</p>
                    </div>
                ) : (
                    Object.entries(byCourse).map(([courseName, courseAssignments]) => (
                        <div key={courseName}>
                            <p className="text-sm font-semibold text-slate-600 mb-2">{courseName}</p>
                            <div className="space-y-2">
                                {courseAssignments.map(a => {
                                    const cfg = statusConfig[a.status] || statusConfig.submitted;
                                    const Icon = cfg.icon;
                                    const scorePercent = a.status !== 'missing' ? Math.round((a.score / (a.max_score || 10)) * 100) : 0;
                                    return (
                                        <div key={a.id} className="p-3 border rounded-xl bg-white hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-[var(--primary-color)]">{a.class_number}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-800 text-sm truncate">{a.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge className={`${cfg.color} text-xs`}>
                                                            <Icon className="h-3 w-3 mr-1" />
                                                            {cfg.label}
                                                        </Badge>
                                                        {a.submitted_date && (
                                                            <span className="text-xs text-slate-400">
                                                                {new Date(a.submitted_date).toLocaleDateString('bn-BD')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {a.status !== 'missing' && (
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg text-[var(--primary-color)]">
                                                                {a.score}<span className="text-xs text-slate-400">/{a.max_score || 10}</span>
                                                            </p>
                                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${scorePercent}%` }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpen(a)}>
                                                            <Edit2 className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(a.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            {a.image_urls?.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {a.image_urls.map((url, i) => (
                                                        <img key={i} src={url} alt={`Image ${i+1}`} className="h-16 w-16 rounded-lg object-cover border cursor-pointer hover:opacity-90"
                                                             onClick={() => window.open(url, '_blank')} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })}
                                    </div>
                                </div>
                            ))
                        )}
            </CardContent>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selected ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label>Select Course *</Label>
                            <Select value={form.enrollment_id} onValueChange={handleEnrollmentChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Courses Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {enrollments.map(e => (
                                        <SelectItem key={e.id} value={e.id}>{e.course_name} – {e.batch_number}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Class Number *</Label>
                                <Input
                                    type="number"
                                    value={form.class_number}
                                    onChange={e => setForm(f => ({ ...f, class_number: e.target.value }))}
                                    placeholder="e.g. 3"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="submitted">Submitted</SelectItem>
                                        <SelectItem value="graded">Evaluated</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                        <SelectItem value="missing">Not Submitted</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Assignment Title *</Label>
                            <Input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Assignment Name"
                            />
                        </div>

                        {form.status !== 'missing' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Obtained Marks</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={form.max_score}
                                        value={form.score}
                                        onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Maximum Marks</Label>
                                    <Input
                                        type="number"
                                        value={form.max_score}
                                        onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))}
                                        placeholder="10"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Submission Date</Label>
                            <Input
                                type="date"
                                value={form.submitted_date}
                                onChange={e => setForm(f => ({ ...f, submitted_date: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Comments</Label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                placeholder="Teacher Comments..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Upload Assignment Images
                            </Label>
                            <label className={`flex items-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition-colors ${uploadingImages ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-slate-500">
                                    {uploadingImages ? 'Uploading...' : 'Choose PNG, JPG images'}
                                </span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImages} />
                            </label>
                            {form.image_urls?.length > 0 && (
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {form.image_urls.map((url, i) => (
                                        <div key={i} className="relative">
                                            <img src={url} alt={`Image ${i+1}`} className="h-16 w-16 rounded-lg object-cover border" />
                                            <button onClick={() => removeImage(i)}
                                                className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90">
                                {selected ? 'Update' : 'Add'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}