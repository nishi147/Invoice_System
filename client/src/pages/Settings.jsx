import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Save, 
  Download, 
  UploadCloud, 
  Building2, 
  CreditCard, 
  Database,
  ArrowRight,
  Info 
} from 'lucide-react';
import api, { API_URL } from '../services/api.js';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [gst, setGst] = useState('');
  const [pan, setPan] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [terms, setTerms] = useState('');

  // Bank account states
  const [accName, setAccName] = useState('');
  const [accNo, setAccNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [swift, setSwift] = useState('');

  // Restore file state
  const [restoreFile, setRestoreFile] = useState(null);

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        const s = res.data.data;
        setName(s.name || '');
        setEmail(s.email || '');
        setPhone(s.phone || '');
        setWebsite(s.website || '');
        setGst(s.gstNumber || '');
        setPan(s.panNumber || '');
        setStreet(s.address?.street || '');
        setCity(s.address?.city || '');
        setState(s.address?.state || '');
        setZip(s.address?.zipCode || '');
        setCountry(s.address?.country || '');
        setCurrency(s.defaultCurrency || 'INR');
        setTerms(s.termsAndConditions || '');

        if (s.bankDetails) {
          setAccName(s.bankDetails.accountName || '');
          setAccNo(s.bankDetails.accountNumber || '');
          setBankName(s.bankDetails.bankName || '');
          setIfsc(s.bankDetails.ifscCode || '');
          setSwift(s.bankDetails.swiftCode || '');
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (user?.role === 'staff') {
      alert('Unauthorized role permissions');
      return;
    }

    setSaving(true);
    try {
      const settingsData = {
        name,
        email,
        phone,
        website,
        gstNumber: gst,
        panNumber: pan,
        address: { street, city, state, zipCode: zip, country },
        defaultCurrency: currency,
        termsAndConditions: terms,
        bankDetails: {
          accountName: accName,
          accountNumber: accNo,
          bankName,
          ifscCode: ifsc,
          swiftCode: swift,
        },
      };

      const res = await api.put('/settings', settingsData);
      if (res.data.success) {
        alert('Company settings updated successfully!');
        fetchSettings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    // Download database JSON backup
    const anchor = document.createElement('a');
    anchor.href = `${API_URL}/api/settings/backup`;
    anchor.download = `manshu_finance_backup_${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!restoreFile) {
      alert('Please choose a valid backup JSON file first');
      return;
    }

    if (!window.confirm('CRITICAL WARNING: This will completely overwrite all existing users, clients, invoices, expenses, and settings with the backup file data. Are you absolutely sure you want to proceed?')) {
      return;
    }

    setRestoring(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          const res = await api.post('/settings/restore', parsedData);
          if (res.data.success) {
            alert('Database restore complete! Please log in again to refresh context.');
            // Clear credentials and log out
            localStorage.clear();
            window.location.href = '/login';
          }
        } catch (parseErr) {
          alert('Failed to parse backup file, make sure it is a valid JSON schema');
          setRestoring(false);
        }
      };
      reader.readAsText(restoreFile);
    } catch (err) {
      alert('Restore process encountered errors');
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-outfit text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl">
          System configurations
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Branding parameters, default tax details, billing terms, and database maintenance tools.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Core Profile Form (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6 text-xs">
            {/* Branding details */}
            <div className="space-y-4">
              <h3 className="font-outfit text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                <Building2 className="h-4 w-4 text-brand-600" />
                Company Branding & Registry
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">Registered Company Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">Business Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">Corporate Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">GST Identification (GSTIN)</label>
                  <input
                    type="text"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">Permanent Account Number (PAN)</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <h3 className="font-outfit text-sm font-semibold text-slate-700 dark:text-slate-350">
                Registered Office Address
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 mb-1">Street Details</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-2 outline-none focus:border-brand-500 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-2 outline-none focus:border-brand-500 dark:border-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Bank details */}
            <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <h3 className="font-outfit text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                Remittance Bank Accounts
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">Account Beneficiary Name</label>
                  <input
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">Account Number</label>
                  <input
                    type="text"
                    value={accNo}
                    onChange={(e) => setAccNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">Financial Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">IFSC Routing Code</label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">SWIFT International Code (Optional)</label>
                  <input
                    type="text"
                    value={swift}
                    onChange={(e) => setSwift(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-semibold mb-1.5">Default Ledger Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <h3 className="font-outfit text-sm font-semibold text-slate-700 dark:text-slate-350">
                Default Terms & Notes
              </h3>
              <div>
                <textarea
                  rows="3"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Save trigger */}
            {user?.role !== 'staff' && (
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-500/10 hover:bg-brand-700 hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <Save className="h-4 w-4" /> Save Profile Configurations
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Maintenance / Backup Center (Col-span 1) */}
        {user?.role === 'super_admin' && (
          <div className="space-y-6 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <h3 className="font-outfit text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                <Database className="h-4 w-4 text-brand-600" />
                System Maintenance
              </h3>

              {/* Backup */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700 dark:text-slate-350">1. Database Backup</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Export all database collections (Users, Invoices, Clients, Expenses, Payments) into a portable JSON backup file.
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                >
                  <Download className="h-4 w-4 text-slate-400" /> Download Database JSON
                </button>
              </div>

              {/* Restore */}
              <form onSubmit={handleRestoreSubmit} className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-350">2. Database Restore</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Select a previously exported Manshu Finance JSON backup file. Overwrites the active server database.
                </p>
                
                <input
                  type="file"
                  required
                  accept=".json"
                  onChange={(e) => setRestoreFile(e.target.files[0])}
                  className="w-full text-[10px] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-350 cursor-pointer"
                />

                <button
                  type="submit"
                  disabled={restoring}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 disabled:opacity-50 transition-all"
                >
                  <UploadCloud className="h-4 w-4" /> 
                  {restoring ? 'Restoring Database...' : 'Upload & Restore Ledger'}
                </button>
              </form>
            </div>
            
            {/* Info help card */}
            <div className="rounded-2xl border border-slate-200 bg-brand-500/5 p-4 dark:border-brand-500/10 flex gap-2.5 leading-normal">
              <Info className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Running database restores clears current configurations and logs. Make sure to download a backup copy of current transactions before uploading old backups.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
