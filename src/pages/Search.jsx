import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Search as SearchIcon, 
    Users, 
    Phone,
    Mail,
    IdCard,
    Award,
    Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function Search() {
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [searchQuery, students]);

    const loadStudents = async () => {
        try {
            const data = await base44.entities.Student.list();
            setStudents(data);
            setFilteredStudents(data);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        if (!searchQuery.trim()) {
            setFilteredStudents(students);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = students.filter(student => 
            student.name?.toLowerCase().includes(query) ||
            student.phone?.includes(query) ||
            student.roll_number?.includes(query) ||
            student.batch_number?.toLowerCase().includes(query) ||
            student.course_name?.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query)
        );
        setFilteredStudents(filtered);
    };

    const paymentStatusColors = {
        paid: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        free: 'bg-blue-100 text-blue-700'
    };

    const paymentStatusLabels = {
        paid: 'Paid',
        pending: 'Pending',
        free: 'Free'
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-full rounded-xl" />
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
            <h1 className="text-2xl font-bold text-slate-800">Student Search</h1>

            {/* Search Box */}
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, phone, roll number, batch or course..."
                    className="pl-12 h-14 text-lg rounded-xl border-slate-200 focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                />
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-slate-500">
                    {searchQuery.trim() 
                        ? `${filteredStudents.length} students found`
                        : `Total ${students.length} Students`
                    }
                </p>
            </div>

            {/* Results */}
            {filteredStudents.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <SearchIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">No Students Found</h3>
                        <p className="text-slate-400 mt-1">Try searching with something else</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => (
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
                                        <Badge className={paymentStatusColors[student.payment_status]}>
                                            {paymentStatusLabels[student.payment_status]}
                                        </Badge>
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
                                    <p className="text-slate-500">
                                        {student.course_name} • {student.batch_number}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Link to={createPageUrl(`StudentProfile?id=${student.id}`)} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Eye className="h-4 w-4 mr-1" />
                                            Profile
                                        </Button>
                                    </Link>
                                    <Link to={createPageUrl(`StudentProfile?id=${student.id}`)}>
                                        <Button variant="outline" size="sm">
                                            <IdCard className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link to={createPageUrl(`StudentProfile?id=${student.id}`)}>
                                        <Button variant="outline" size="sm">
                                            <Award className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}