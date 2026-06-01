import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Ban, 
  Trash2, 
  Eye, 
  Calendar, 
  X,
  FileText 
} from 'lucide-react';
import api from '../services/api.js';

const Invoices = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // States
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
        status,
        startDate,
        endDate,
      };

      const res = await api.get('/invoices', { params });
      if (res.data.success) {
        setInvoices(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, status, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    // Fetch directly after resetting
    setTimeout(fetchInvoices, 50);
  };

  const handleDuplicate = async (id) => {
    if (!window.confirm('Are you sure you want to duplicate this invoice?')) return;
    try {
      const res = await api.post(`/invoices/${id}/duplicate`);
      if (res.data.success) {
        alert('Invoice duplicated successfully! Directing to new draft...');
        navigate(`/invoices/edit/${res.data.data._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Duplication failed');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      const res = await api.post(`/invoices/${id}/cancel`);
      if (res.data.success) {
        alert('Invoice cancelled successfully');
        fetchInvoices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this invoice? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/invoices/${id}`);
      if (res.data.success) {
        alert('Invoice deleted successfully');
        fetchInvoices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  const getStatusBadge = (invoiceStatus) => {
    switch (invoiceStatus) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50';
      case 'partially_paid':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50';
      case 'sent':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50';
      case 'viewed':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200/50';
      case 'overdue':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50';
      case 'cancelled':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300/30';
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50'; // draft
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-outfit text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl">
            Invoices Ledger
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, search, filter, and execute billing workflows.
          </p>
        </div>
        <Link
          to="/invoices/create"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Link>
      </div>

      {/* Filters card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSearchSubmit} className="grid gap-4 md:grid-cols-5 items-end">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Search Invoice
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Number, client name or company..."
                className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none transition-all focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
            >
              <option value="" className="dark:bg-slate-900">All Statuses</option>
              <option value="draft" className="dark:bg-slate-900">Draft</option>
              <option value="sent" className="dark:bg-slate-900">Sent</option>
              <option value="viewed" className="dark:bg-slate-900">Viewed</option>
              <option value="partially_paid" className="dark:bg-slate-900">Partially Paid</option>
              <option value="paid" className="dark:bg-slate-900">Paid</option>
              <option value="overdue" className="dark:bg-slate-900">Overdue</option>
              <option value="cancelled" className="dark:bg-slate-900">Cancelled</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none transition-all focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 text-xs outline-none transition-all focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
            />
          </div>
        </form>

        {/* Clear filter triggers */}
        {(search || status || startDate || endDate) && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="h-3 w-3" /> Clear Active Filters
            </button>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="text-sm">No invoices found matching selection criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Client / Company</th>
                  <th className="p-4">Billing Date</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Grand Total</th>
                  <th className="p-4 text-right">Balance Due</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-200">{inv.invoiceNumber}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-300">
                        {inv.clientDetailsSnapshot?.name || inv.client?.name || 'N/A'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {inv.clientDetailsSnapshot?.company || inv.client?.company || 'N/A'}
                      </p>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right font-semibold text-slate-850 dark:text-slate-200">
                      {inv.currency} {inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900 dark:text-slate-300">
                      {inv.currency} {inv.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(inv.status)}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View */}
                        <button
                          onClick={() => navigate(`/invoices/${inv._id}`)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(inv._id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Duplicate Invoice"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        {/* Cancel */}
                        {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                          <button
                            onClick={() => handleCancel(inv._id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-755 dark:text-slate-400 dark:hover:bg-slate-800"
                            title="Cancel Invoice"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete */}
                        {user && user.role === 'super_admin' && (
                          <button
                            onClick={() => handleDelete(inv._id)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/20"
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-850">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
