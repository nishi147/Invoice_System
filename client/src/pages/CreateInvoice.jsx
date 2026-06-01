import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ChevronLeft, 
  Calculator, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import api from '../services/api.js';
import { ClassicTemplate, ModernTemplate, CorporateTemplate, MinimalTemplate } from '../components/InvoiceTemplates.jsx';

const CreateInvoice = () => {
  const { id } = useParams(); // present if editing
  const navigate = useNavigate();
  
  // Settings & Client Lists
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState({});
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [templateType, setTemplateType] = useState('modern');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [tdsRate, setTdsRate] = useState(0);
  const [items, setItems] = useState([
    { itemName: '', description: '', quantity: 1, rate: 0, taxRate: 18, amount: 0 }
  ]);

  // Derived Calculations
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [tdsAmount, setTdsAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Fetch initial clients and defaults
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientRes, settingsRes] = await Promise.all([
          api.get('/clients?limit=100'),
          api.get('/settings'),
        ]);

        if (clientRes.data.success) {
          setClients(clientRes.data.data);
        }
        if (settingsRes.data.success) {
          const s = settingsRes.data.data;
          setSettings(s);
          setCurrency(s.defaultCurrency || 'INR');
          setTerms(s.termsAndConditions || '');
        }

        // If ID is provided, fetch invoice to edit
        if (id) {
          const invoiceRes = await api.get(`/invoices/${id}`);
          if (invoiceRes.data.success) {
            const inv = invoiceRes.data.data;
            setInvoiceNumber(inv.invoiceNumber);
            setSelectedClient(inv.client?._id || inv.client);
            setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
            setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
            setCurrency(inv.currency);
            setTemplateType(inv.templateType);
            setNotes(inv.notes || '');
            setTerms(inv.terms || '');
            setDiscountRate(inv.discountRate || 0);
            setTdsRate(inv.tdsRate || 0);
            setItems(inv.items || []);
          }
        } else {
          // Set default due date: today + 15 days
          const d = new Date();
          d.setDate(d.getDate() + 15);
          setDueDate(d.toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error('Error fetching creation dependencies:', err);
      }
    };
    fetchData();
  }, [id]);

  // Perform Calculations
  useEffect(() => {
    let sub = 0;
    let tax = 0;

    const calculatedItems = items.map((item) => {
      const amt = item.quantity * item.rate;
      const lineTax = (amt * (item.taxRate || 0)) / 100;
      sub += amt;
      tax += lineTax;
      return { ...item, amount: amt };
    });

    const discAmt = (sub * (discountRate || 0)) / 100;
    const tdsAmt = (sub * (tdsRate || 0)) / 100;
    const total = sub + tax - discAmt - tdsAmt;

    setSubtotal(sub);
    setTaxAmount(tax);
    setDiscountAmount(discAmt);
    setTdsAmount(tdsAmt);
    setGrandTotal(total);
  }, [items, discountRate, tdsRate]);

  // Handle item change
  const handleItemFieldChange = (index, field, value) => {
    const newItems = [...items];
    if (field === 'itemName' || field === 'description') {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = parseFloat(value) || 0;
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { itemName: '', description: '', quantity: 1, rate: 0, taxRate: 18, amount: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Submit form
  const handleSaveInvoice = async (status = 'draft') => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }
    
    // Check item validity
    const invalidItems = items.some(item => !item.itemName || item.quantity <= 0 || item.rate < 0);
    if (invalidItems) {
      alert('Please fill all item fields with valid quantities and rates');
      return;
    }

    setSaving(true);
    try {
      const invoiceData = {
        client: selectedClient,
        invoiceDate,
        dueDate,
        currency,
        templateType,
        notes,
        terms,
        discountRate,
        tdsRate,
        items,
        status, // 'draft' or 'sent'
      };

      if (invoiceNumber) {
        invoiceData.invoiceNumber = invoiceNumber;
      }

      let res;
      if (id) {
        res = await api.put(`/invoices/${id}`, invoiceData);
      } else {
        res = await api.post('/invoices', invoiceData);
      }

      if (res.data.success) {
        alert(id ? 'Invoice updated successfully!' : 'Invoice created successfully!');
        navigate('/invoices');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  // Render correct Template for live preview panel
  const renderTemplatePreview = () => {
    const activeClient = clients.find(c => c._id === selectedClient) || {
      name: 'Client Contact Name',
      company: 'Corporate Company Name LLC',
      email: 'finance@clientcompany.com',
      address: { street: '456 Client Avenue', city: 'Metropolis', country: 'India' }
    };

    const mockInvoice = {
      invoiceNumber: invoiceNumber || 'INV-YYYY-XXXX',
      invoiceDate,
      dueDate,
      items,
      subtotal,
      taxAmount,
      discountRate,
      discountAmount,
      tdsRate,
      tdsAmount,
      grandTotal,
      balanceDue: grandTotal,
      currency,
      status: id ? 'Updated' : 'Draft',
      notes,
      clientDetailsSnapshot: activeClient,
    };

    switch (templateType) {
      case 'classic':
        return <ClassicTemplate invoice={mockInvoice} settings={settings} />;
      case 'corporate':
        return <CorporateTemplate invoice={mockInvoice} settings={settings} />;
      case 'minimal':
        return <MinimalTemplate invoice={mockInvoice} settings={settings} />;
      default:
        return <ModernTemplate invoice={mockInvoice} settings={settings} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header back row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Ledger
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="hidden items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 lg:flex transition-all"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Live Preview' : 'Show Live Preview'}
          </button>
          
          <button
            onClick={() => handleSaveInvoice('draft')}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>

          <button
            onClick={() => handleSaveInvoice('sent')}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/10 hover:bg-brand-700 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <Send className="h-4 w-4" />
            Save & Send
          </button>
        </div>
      </div>

      {/* Workspace split layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Form panel */}
        <div className={`space-y-6 lg:col-span-12 ${showPreview ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <h3 className="font-outfit text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 pb-3 dark:border-slate-800">
              Invoice Core Parameters
            </h3>

            {/* Top parameters block */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Client Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Bill To Client *
                </label>
                <select
                  required
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
                >
                  <option value="" className="dark:bg-slate-900">Select client contact...</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id} className="dark:bg-slate-900">
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Invoice Code / Number (Auto-gen if empty)
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-0045"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
                />
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Billing Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Remittance Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Transaction Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
                >
                  <option value="INR" className="dark:bg-slate-900">INR (₹) Indian Rupee</option>
                  <option value="USD" className="dark:bg-slate-900">USD ($) US Dollar</option>
                  <option value="EUR" className="dark:bg-slate-900">EUR (€) Euro</option>
                  <option value="GBP" className="dark:bg-slate-900">GBP (£) British Pound</option>
                </select>
              </div>

              {/* Layout Template */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Invoice Layout Theme
                </label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
                >
                  <option value="modern" className="dark:bg-slate-900">Modern (SaaS style)</option>
                  <option value="corporate" className="dark:bg-slate-900">Corporate (Premium enterprise)</option>
                  <option value="classic" className="dark:bg-slate-900">Classic (Traditional business)</option>
                  <option value="minimal" className="dark:bg-slate-900">Minimal (Simple white)</option>
                </select>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-650 dark:text-slate-300">
                  Line Items
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  <Plus className="h-3 w-3" /> Add item row
                </button>
              </div>

              {/* Items row mapper */}
              <div className="space-y-3.5">
                {items.map((item, idx) => (
                  <div key={idx} className="grid gap-3 sm:grid-cols-12 items-start border border-slate-100 p-3.5 rounded-xl dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 relative">
                    {/* Item Name */}
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.itemName}
                        onChange={(e) => handleItemFieldChange(idx, 'itemName', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    {/* Description */}
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    {/* Qty */}
                    <div className="sm:col-span-1">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                        className="w-full text-center rounded-lg border border-slate-200 bg-white py-2 px-1 text-xs outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    {/* Rate */}
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Rate"
                        value={item.rate || ''}
                        onChange={(e) => handleItemFieldChange(idx, 'rate', e.target.value)}
                        className="w-full text-right rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    {/* GST % */}
                    <div className="sm:col-span-1">
                      <select
                        value={item.taxRate}
                        onChange={(e) => handleItemFieldChange(idx, 'taxRate', e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 px-1 text-xs text-center outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                    {/* Remove button */}
                    <div className="sm:col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal calculations panels */}
            <div className="grid gap-6 md:grid-cols-2 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="space-y-4">
                {/* Discount */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    General Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={discountRate || ''}
                    onChange={(e) => setDiscountRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                {/* TDS Deduction */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    TDS Withholding Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="e.g. 1 or 2"
                    value={tdsRate || ''}
                    onChange={(e) => setTdsRate(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
              </div>

              {/* Calculations readout table */}
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-900/50 space-y-3.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800/40">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{currency} {subtotal.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>GST (Tax Cumulative):</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{currency} {taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({discountRate}%):</span>
                    <span>- {currency} {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {tdsAmount > 0 && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>TDS Deductions ({tdsRate}%):</span>
                    <span>- {currency} {tdsAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-3 dark:border-slate-700 font-outfit text-sm font-bold text-slate-800 dark:text-slate-100">
                  <span>Grand Total:</span>
                  <span>{currency} {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Notes block */}
            <div className="space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Invoice Notes / Comments
                </label>
                <textarea
                  rows="3"
                  placeholder="Will print at the bottom of the invoice..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-6 sticky top-20 hidden lg:block space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Live Preview
            </h4>
            <div className="scale-[0.9] origin-top max-h-[85vh] overflow-y-auto rounded-2xl shadow-xl border border-slate-200/40">
              {renderTemplatePreview()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateInvoice;
