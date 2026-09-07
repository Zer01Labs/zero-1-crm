import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Upload, Image as ImageIcon, X, Check, Globe, Mail, 
  Phone, MapPin, Sparkles, FileText, Trash2, HelpCircle, Coins, Banknote
} from 'lucide-react';
import { CompanySettings } from '../types';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => Promise<void>;
  isOnboarding?: boolean;
}

// Preset logos for quick one-click selection
const PRESET_LOGOS = [
  {
    name: 'Crimson Flame',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23dc2626"/><path d="M50 20 C60 40, 80 45, 80 65 C80 80, 65 90, 50 90 C35 90, 20 80, 20 65 C20 45, 40 40, 50 20 Z" fill="%23ffffff"/><path d="M50 40 C55 52, 65 55, 65 67 C65 75, 58 80, 50 80 C42 80, 35 75, 35 67 C35 55, 45 52, 50 40 Z" fill="%23fee2e2"/></svg>'
  },
  {
    name: 'Emerald Shield',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23059669"/><path d="M50 18 L80 30 V55 C80 72 50 88 50 88 C50 88 20 72 20 55 V30 Z" fill="%23ffffff"/><path d="M50 28 L70 38 V55 C70 67 50 78 50 78 C50 78 30 67 30 55 V38 Z" fill="%23a7f3d0"/></svg>'
  },
  {
    name: 'Royal Crest',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%234f46e5"/><polygon points="50,18 63,38 85,42 70,58 73,80 50,70 27,80 30,58 15,42 37,38" fill="%23ffffff"/></svg>'
  },
  {
    name: 'Modern Monogram',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2318181b" stroke="%233f3f46" stroke-width="4"/><text x="50" y="68" font-family="sans-serif" font-weight="900" font-size="52" fill="%23ef4444" text-anchor="middle">HQ</text></svg>'
  },
  {
    name: 'Golden Apex',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23d97706"/><polygon points="50,20 80,75 20,75" fill="%23ffffff"/><polygon points="50,38 70,75 30,75" fill="%23fef3c7"/></svg>'
  }
];

export default function CompanySettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
  isOnboarding = false
}: CompanySettingsModalProps) {
  const [companyName, setCompanyName] = useState(currentSettings.companyName || 'ScarletCRM Operations');
  const [companyTagline, setCompanyTagline] = useState(currentSettings.companyTagline || 'Corporate Operations Portal');
  const [logoUrl, setLogoUrl] = useState(currentSettings.logoUrl || '');
  const [address, setAddress] = useState(currentSettings.address || '100 Corporate Plaza, Suite 500, New York, NY 10001');
  const [email, setEmail] = useState(currentSettings.email || 'billing@company.com');
  const [phone, setPhone] = useState(currentSettings.phone || '+1 (800) 555-0199');
  const [website, setWebsite] = useState(currentSettings.website || 'www.company.com');
  const [currencySymbol, setCurrencySymbol] = useState(currentSettings.currencySymbol || '₹');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  if (!isOpen) return null;

  // Handle local image file upload converting to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Image size exceeds 3MB limit. Please upload a smaller logo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company Name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSaveSettings({
        companyName: companyName.trim(),
        companyTagline: companyTagline.trim(),
        logoUrl: logoUrl.trim(),
        address: address.trim(),
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        currencySymbol: currencySymbol.trim() || '₹',
        cashLabel: currentSettings.cashLabel || 'Cash',
      });
      onClose();
    } catch (err) {
      console.error("Error saving company profile:", err);
      setError('Failed to save company settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18 }}
        className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 shadow-pop relative my-8"
      >
        {/* Header indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand via-violet to-brand rounded-t-2xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand/30 flex items-center justify-center text-brand">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-ink uppercase tracking-wide">
                {isOnboarding ? 'Welcome! Set Up Your Company Branding' : 'Company Branding & Payslip Settings'}
              </h2>
              <p className="text-xs text-ink-soft font-sans mt-0.5">
                Configure your Company Name and Logo for official payslips, receipts, and headers.
              </p>
            </div>
          </div>
          {!isOnboarding && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-loss-soft border border-loss/30 text-xs text-loss">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: LOGO SELECTION & UPLOAD */}
          <div className="space-y-3 bg-surface-2 p-4 rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider text-brand font-bold flex items-center gap-1.5">
                <ImageIcon size={14} />
                Company Logo Image
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-[10px] text-ink-faint hover:text-loss flex items-center gap-1 cursor-pointer font-mono transition-colors"
                >
                  <Trash2 size={11} /> Remove Logo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Logo Preview Box */}
              <div className="flex flex-col items-center justify-center p-3 bg-surface border border-dashed border-border rounded-xl h-28 relative">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Company Logo Preview"
                    className="max-h-20 max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-ink-faint space-y-1">
                    <Building2 className="mx-auto text-ink-faint" size={24} />
                    <span className="block text-[10px] font-mono text-ink-faint">No Logo Set</span>
                  </div>
                )}
              </div>

              {/* Upload & Preset Options */}
              <div className="sm:col-span-2 space-y-3">
                {/* File Upload Input */}
                <div>
                  <label className="block text-[10px] font-mono text-ink-soft mb-1">
                    Upload Logo File (PNG, JPG, SVG, WEBP)
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-surface hover:bg-surface-2 border border-border hover:border-brand/50 rounded-xl cursor-pointer transition-colors text-xs text-ink font-mono shadow-card">
                    <Upload size={14} className="text-brand" />
                    <span>Choose Image File...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadError && <p className="text-[10px] text-loss mt-1">{uploadError}</p>}
                </div>

                {/* Preset Logo Selection */}
                <div>
                  <label className="block text-[10px] font-mono text-ink-faint mb-1.5">
                    Or select a instant agency logo badge:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_LOGOS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setLogoUrl(preset.url)}
                        className={`p-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                          logoUrl === preset.url
                            ? 'bg-brand-soft border-brand text-brand ring-1 ring-brand'
                            : 'bg-surface border-border hover:border-border-soft text-ink-soft'
                        }`}
                        title={`Select ${preset.name}`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-5 h-5 rounded-lg object-cover" />
                        <span className="text-[10px] font-mono">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* URL Input */}
                <div>
                  <input
                    type="url"
                    placeholder="Or paste external Logo Image URL (https://...)"
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand/50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: COMPANY NAME & TAGLINE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-ink-soft mb-1 font-medium">
                Company / Agency Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Media Corp, Scarlet Operations"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand/50 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-soft mb-1 font-medium">
                Company Subtitle / Tagline
              </label>
              <input
                type="text"
                placeholder="e.g. Digital Media & Creative Operations"
                value={companyTagline}
                onChange={(e) => setCompanyTagline(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand/50"
              />
            </div>
          </div>

          {/* SECTION 3: CONTACT & OFFICIAL ADDRESS FOR PAYSLIPS */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-xs font-mono uppercase tracking-wider text-ink-faint font-semibold">
              Official Document Details (For Payslips & Invoices)
            </h3>

            <div>
              <label className="block text-xs text-ink-soft mb-1">Registered Address</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-2.5 text-ink-faint" />
                <input
                  type="text"
                  placeholder="e.g. 100 Corporate Plaza, Suite 500, New York, NY 10001"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-ink focus:outline-none focus:border-brand/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-ink-soft mb-1">Official Email</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-2.5 text-ink-faint" />
                  <input
                    type="email"
                    placeholder="payroll@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-ink font-mono focus:outline-none focus:border-brand/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-ink-soft mb-1">Business Phone</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-2.5 text-ink-faint" />
                  <input
                    type="text"
                    placeholder="+1 (800) 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-ink font-mono focus:outline-none focus:border-brand/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-ink-soft mb-1">Company Website</label>
                <div className="relative">
                  <Globe size={13} className="absolute left-3 top-2.5 text-ink-faint" />
                  <input
                    type="text"
                    placeholder="www.company.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-ink font-mono focus:outline-none focus:border-brand/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: CURRENCY SETTINGS */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-xs font-mono uppercase tracking-wider text-ink-faint font-semibold flex items-center gap-1.5">
              <Coins size={13} className="text-brand" />
              Currency Settings
            </h3>

            <div>
              <label className="block text-xs text-ink-soft mb-1 font-medium">
                Currency Symbol *
              </label>
              <div className="flex gap-1.5 mb-2">
                {['₹', '$', '€', '£', 'AED'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setCurrencySymbol(sym)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-all ${
                      currencySymbol === sym
                        ? 'bg-brand text-white border-brand'
                        : 'bg-surface-2 text-ink border-border hover:border-brand/40'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="e.g. ₹ or Rs. or $"
                className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono font-bold focus:outline-none focus:border-brand/50"
              />
              <span className="text-[10px] text-ink-faint mt-1 block">
                This symbol will be displayed across all revenues, pending dues, expenses, and invoices.
              </span>
            </div>
          </div>

          {/* LIVE PREVIEW BOX FOR PAYSLIP */}
          <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-ink-faint uppercase tracking-widest block font-bold flex items-center gap-1">
              <FileText size={12} className="text-brand" />
              Live Payslip Header Preview
            </span>
            <div className="bg-surface p-4 rounded-xl border border-border flex justify-between items-center shadow-card">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-xl bg-surface-2 p-1 border border-border" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-lg font-display">
                    {companyName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-display font-bold text-sm text-ink uppercase tracking-wider">
                    {companyName}
                  </h4>
                  <p className="text-[10px] text-ink-soft font-mono">{companyTagline}</p>
                  <p className="text-[9px] text-ink-faint font-mono mt-0.5">{address}</p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-gain uppercase font-bold block">SALARY PAYSLIP</span>
                <span className="text-[9px] text-ink-faint">REF: OFFICIAL RECEIPT</span>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="pt-3 border-t border-border flex justify-end gap-3">
            {!isOnboarding && (
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-2 border border-border text-xs font-semibold text-ink-soft hover:text-ink transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-brand hover:bg-brand/90 text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-card hover:shadow-pop cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <span>Saving Branding...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Company Branding</span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
