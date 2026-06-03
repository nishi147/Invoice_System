import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  ChevronLeft, 
  Edit3, 
  Send, 
  Download, 
  Printer, 
  Copy, 
  Ban, 
  CheckCircle,
  QrCode,
  Calendar,
  IndianRupee,
  Share2,
  DollarSign,
  Info,
  Clock
} from 'lucide-react';
import api, { API_URL } from '../services/api.js';
import { ClassicTemplate, ModernTemplate, CorporateTemplate, MinimalTemplate } from '../components/InvoiceTemplates.jsx';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // States
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Record Payment Form States
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payTxId, setPayTxId] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Fetch dependencies
  const fetchInvoiceData = async () => {
    try {
      const [invoiceRes, settingsRes, paymentsRes] = await Promise.all([
        api.get(`/invoices/${id}`),
        api.get('/settings'),
        api.get(`/payments/invoice/${id}`),
      ]);

      if (invoiceRes.data.success) {
        setInvoice(invoiceRes.data.data);
        // Pre-fill payment amount with remaining balance
        setPayAmount(invoiceRes.data.data.balanceDue.toString());
      }
      if (settingsRes.data.success) {
        setSettings(settingsRes.data.data);
      }
      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load invoice details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const handleDownloadPDF = () => {
    // Direct link to the API endpoint which returns the PDF attachment
    const token = localStorage.getItem('accessToken');
    const downloadUrl = `${API_URL}/api/invoices/${id}/pdf`;
    
    // We can open the download link directly
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await api.post(`/invoices/${id}/send`);
      if (res.data.success) {
        alert(res.data.message);
        if (res.data.previewUrl) {
          window.open(res.data.previewUrl, '_blank');
        }
        fetchInvoiceData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to email invoice');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDuplicate = async () => {
    if (!window.confirm('Are you sure you want to duplicate this invoice?')) return;
    try {
      const res = await api.post(`/invoices/${id}/duplicate`);
      if (res.data.success) {
        alert('Invoice duplicated!');
        navigate(`/invoices/${res.data.data._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Duplication failed');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      const res = await api.post(`/invoices/${id}/cancel`);
      if (res.data.success) {
        alert('Invoice cancelled');
        fetchInvoiceData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const paymentData = {
        invoiceId: id,
        amount: parseFloat(payAmount),
        paymentMode: payMode,
        transactionId: payTxId,
        notes: payNotes,
      };

      const res = await api.post('/payments', paymentData);
      if (res.data.success) {
        alert('Payment recorded successfully!');
        setShowPaymentModal(false);
        setPayNotes('');
        setPayTxId('');
        fetchInvoiceData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment recording failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-rose-500">Invoice not found</h2>
        <Link to="/invoices" className="text-brand-600 hover:underline mt-2 inline-block">Back to list</Link>
      </div>
    );
  }

  // Sharing Link for portal
  const sharingLink = `${window.location.origin}/portal/invoice/${invoice.sharingToken}`;

  const renderTemplate = () => {
    switch (invoice.templateType) {
      case 'classic':
        return <ClassicTemplate invoice={invoice} settings={settings} />;
      case 'corporate':
        return <CorporateTemplate invoice={invoice} settings={settings} />;
      case 'minimal':
        return <MinimalTemplate invoice={invoice} settings={settings} />;
      default:
        return <ModernTemplate invoice={invoice} settings={settings} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and Meta operations header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Invoices Ledger
        </button>

        {/* Toolbar of Operations */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit (Staff can edit only drafts) */}
          {(user?.role !== 'staff' || invoice.status === 'draft') && (
            <button
              onClick={() => navigate(`/invoices/edit/${id}`)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Edit3 className="h-4. w-4" /> Edit
            </button>
          )}

          {/* Email */}
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {sendingEmail ? 'Sending...' : 'Email Client'}
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" /> PDF
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" /> Print
          </button>

          {/* QR Portal Link */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <QrCode className="h-4 w-4" /> Portal QR
          </button>

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Copy className="h-4 w-4" /> Duplicate
          </button>

          {/* Cancel */}
          {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Ban className="h-4 w-4" /> Cancel
            </button>
          )}

          {/* Record Payment (Super Admin & Accountant only) */}
          {invoice.balanceDue > 0 && user?.role !== 'staff' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-500/10 hover:bg-brand-700 hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <CheckCircle className="h-4 w-4" /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Main layout split */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Template Preview Panel */}
        <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
          {renderTemplate()}
        </div>

        {/* Info panel (Payment history & links) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Stats Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-outfit text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-2.5 dark:border-slate-800 mb-4">
              Invoice Ledger Metrics
            </h4>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Bill Value:</span>
                <span className="font-bold text-slate-850 dark:text-slate-250">{invoice.currency} {invoice.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Liquid Paid:</span>
                <span className="font-bold text-emerald-600">{invoice.currency} {invoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-150 pt-3 dark:border-slate-800 font-bold text-sm">
                <span className="text-slate-800 dark:text-slate-200">Balance Due:</span>
                <span className="text-rose-600">{invoice.currency} {invoice.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment history list */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-outfit text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-2.5 dark:border-slate-800 mb-4">
              Payment Timeline
            </h4>
            {payments.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-4 text-center">No payment transactions recorded</p>
            ) : (
              <div className="relative border-l border-slate-200 pl-4 space-y-4 py-2 dark:border-slate-800">
                {payments.map((p, idx) => (
                  <div key={p._id} className="relative text-xs">
                    {/* Circle icon marker */}
                    <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                    <p className="font-semibold text-slate-800 dark:text-slate-250">
                      Received {invoice.currency} {p.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Mode: {p.paymentMode} | Date: {new Date(p.paymentDate).toLocaleDateString()}
                    </p>
                    {p.transactionId && (
                      <p className="text-[9px] text-slate-400 italic">TX: {p.transactionId}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Dialog Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-fade-in">
            <h3 className="font-outfit text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
              Record Invoice Payment
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Amount ({invoice.currency})
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={invoice.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Payment Mode
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800"
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Transaction Reference ID / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN9988223"
                  value={payTxId}
                  onChange={(e) => setPayTxId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received partial/full payment"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none focus:border-brand-500 dark:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Sharing Dialog Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-fade-in text-center space-y-4">
            <h3 className="font-outfit text-base font-bold text-slate-800 dark:text-slate-100">
              Invoice Client Portal QR
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clients can scan this QR code to view this invoice, download PDFs, or track balances online.
            </p>
            
            {/* Direct Google/QR Server API rendering for QR code */}
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 p-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(sharingLink)}`}
                alt="Invoice Portal QR Code"
                className="h-full w-full object-contain"
              />
            </div>
            
            <div className="text-[10px] text-slate-400 break-all select-all font-mono border border-slate-100 bg-slate-50 dark:border-slate-850 dark:bg-slate-800/40 p-2.5 rounded-xl">
              {sharingLink}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
            >
              Close Portal QR Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
