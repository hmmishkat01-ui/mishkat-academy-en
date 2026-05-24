import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Upload,
    DollarSign,
    TrendingDown,
    Calendar,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [filterMonth, setFilterMonth] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        payment_method: '',
        receipt_image: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const expensesData = await base44.entities.Expense.list('-date');
            setExpenses(expensesData);
        } catch (error) {
            console.error('Error loading expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (expense = null) => {
        if (expense) {
            setSelectedExpense(expense);
            setFormData({
                title: expense.title || '',
                category: expense.category || '',
                amount: expense.amount || 0,
                date: expense.date || new Date().toISOString().split('T')[0],
                description: expense.description || '',
                payment_method: expense.payment_method || '',
                receipt_image: expense.receipt_image || ''
            });
        } else {
            setSelectedExpense(null);
            setFormData({
                title: '',
                category: '',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                description: '',
                payment_method: '',
                receipt_image: ''
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
            setFormData({ ...formData, receipt_image: file_url });
            toast.success('Receipt uploaded successfully');
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.category || !formData.amount) {
            toast.error('Enter required information');
            return;
        }

        try {
            if (selectedExpense) {
                await base44.entities.Expense.update(selectedExpense.id, formData);
                toast.success('Expense updated');
            } else {
                await base44.entities.Expense.create(formData);
                toast.success('Expense added');
            }
            setDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleDelete = async () => {
        try {
            await base44.entities.Expense.delete(selectedExpense.id);
            toast.success('Expense deleted');
            setDeleteDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('Error deleting');
        }
    };

    const categoryColors = {
        course_materials: 'bg-blue-100 text-blue-700',
        marketing: 'bg-purple-100 text-purple-700',
        facility: 'bg-green-100 text-green-700',
        salary: 'bg-orange-100 text-orange-700',
        utility: 'bg-yellow-100 text-yellow-700',
        equipment: 'bg-pink-100 text-pink-700',
        other: 'bg-slate-100 text-slate-700'
    };

    const categoryLabels = {
        course_materials: 'Course Material',
        marketing: 'Marketing',
        facility: 'Benefits',
        salary: 'Salary',
        utility: 'Utility',
        equipment: 'Equipment',
        other: 'Others'
    };

    const paymentMethodLabels = {
        cash: 'Cash',
        bkash: 'bKash',
        nagad: 'Cash',
        rocket: 'Rocket',
        bank: 'Bank'
    };

    const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const filteredExpenses = filterMonth 
        ? expenses.filter(exp => exp.date && exp.date.startsWith(filterMonth))
        : expenses;

    const monthlyTotal = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Expense Management</h1>
                <div className="flex gap-2">
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={null}>All Months</SelectItem>
                            <SelectItem value="2026-01">January 2026</SelectItem>
                            <SelectItem value="2026-02">February 2026</SelectItem>
                            <SelectItem value="2026-03">March 2026</SelectItem>
                            <SelectItem value="2026-04">April 2026</SelectItem>
                            <SelectItem value="2026-05">May 2026</SelectItem>
                            <SelectItem value="2026-06">June 2026</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button 
                        onClick={() => handleOpenDialog()}
                        className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-700 mb-1">Total Expenses</p>
                                <p className="text-3xl font-bold text-red-800">৳{totalExpense.toFixed(2)}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center">
                                <TrendingDown className="h-6 w-6 text-red-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {filterMonth && (
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-700 mb-1">Monthly Expenses</p>
                                    <p className="text-3xl font-bold text-orange-800">৳{monthlyTotal.toFixed(2)}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-orange-200 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-orange-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-700 mb-1">Total Entries</p>
                                <p className="text-3xl font-bold text-purple-800">{filteredExpenses.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-purple-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expenses List */}
            {filteredExpenses.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <TrendingDown className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">No Expenses</h3>
                        <p className="text-slate-400 mt-1">Click the button above to add an expense</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredExpenses.map((expense) => (
                        <Card key={expense.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-lg text-slate-800">{expense.title}</h3>
                                            <Badge className={categoryColors[expense.category]}>
                                                {categoryLabels[expense.category]}
                                            </Badge>
                                        </div>
                                        
                                        {expense.description && (
                                            <p className="text-sm text-slate-600 mb-3">{expense.description}</p>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(expense.date).toLocaleDateString('bn-BD')}</span>
                                            </div>
                                            {expense.payment_method && (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span>{paymentMethodLabels[expense.payment_method]}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 ml-4">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-red-600">৳{expense.amount.toFixed(2)}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenDialog(expense)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                setSelectedExpense(expense);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {expense.receipt_image && (
                                    <div className="mt-4 pt-4 border-t">
                                        <img 
                                            src={expense.receipt_image} 
                                            alt="Receipt" 
                                            className="max-h-48 rounded-lg border cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => window.open(expense.receipt_image, '_blank')}
                                        />
                                    </div>
                                )}
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
                            {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Expense Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g. Office rent"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="course_materials">Course Material</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="facility">Benefits</SelectItem>
                                        <SelectItem value="salary">Salary</SelectItem>
                                        <SelectItem value="utility">Utility</SelectItem>
                                        <SelectItem value="equipment">Equipment</SelectItem>
                                        <SelectItem value="other">Others</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount (৳) *</Label>
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bkash">bKash</SelectItem>
                                    <SelectItem value="nagad">Cash</SelectItem>
                                    <SelectItem value="rocket">Rocket</SelectItem>
                                    <SelectItem value="bank">Bank</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Enter details"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Upload Receipt/Screenshot</Label>
                            <div className="flex items-center gap-4">
                                {formData.receipt_image && (
                                    <img src={formData.receipt_image} alt="Receipt" className="h-16 w-16 rounded object-cover" />
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
                                {selectedExpense ? 'Update' : 'Add'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This expense data will be deleted.
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