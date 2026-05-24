import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Plus, 
    Users, 
    Edit2, 
    Trash2, 
    Eye,
    IdCard,
    Award,
    Phone,
    Mail
} from 'lucide-react';
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

export default function Students() {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [filteredBatches, setFilteredBatches] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        occupation: '',
        photo_url: ''
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [studentsData, coursesData, batchesData] = await Promise.all([
                base44.entities.Student.list(),
                base44.entities.Course.list(),
                base44.entities.Batch.list()
            ]);
            setStudents(studentsData);
            setCourses(coursesData);
            setBatches(batchesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateRollNumber = async () => {
        const existingRolls = students.map(s => parseInt(s.roll_number) || 0);
        let newRoll = 1;
        while (existingRolls.includes(newRoll)) {
            newRoll++;
        }
        return newRoll.toString().padStart(4, '0');
    };

    const handleOpenDialog = (student = null) => {
        if (student) {
            setSelectedStudent(student);
            setFormData({
                name: student.name || '',
                phone: student.phone || '',
                email: student.email || '',
                occupation: student.occupation || '',
                photo_url: student.photo_url || ''
            });
        } else {
            setSelectedStudent(null);
            setFormData({
                name: '',
                phone: '',
                email: '',
                occupation: '',
                photo_url: ''
            });
        }
        setDialogOpen(true);
    };



    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, photo_url: file_url });
            toast.success('Photo uploaded successfully');
        } catch (error) {
            toast.error('Photo upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Enter student name');
            return;
        }
        if (!formData.phone.trim()) {
            toast.error('Enter phone number');
            return;
        }
        try {
            const studentData = { ...formData };

            if (selectedStudent) {
                await base44.entities.Student.update(selectedStudent.id, studentData);
                toast.success('Student updated');
            } else {
                const rollNumber = await generateRollNumber();
                await base44.entities.Student.create({
                    ...studentData,
                    roll_number: rollNumber
                });
                toast.success('New student added');
            }
            setDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleDelete = async () => {
        try {
            await base44.entities.Student.delete(selectedStudent.id);
            toast.success('Student deleted');
            setDeleteDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('Error deleting');
        }
    };

    const paymentStatusColors = {
        paid: 'bg-emerald-100 text-emerald-700',
        partial: 'bg-amber-100 text-amber-700',
        unpaid: 'bg-red-100 text-red-700',
        free: 'bg-blue-100 text-blue-700'
    };

    const paymentStatusLabels = {
        paid: 'Paid',
        partial: 'Partial',
        unpaid: 'Due',
        free: 'Free'
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
                        <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Students</h1>
                <Button 
                    onClick={() => handleOpenDialog()}
                    className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Student
                </Button>
            </div>

            {students.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <Users className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">No Students</h3>
                        <p className="text-slate-400 mt-1">Click the button above to add a new student</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                        <Card key={student.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    {student.photo_url ? (
                                        <img 
                                            src={student.photo_url} 
                                            alt={student.name}
                                            className="h-16 w-16 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 rounded-xl bg-[var(--primary-color)] flex items-center justify-center text-white text-xl font-bold">
                                            {student.name?.[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg text-slate-800 truncate">{student.name}</h3>
                                        <p className="text-sm text-slate-500">Roll: {student.roll_number}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span>{student.phone}</span>
                                    </div>
                                    {student.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                            <span className="truncate">{student.email}</span>
                                        </div>
                                    )}

                                </div>

                                <div className="flex gap-2">
                                    <Link 
                                        to={createPageUrl(`StudentProfile?id=${student.id}`)}
                                        className="flex-1"
                                    >
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Eye className="h-4 w-4 mr-1" />
                                            Profile
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenDialog(student)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedStudent ? 'Edit Student' : 'Add New Student'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Student Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number *</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="01XXXXXXXXX"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Profession / Occupation</Label>
                                <Input
                                    value={formData.occupation}
                                    onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                                    placeholder="e.g. Student, Employee"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Student's Photo</Label>
                            <div className="flex items-center gap-4">
                                {formData.photo_url && (
                                    <img src={formData.photo_url} alt="Photo" className="h-16 w-16 rounded-xl object-cover" />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </div>
                        </div>



                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSubmit}
                                className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                            >
                                {selectedStudent ? 'Update' : 'Add'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                        <AlertDialogDescription>
                            All this student's data will be deleted.
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