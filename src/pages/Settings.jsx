import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
    Settings as SettingsIcon,
    Save,
    Upload,
    Building2,
    Palette,
    User,
    Phone,
    Mail,
    Globe,
    MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Settings() {
    const [settings, setSettings] = useState(null);
    const [settingsId, setSettingsId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingSignature, setUploadingSignature] = useState(false);

    const [formData, setFormData] = useState({
        institute_name: '',
        logo_url: '',
        primary_color: '#1e3a5f',
        secondary_color: '#d4af37',
        signature_url: '',
        authority_name: '',
        authority_title: '',
        certificate_heading: 'Certificate of Completion',
        address: '',
        contact_phone: '',
        contact_email: '',
        website: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await base44.entities.Settings.list();
            if (data.length > 0) {
                setSettings(data[0]);
                setSettingsId(data[0].id);
                setFormData({
                    institute_name: data[0].institute_name || '',
                    logo_url: data[0].logo_url || '',
                    primary_color: data[0].primary_color || '#1e3a5f',
                    secondary_color: data[0].secondary_color || '#d4af37',
                    signature_url: data[0].signature_url || '',
                    authority_name: data[0].authority_name || '',
                    authority_title: data[0].authority_title || '',
                    certificate_heading: data[0].certificate_heading || 'Certificate of Completion',
                    address: data[0].address || '',
                    contact_phone: data[0].contact_phone || '',
                    contact_email: data[0].contact_email || '',
                    website: data[0].website || ''
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, logo_url: file_url });
            toast.success('Logo uploaded successfully');
        } catch (error) {
            toast.error('Logo upload failed');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSignatureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingSignature(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, signature_url: file_url });
            toast.success('Signature uploaded successfully');
        } catch (error) {
            toast.error('Signature upload failed');
        } finally {
            setUploadingSignature(false);
        }
    };

    const handleSave = async () => {
        if (!formData.institute_name.trim()) {
            toast.error('Enter institute name');
            return;
        }

        setSaving(true);
        try {
            if (settingsId) {
                await base44.entities.Settings.update(settingsId, formData);
            } else {
                const newSettings = await base44.entities.Settings.create(formData);
                setSettingsId(newSettings.id);
            }
            toast.success('Settings saved successfully');
            // Reload to update layout
            window.location.reload();
        } catch (error) {
            toast.error('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="certificate">Certificate</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Institute Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Institute Name *</Label>
                                    <Input
                                        value={formData.institute_name}
                                        onChange={(e) => setFormData({...formData, institute_name: e.target.value})}
                                        placeholder="Your institute name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={formData.website}
                                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                                            placeholder="www.example.com"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={formData.contact_phone}
                                            onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                                            placeholder="01XXXXXXXXX"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="email"
                                            value={formData.contact_email}
                                            onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                                            placeholder="email@example.com"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        placeholder="Full Address"
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appearance" className="mt-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Branding
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label>Institute Logo</Label>
                                <div className="flex items-center gap-4">
                                    {formData.logo_url ? (
                                        <img 
                                            src={formData.logo_url} 
                                            alt="Logo" 
                                            className="h-20 w-20 rounded-xl object-cover border"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <Building2 className="h-8 w-8 text-slate-400" />
                                        </div>
                                    )}
                                    <div>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={uploadingLogo}
                                            className="max-w-xs"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, max 2MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={formData.primary_color}
                                            onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                                            className="h-10 w-20 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={formData.primary_color}
                                            onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Secondary Color</Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={formData.secondary_color}
                                            onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                                            className="h-10 w-20 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={formData.secondary_color}
                                            onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="p-6 rounded-xl" style={{ backgroundColor: formData.primary_color }}>
                                <div className="flex items-center gap-3">
                                    {formData.logo_url ? (
                                        <img src={formData.logo_url} alt="Logo" className="h-12 w-12 rounded-lg bg-white p-1" />
                                    ) : (
                                        <div 
                                            className="h-12 w-12 rounded-lg flex items-center justify-center font-bold text-xl"
                                            style={{ backgroundColor: formData.secondary_color, color: formData.primary_color }}
                                        >
                                            {formData.institute_name?.[0] || 'A'}
                                        </div>
                                    )}
                                    <div className="text-white">
                                        <h3 className="font-bold">{formData.institute_name || 'Institute Name'}</h3>
                                        <p className="text-sm opacity-70">Preview</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="certificate" className="mt-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Certificate Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Certificate Heading</Label>
                                <Input
                                    value={formData.certificate_heading}
                                    onChange={(e) => setFormData({...formData, certificate_heading: e.target.value})}
                                    placeholder="Certificate of Completion"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Authority Name</Label>
                                    <Input
                                        value={formData.authority_name}
                                        onChange={(e) => setFormData({...formData, authority_name: e.target.value})}
                                        placeholder="Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Authority Title</Label>
                                    <Input
                                        value={formData.authority_title}
                                        onChange={(e) => setFormData({...formData, authority_title: e.target.value})}
                                        placeholder="Director"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Signature (Handwritten)</Label>
                                <div className="flex items-center gap-4">
                                    {formData.signature_url ? (
                                        <img 
                                            src={formData.signature_url} 
                                            alt="Signature" 
                                            className="h-16 object-contain border rounded-lg p-2 bg-white"
                                        />
                                    ) : (
                                        <div className="h-16 w-32 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <span className="text-slate-400 text-sm">No Signature</span>
                                        </div>
                                    )}
                                    <div>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleSignatureUpload}
                                            disabled={uploadingSignature}
                                            className="max-w-xs"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">PNG with transparent background recommended</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}