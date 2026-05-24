import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Layers, Trash2, Edit2, Calendar, Clock, Link as LinkIcon, CheckCircle2, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';


const statusColors = {
    upcoming: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
};
const statusLabels = { upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancel' };

export default function CourseModulesDialog({ course, open, onClose }) {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({
        class_number: '', title: '', description: '',
        resource_url: '', scheduled_date: '', duration_minutes: 60, status: 'upcoming'
    });

    useEffect(() => {
        if (open && course?.id) loadModules();
    }, [open, course?.id]);

    const loadModules = async () => {
        setLoading(true);
        const data = await base44.entities.CourseModule.filter({ course_id: course.id });
        setModules(data.sort((a, b) => (a.class_number || 0) - (b.class_number || 0)));
        setLoading(false);
    };

    const openForm = (module = null) => {
        if (module) {
            setSelected(module);
            setForm({
                class_number: module.class_number || '',
                title: module.title || '',
                description: module.description || '',
                resource_url: module.resource_url || '',
                scheduled_date: module.scheduled_date || '',
                duration_minutes: module.duration_minutes || 60,
                status: module.status || 'upcoming'
            });
        } else {
            setSelected(null);
            const nextClass = modules.length > 0 ? Math.max(...modules.map(m => m.class_number || 0)) + 1 : 1;
            setForm({ class_number: nextClass, title: '', description: '', resource_url: '', scheduled_date: '', duration_minutes: 60, status: 'upcoming' });
        }
        setFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.class_number || !form.title) {
            toast.error('Enter class number and title');
            return;
        }
        const data = {
            ...form,
            course_id: course.id,
            course_name: course.name,
            class_number: Number(form.class_number),
            duration_minutes: Number(form.duration_minutes) || 60
        };
        if (selected) {
            await base44.entities.CourseModule.update(selected.id, data);
            toast.success('Module updated');
        } else {
            await base44.entities.CourseModule.create(data);
            toast.success('Module added');
        }
        setFormOpen(false);
        loadModules();
    };

    const handleDelete = async (id) => {
        await base44.entities.CourseModule.delete(id);
        toast.success('Deleted successfully');
        loadModules();
    };

    const completedCount = modules.filter(m => m.status === 'completed').length;

    return (
        <>
            <Dialog open={open} onOpenChange={(val) => { if (!val) { setFormOpen(false); onClose(); } }}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-[var(--primary-color)]" />
                            {course?.name} — Course Modules
                        </DialogTitle>
                    </DialogHeader>

                    {!formOpen ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-blue-100 text-blue-700">Total: {modules.length}</Badge>
                                    <Badge className="bg-emerald-100 text-emerald-700">Completed: {completedCount}</Badge>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => openForm()}
                                    className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Class
                                </Button>
                            </div>

                            {loading ? (
                                <p className="text-center text-slate-400 py-8">Loading...</p>
                            ) : modules.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Layers className="h-12 w-12 mx-auto mb-2 opacity-40" />
                                    <p>No modules yet. Add your first class.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {modules.map((m) => (
                                        <div key={m.id} className="p-4 border rounded-xl bg-white hover:shadow-sm transition-shadow">
                                            <div className="flex items-start gap-3">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.status === 'completed' ? 'bg-emerald-100' : 'bg-[var(--primary-color)]/10'}`}>
                                                    {m.status === 'completed'
                                                        ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                        : <span className="font-bold text-[var(--primary-color)]">{m.class_number}</span>
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-slate-800">classes {m.class_number}: {m.title}</p>
                                                        <Badge className={statusColors[m.status]}>{statusLabels[m.status]}</Badge>
                                                    </div>
                                                    {m.description && (
                                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{m.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                                                        {m.scheduled_date && (
                                                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(m.scheduled_date).toLocaleDateString('bn-BD')}
                                                            </span>
                                                        )}
                                                        {m.duration_minutes && (
                                                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                                                <Clock className="h-3 w-3" />
                                                                {m.duration_minutes} Minutes
                                                            </span>
                                                        )}
                                                        {m.resource_url && (
                                                            <a href={m.resource_url} target="_blank" rel="noopener noreferrer"
                                                               className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                                                <LinkIcon className="h-3 w-3" />
                                                                Resource
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(m)}>
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(m.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Inline Form */
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-800">{selected ? 'Edit Module' : 'New Module'}</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Class Number *</Label>
                                    <Input
                                        type="number"
                                        value={form.class_number}
                                        onChange={e => setForm(f => ({ ...f, class_number: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (Minutes)</Label>
                                    <Input
                                        type="number"
                                        value={form.duration_minutes}
                                        onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Class Topic"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={2}
                                    placeholder="কী কী পড়ানো হবে..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Class Date</Label>
                                    <Input
                                        type="date"
                                        value={form.scheduled_date}
                                        onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="upcoming">Upcoming</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Resource File or Link</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={form.resource_url}
                                        onChange={e => setForm(f => ({ ...f, resource_url: e.target.value }))}
                                        placeholder="Paste Google Drive/Docs/YouTube link"
                                        className="flex-1"
                                    />
                                    <label className={`flex items-center gap-1 px-3 py-2 border rounded-md cursor-pointer text-sm font-medium bg-slate-50 hover:bg-slate-100 transition-colors whitespace-nowrap ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <Upload className="h-4 w-4 text-slate-500" />
                                        {uploadingFile ? 'Uploading...' : 'File'}
                                        <input type="file" className="hidden" disabled={uploadingFile}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploadingFile(true);
                                                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                                setForm(f => ({ ...f, resource_url: file_url }));
                                                setUploadingFile(false);
                                                toast.success('File uploaded');
                                            }}
                                        />
                                    </label>
                                </div>
                                {form.resource_url && (
                                    <a href={form.resource_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                        <FileText className="h-3 w-3" /> View File
                                    </a>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                                <Button onClick={handleSubmit} className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90">
                                    {selected ? 'Update' : 'Add'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}