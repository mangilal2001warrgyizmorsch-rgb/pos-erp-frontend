"use client";

import { useEffect, useState } from "react";
import { 
  Building2, Phone, Mail, MapPin, Hash, Briefcase, 
  Map, Fingerprint, Calendar, Save, Camera, UploadCloud,
  Settings, Globe, ShieldCheck, Warehouse, CreditCard, X
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useBusinessStore } from "@/store/businessStore";
import { uploadService } from "@/services/uploadService";
import type { BusinessProfile } from "@/types";
import { useRef } from "react";

export default function BusinessProfilePage() {
  const { profile: storeProfile, fetchProfile, updateProfile, loading: storeLoading } = useBusinessStore();
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [signUploading, setSignUploading] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);

  const [localProfile, setLocalProfile] = useState<Partial<BusinessProfile>>({
    businessName: "",
    tagline: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
    businessType: "",
    category: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (!storeProfile) {
      fetchProfile();
    } else {
      setLocalProfile({
        businessName: storeProfile.businessName || "",
        tagline: storeProfile.tagline || "",
        phone: storeProfile.phone || "",
        email: storeProfile.email || "",
        gstin: storeProfile.gstin || "",
        address: storeProfile.address || "",
        businessType: storeProfile.businessType || "",
        category: storeProfile.category || "",
        state: storeProfile.state || "",
        pincode: storeProfile.pincode || "",
        logo: storeProfile.logo || "",
        signature: storeProfile.signature || "",
        beginningDate: storeProfile.beginningDate,
      });
    }
  }, [storeProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(localProfile);
      toast.success("Business profile updated successfully");
    } catch (error) {
      toast.error("Failed to update business profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (field === 'logo') setLogoUploading(true);
      else setSignUploading(true);

      const imageUrl = await uploadService.uploadSingle(file, 'profiles');
      setLocalProfile(prev => ({ ...prev, [field]: imageUrl }));
      toast.success(`${field === 'logo' ? 'Logo' : 'Signature'} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${field}`);
    } finally {
      if (field === 'logo') setLogoUploading(false);
      else setSignUploading(false);
    }
  };

  if (storeLoading && !storeProfile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your store's identity and branding</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocalProfile(storeProfile || {})} className="h-10 px-4">
            Discard Changes
          </Button>
          <Button onClick={handleSave} disabled={saving} className="h-10 px-6 gap-2">
            {saving ? <UploadCloud className="h-4 w-4 animate-bounce" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group shrink-0">
                  <div className="h-32 w-32 rounded-2xl bg-background border-2 border-border flex items-center justify-center text-4xl font-bold text-primary shadow-sm ring-4 ring-primary/5 overflow-hidden relative">
                    {logoUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <UploadCloud className="h-6 w-6 animate-bounce text-primary" />
                        <span className="text-[10px] uppercase font-bold text-slate-400">Uploading...</span>
                      </div>
                    ) : localProfile.logo ? (
                      <div className="group/preview relative h-full w-full">
                        <img src={localProfile.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity gap-2">
                          <button 
                            onClick={() => logoInputRef.current?.click()}
                            className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                            title="Change Logo"
                          >
                            <Camera className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocalProfile(prev => ({ ...prev, logo: "" }));
                            }}
                            className="p-2 bg-destructive/80 hover:bg-destructive rounded-full text-white transition-colors"
                            title="Remove Logo"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group/empty relative h-full w-full flex items-center justify-center">
                        {localProfile.businessName?.charAt(0) || "B"}
                        <button 
                          onClick={() => logoInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/empty:opacity-100 transition-opacity"
                        >
                          <Camera className="h-8 w-8 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-semibold">
                      Primary Identity
                    </Badge>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified Profile
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold">{localProfile.businessName || "Your Business Name"}</CardTitle>
                  <CardDescription className="text-sm font-medium">
                    Legal business entity used for invoicing and reports
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    value={localProfile.businessName} 
                    onChange={(e) => setLocalProfile({...localProfile, businessName: e.target.value})}
                    placeholder="Enter Business Name"
                    className="h-11 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Slogan / Tagline
                  </Label>
                  <Input 
                    value={localProfile.tagline} 
                    onChange={(e) => setLocalProfile({...localProfile, tagline: e.target.value})}
                    placeholder="e.g. Quality & Trust"
                    className="h-11 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Phone Number
                  </Label>
                  <Input 
                    value={localProfile.phone} 
                    onChange={(e) => setLocalProfile({...localProfile, phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                    className="h-11 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Business Email
                  </Label>
                  <Input 
                    value={localProfile.email} 
                    onChange={(e) => setLocalProfile({...localProfile, email: e.target.value})}
                    placeholder="contact@business.com"
                    className="h-11 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    GSTIN Number
                  </Label>
                  <Input 
                    value={localProfile.gstin} 
                    onChange={(e) => setLocalProfile({...localProfile, gstin: e.target.value})}
                    placeholder="Enter GSTIN"
                    className="h-11 px-4 uppercase font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Accounting Start Date
                  </Label>
                  <Input 
                    type="date"
                    value={localProfile.beginningDate ? new Date(localProfile.beginningDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => setLocalProfile({...localProfile, beginningDate: e.target.value})}
                    className="h-11 px-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-wide">Detailed Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-muted-foreground">Business Segment</Label>
                <Select value={localProfile.businessType} onValueChange={(v) => setLocalProfile({...localProfile, businessType: v})}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retail">Retail Store</SelectItem>
                    <SelectItem value="Wholesale">Wholesale Trading</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Service">Professional Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-muted-foreground">State / Region</Label>
                <Select value={localProfile.state} onValueChange={(v) => setLocalProfile({...localProfile, state: v})}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="Gujarat">Gujarat</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-muted-foreground">Pincode</Label>
                <Input 
                  value={localProfile.pincode} 
                  onChange={(e) => setLocalProfile({...localProfile, pincode: e.target.value})}
                  placeholder="6-digit Pincode"
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-wide">Office Address</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={localProfile.address}
                onChange={(e) => setLocalProfile({...localProfile, address: e.target.value})}
                placeholder="Full Business Address"
                className="min-h-[100px] text-sm resize-none"
              />
            </CardContent>
          </Card>
          
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
              <ShieldCheck className="h-24 w-24" />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center gap-4">
              <div className="h-24 w-40 rounded-xl bg-card border border-indigo-500/20 flex items-center justify-center shadow-sm overflow-hidden p-2 relative group/sign">
                {signUploading ? (
                  <UploadCloud className="h-6 w-6 animate-bounce text-primary" />
                ) : localProfile.signature ? (
                  <div className="relative h-full w-full">
                    <img src={localProfile.signature} alt="Signature" className="h-full w-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/sign:opacity-100 transition-opacity gap-2">
                       <button 
                        onClick={() => signInputRef.current?.click()}
                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors"
                        title="Change Signature"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalProfile(prev => ({ ...prev, signature: "" }));
                        }}
                        className="p-1.5 bg-destructive/80 hover:bg-destructive rounded-lg text-white transition-colors"
                        title="Remove Signature"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center gap-1 opacity-40 cursor-pointer w-full h-full justify-center hover:bg-indigo-500/10 transition-colors"
                    onClick={() => signInputRef.current?.click()}
                  >
                    <Fingerprint className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Upload Signature</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">E-Signature</p>
                <p className="text-[10px] text-muted-foreground mt-1 px-2">
                  Used for authorized vouchers & A4 invoices
                </p>
              </div>
              <input 
                type="file" 
                ref={signInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'signature')}
              />
              {!localProfile.signature && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={signUploading}
                  onClick={() => signInputRef.current?.click()}
                  className="bg-card hover:bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 hover:text-indigo-600 font-semibold h-8 rounded-lg shadow-sm"
                >
                  {signUploading ? "Uploading..." : "Upload Signature"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
