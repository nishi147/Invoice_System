import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  FileCheck, 
  Receipt, 
  Download, 
  Calendar 
} from 'lucide-react';
import api from '../services/api.js';

const Expenses = () => {
  const { user } = useSelector((state) => state.auth);

  // States
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form States
  const [title, setTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Other');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  const categories = ['Salaries', 'Marketing', 'Software', 'Office', 'Travel', 'Utilities', 'Other'];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, search, category };
      const res = await api.get('/expenses', { params });
      if (res.data.success) {
        setExpenses(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setTitle('');
    setExpenseCategory('Other');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Card');
    setVendor('');
    setNotes('');
    setReceiptFile(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (exp) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setExpenseCategory(exp.category);
    setAmount(exp.amount.toString());
    setDate(new Date(exp.date).toISOString().split('T')[0]);
    setPaymentMethod(exp.paymentMethod);
    setVendor(exp.vendor || '');
    setNotes(exp.notes || '');
    setReceiptFile(null);
    setShowModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount) {
      alert('Title and amount are required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', expenseCategory);
      formData.append('amount', amount);
      formData.append('date', date);
      formData.append('paymentMethod', paymentMethod);
      formData.append('vendor', vendor);
      formData.append('notes', notes);
      
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      let res;
      if (editingExpense) {
        res = await api.put(`/expenses/${editingExpense._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/expenses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        alert(editingExpense ? 'Expense updated!' : 'Expense recorded!');
        setShowModal(false);
        fetchExpenses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.data.success) {
        alert('Expense record deleted successfully');
        fetchExpenses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  const currencySymbol = '₹';

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-outfit text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl">
            Operating Expenditures
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Log vendor outflows, attach receipts, and categorize operations.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Record Expense
        </button>
      </div>

      {/* Filter and Category row */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Category filtering tags */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setCategory(''); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              category === '' 
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === c 
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor or title..."
              className="w-full rounded-xl border border-slate-200 bg-transparent py-2 pl-10 pr-4 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500 md:w-56"
            />
          </div>
        </form>
      </div>

      {/* Expenses list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
            <Receipt className="h-10 w-10 text-slate-300" />
            <p className="text-sm">No expenses logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                  <th className="p-4">Date</th>
                  <th className="p-4">Expense Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Method</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Receipt</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-slate-850 dark:text-slate-200">
                      {exp.title}
                      {exp.notes && <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{exp.notes}</span>}
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-650 dark:bg-slate-800 dark:text-slate-350">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-650 dark:text-slate-350">{exp.vendor || '-'}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{exp.paymentMethod}</td>
                    <td className="p-4 text-right font-bold text-rose-650 dark:text-rose-400">
                      {currencySymbol}{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      {exp.receiptUrl ? (
                        <a
                          href={exp.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-[10px] font-semibold text-brand-600 dark:text-brand-400"
                        >
                          <Download className="h-3 w-3" /> View
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">None</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Edit Record"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {user && user.role !== 'staff' && (
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/20"
                            title="Delete Record"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-850">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 mb-4">
              <h3 className="font-outfit text-base font-bold text-slate-800 dark:text-slate-100">
                {editingExpense ? 'Edit Expense Record' : 'Record Operating Expense'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 font-semibold mb-1.5">Expense Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Cloud Invoice May"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Category *</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="dark:bg-slate-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Expense Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  >
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Vendor / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Services"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Receipt Attachment (PDF/Image)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files[0])}
                    className="w-full text-xs text-slate-550 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-350 cursor-pointer"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 font-semibold mb-1.5">Expense Notes</label>
                  <input
                    type="text"
                    placeholder="Enter short details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
