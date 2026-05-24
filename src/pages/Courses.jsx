import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import CourseModulesDialog from '../components/course/CourseModulesDialog';
import { 
    Plus, 
    BookOpen, 
    Edit2, 
    Trash2, 
    Users,
    ExternalLink,
    MessageCircle,
    Send,
    Award,
    DollarSign,
    TrendingUp,
    Layers
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        is_free: true,
        price: 0,
        logo_url: '',
        description: '',
        total_classes: 0,
        whatsapp_link: '',
        telegram_link: '',
        messenger_link: '',
        certificate_text: ''
    });
    const [uploading, setUploading] = useState(false);
    const [generatingCertText, setGeneratingCertText] = useState(false);
    const [modulesDialogCourse, setModulesDialogCourse] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesData, enrollmentsData] = await Promise.all([
                base44.entities.Course.list(),
                base44.entities.Enrollment.list()
            ]);
            setCourses(coursesData);
            setEnrollments(enrollmentsData);
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (course = null) => {
        if (course) {
            setSelectedCourse(course);
            setFormData({
                name: course.name || '',
                is_free: course.is_free ?? true,
                price: course.price || 0,
                logo_url: course.logo_url || '',
                description: course.description || '',
                total_classes: course.total_classes || 0,
                whatsapp_link: course.whatsapp_link || '',
                telegram_link: course.telegram_link || '',
                messenger_link: course.messenger_link || '',
                certificate_text: course.certificate_text || ''
            });
        } else {
            setSelectedCourse(null);
            setFormData({
                name: '',
                is_free: true,
                price: 0,
                logo_url: '',
                description: '',
                total_classes: 0,
                whatsapp_link: '',
                telegram_link: '',
                messenger_link: '',
                certificate_text: ''
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
            setFormData({ ...formData, logo_url: file_url });
            toast.success('Logo uploaded successfully');
        } catch (error) {
            toast.error('Logo upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleGenerateCertificateText = async () => {
        if (!formData.name) {
            toast.error('First enter the course name');
            return;
        }

        setGeneratingCertText(true);
        try {
            const prompt = `I want to create a Certificate Text for a course called "${formData.name}".
Please write a professional English Certificate Text to be shown on students' certificates after they complete the course.
Keep it elegant and motivational, within 3-5 lines.`;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: prompt
            });

            setFormData({ ...formData, certificate_text: result });
            toast.success('Certificate text generated! 🎉');
        } catch (error) {
            toast.error('Error generating text');
        } finally {
            setGeneratingCertText(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Enter course name');
            return;
        }

        try {
            if (selectedCourse) {
                await base44.entities.Course.update(selectedCourse.id, formData);
                toast.success('Course updated');
            } else {
                await base44.entities.Course.create(formData);
                toast.success('New course added');
            }
            setDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleDelete = async () => {
        try {
            await base44.entities.Course.delete(selectedCourse.id);
            toast.success('Course deleted');
            setDeleteDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('Error deleting');
        }
    };

    const getCourseInfo = (courseId) => {
        const courseEnrollments = enrollments.filter(e => e.course_id === courseId);
        const studentCount = courseEnrollments.length;
        const totalIncome = courseEnrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
        const totalDue = courseEnrollments.reduce((sum, e) => sum + (e.due_amount || 0), 0);
        return { studentCount, totalIncome, totalDue };
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
                <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
                <Button 
                    onClick={() => handleOpenDialog()}
                    className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Course
                </Button>
            </div>

            {courses.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <BookOpen className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">No Courses</h3>
                        <p className="text-slate-400 mt-1">Click the button above to add a new course</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => {
                        const courseInfo = getCourseInfo(course.id);
                        return (
                            <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                <div className="relative h-32 bg-gradient-to-br from-[var(--primary-color)] to-[#2d4a6f]">
                                    {course.logo_url && (
                                        <img 
                                            src={course.logo_url} 
                                            alt={course.name}
                                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                                        />
                                    )}
                                    <div className="absolute top-3 right-3 flex gap-1">
                                        <Badge className={course.is_free ? 'bg-emerald-500' : 'bg-amber-500'}>
                                            {course.is_free ? 'Free' : `৳${course.price}`}
                                        </Badge>
                                    </div>
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                        {course.logo_url ? (
                                            <img 
                                                src={course.logo_url} 
                                                alt={course.name}
                                                className="h-12 w-12 rounded-lg object-cover bg-white p-1"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                                                <BookOpen className="h-6 w-6 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-lg text-slate-800 mb-1">{course.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{course.description || 'No description'}</p>
                                    
                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                            <div className="flex items-center gap-2 text-sm text-blue-700">
                                                <Users className="h-4 w-4" />
                                                <span>Students</span>
                                            </div>
                                            <span className="font-semibold text-blue-800">{courseInfo.studentCount}</span>
                                        </div>

                                        {courseInfo.totalIncome > 0 && (
                                            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                                                <div className="flex items-center gap-2 text-sm text-emerald-700">
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span>Income</span>
                                                </div>
                                                <span className="font-semibold text-emerald-800">
                                                    ৳{courseInfo.totalIncome.toLocaleString('en-US')}
                                                </span>
                                            </div>
                                        )}

                                        {courseInfo.totalDue > 0 && (
                                            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                                <div className="flex items-center gap-2 text-sm text-red-700">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span>Due</span>
                                                </div>
                                                <span className="font-semibold text-red-800">
                                                    ৳{courseInfo.totalDue.toLocaleString('en-US')}
                                                </span>
                                            </div>
                                        )}

                                        {course.total_classes > 0 && (
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <BookOpen className="h-4 w-4" />
                                                <span>{course.total_classes} classes</span>
                                                {course.certificate_text && (
                                                    <>
                                                        <span>•</span>
                                                        <Award className="h-4 w-4 text-amber-600" />
                                                        <span className="text-amber-600">Certificate</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        {course.whatsapp_link && (
                                            <a href={course.whatsapp_link} target="_blank" rel="noopener noreferrer" 
                                               className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                                                <MessageCircle className="h-4 w-4" />
                                            </a>
                                        )}
                                        {course.telegram_link && (
                                            <a href={course.telegram_link} target="_blank" rel="noopener noreferrer"
                                               className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                                                <Send className="h-4 w-4" />
                                            </a>
                                        )}
                                        {course.messenger_link && (
                                            <a href={course.messenger_link} target="_blank" rel="noopener noreferrer"
                                               className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setModulesDialogCourse(course)}
                                        >
                                            <Layers className="h-4 w-4 mr-1" />
                                            Modules
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleOpenDialog(course)}
                                            onClick={() => {
                                                setSelectedCourse(course);
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCourse ? 'Edit Course' : 'Add New Course'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Course Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Enter course name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Classes</Label>
                                <Input
                                    type="number"
                                    value={formData.total_classes}
                                    onChange={(e) => setFormData({...formData, total_classes: parseInt(e.target.value) || 0})}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <Label>Free Course</Label>
                                <p className="text-sm text-slate-500">Is this course free?</p>
                            </div>
                            <Switch
                                checked={formData.is_free}
                                onCheckedChange={(checked) => setFormData({...formData, is_free: checked, price: checked ? 0 : formData.price})}
                            />
                        </div>

                        {!formData.is_free && (
                            <div className="space-y-2">
                                <Label>Course Fee (BDT)</Label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                                    placeholder="0"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Course Logo</Label>
                            <div className="flex items-center gap-4">
                                {formData.logo_url && (
                                    <img src={formData.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Course Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Enter course description"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>WhatsApp Link</Label>
                                <Input
                                    value={formData.whatsapp_link}
                                    onChange={(e) => setFormData({...formData, whatsapp_link: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telegram Link</Label>
                                <Input
                                    value={formData.telegram_link}
                                    onChange={(e) => setFormData({...formData, telegram_link: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Messenger Link</Label>
                                <Input
                                    value={formData.messenger_link}
                                    onChange={(e) => setFormData({...formData, messenger_link: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-amber-600" />
                                    <Label className="text-base font-semibold text-amber-900">Certificate Text</Label>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateCertificateText}
                                    disabled={!formData.name || generatingCertText}
                                    className="border-amber-400 text-amber-700 hover:bg-amber-100"
                                >
                                    {generatingCertText ? (
                                        <>⏳ Generating...</>
                                    ) : (
                                        <>✨ Generate with AI</>
                                    )}
                                </Button>
                            </div>
                            <p className="text-sm text-amber-700 mb-3">
                                The text shown on students' certificates after completing this course. Write it here or generate with AI.
                            </p>
                            <Textarea
                                value={formData.certificate_text}
                                onChange={(e) => setFormData({...formData, certificate_text: e.target.value})}
                                placeholder="Example: For successfully completing this course andfor participating in all classes. to..."
                                rows={5}
                                className="bg-white border-amber-300 focus:border-amber-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSubmit}
                                className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                            >
                                {selectedCourse ? 'Update' : 'Add'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Course Modules Dialog */}
            {modulesDialogCourse && (
                <CourseModulesDialog
                    course={modulesDialogCourse}
                    open={!!modulesDialogCourse}
                    onClose={() => setModulesDialogCourse(null)}
                />
            )}

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deleting this course will remove all related data. This cannot be be undone.
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