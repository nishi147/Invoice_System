import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Clock, 
  History 
} from 'lucide-react';
import api from '../services/api.js';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClientProfile = async () => {
    try {
      const res = await api.get(`/clients/${id}`);
      if (res.data.success) {
        setClient(res.data.data.client);
        setStats(res.data.data.stats);
        setInvoices(res.data.data.invoices);
        setPayments(res.data.data.paymentHistory);
      }
    } catch (err) {
      console.error('Failed to load client details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-rose-500">Client profile not found</h2>
        <Link to="/clients" className="text-brand-600 hover:underline mt-2 inline-block">Back to directory</Link>
      </div>
    );
  }

  const currencySymbol = '₹';
  const formatCurrency = (val) => `${currencySymbol}${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const statCards = [
    { title: 'Invoiced Frequency', value: stats.totalInvoicesCount, subtext: 'Total invoices drafted', icon: <FileText className="h-5 w-5 text-indigo-500" />, bg: 'bg-indigo-500/5', border: 'border-indigo-500/10' },
    { title: 'Liquid Cash Received', value: formatCurrency(stats.totalRevenueGenerated), subtext: 'Lifetime revenue share', icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
    { title: 'Accounts Receivable', value: formatCurrency(stats.outstandingPayments), subtext: 'Unsettled balances due', icon: <Clock className="h-5 w-5 text-amber-500" />, bg: 'bg-amber-500/5', border: 'border-amber-500/10' }
  ];

  return (
    <div className="space-y-6">
      {/* Header back row */}
      <div>
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Client Directory
        </button>
      </div>

      {/* Grid containing client profile metadata */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Info card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-850">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 font-outfit text-base font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 uppercase">
              {client.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-outfit text-base font-bold text-slate-900 dark:text-slate-100">{client.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{client.company}</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="text-slate-650 dark:text-slate-450 break-all">{client.email}</span>
            </div>
            
            {client.phone && (
              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-650 dark:text-slate-450">{client.phone}</span>
              </div>
            )}

            {client.gstNumber && (
              <div className="flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider">GSTIN</span>
                  <span className="text-slate-650 dark:text-slate-450 font-mono mt-0.5 block">{client.gstNumber}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-850">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider">Billing Address</span>
                <span className="text-slate-500 mt-1 block">
                  {client.address?.street && `${client.address.street}, `}
                  {client.address?.city && `${client.address.city}, `}
                  {client.address?.state && `${client.address.state} `}
                  {client.address?.zipCode && `${client.address.zipCode}, `}
                  {client.address?.country || 'India'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats segment */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {statCards.map((card, index) => (
              <div 
                key={index}
                className={`rounded-2xl border ${card.border} ${card.bg} p-5 shadow-sm dark:bg-slate-900 transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-450">{card.title}</span>
                  {card.icon}
                </div>
                <p className="font-outfit text-xl font-bold tracking-tight text-slate-850 dark:text-slate-100 mt-3">{card.value}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">{card.subtext}</p>
              </div>
            ))}
          </div>

          {/* Client Invoices list */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-850">
              <h4 className="font-outfit text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Invoices History
              </h4>
            </div>

            {invoices.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No invoices have been logged for this client</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                      <th className="p-3 pl-5">Invoice #</th>
                      <th className="p-3">Billing Date</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-right">Outstanding</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                        <td className="p-3 pl-5">
                          <Link to={`/invoices/${inv._id}`} className="font-bold text-brand-600 dark:text-brand-455 hover:underline">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">
                          {new Date(inv.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-800 dark:text-slate-300">
                          {inv.currency} {inv.grandTotal.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-200">
                          {inv.currency} {inv.balanceDue.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                            inv.status === 'paid' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' 
                              : inv.status === 'overdue'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment receipt transactions */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-850 flex items-center gap-1.5">
              <History className="h-4 w-4 text-slate-400" />
              <h4 className="font-outfit text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Payment History Timeline
              </h4>
            </div>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No cash receipts logged from client</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {payments.map((p) => (
                  <div key={p._id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-250">
                        Received {formatCurrency(p.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Mode: {p.paymentMode} | Ref: {p.invoice?.invoiceNumber}
                      </p>
                      {p.notes && <p className="text-[10px] text-slate-500 mt-1">{p.notes}</p>}
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <p>{new Date(p.paymentDate).toLocaleDateString()}</p>
                      {p.transactionId && <p className="font-mono mt-0.5">TX: {p.transactionId}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
