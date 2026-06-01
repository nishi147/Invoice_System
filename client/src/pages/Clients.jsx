import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  Building2, 
  Mail, 
  Phone 
} from 'lucide-react';
import api from '../services/api.js';

const Clients = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // States
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('India');

  // Fetch Clients
  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients', {
        params: { page, limit: 10, search }
      });
      if (res.data.success) {
        setClients(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchClients();
  };

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setGst('');
    setStreet('');
    setCity('');
    setState('');
    setZip('');
    setCountry('India');
    setShowModal(true);
  };

  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company);
    setEmail(client.email);
    setPhone(client.phone || '');
    setGst(client.gstNumber || '');
    setStreet(client.address?.street || '');
    setCity(client.address?.city || '');
    setState(client.address?.state || '');
    setZip(client.address?.zipCode || '');
    setCountry(client.address?.country || 'India');
    setShowModal(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!name || !company || !email) {
      alert('Name, Company and Email are required');
      return;
    }

    try {
      const clientData = {
        name,
        company,
        email,
        phone,
        gstNumber: gst,
        address: { street, city, state, zipCode: zip, country }
      };

      let res;
      if (editingClient) {
        res = await api.put(`/clients/${editingClient._id}`, clientData);
      } else {
        res = await api.post('/clients', clientData);
      }

      if (res.data.success) {
        alert(editingClient ? 'Client updated!' : 'Client added!');
        setShowModal(false);
        fetchClients();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save client');
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      const res = await api.delete(`/clients/${id}`);
      if (res.data.success) {
        alert('Client deleted successfully');
        fetchClients();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-outfit text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl">
            Client Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Store clients details, view financial summaries, and track transactions.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Filter and Search row */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-lg">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name, email, or company..."
              className="w-full rounded-xl border border-slate-200 bg-transparent py-2 px-10 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
            <Building2 className="h-10 w-10 text-slate-350" />
            <p className="text-sm">No client contacts registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                  <th className="p-4">Client Contact</th>
                  <th className="p-4">Company Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">GST Number</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-200">{client.name}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-300">{client.company}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {client.email}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {client.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {client.phone}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-550 dark:text-slate-300">{client.gstNumber || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/clients/${client._id}`)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleOpenEditModal(client)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Edit Client"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {user && user.role !== 'staff' && (
                          <button
                            onClick={() => handleDeleteClient(client._id)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/20"
                            title="Delete Client"
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
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 mb-4">
              <h3 className="font-outfit text-base font-bold text-slate-850 dark:text-slate-100">
                {editingClient ? 'Edit Client Profile' : 'Add New Client Contact'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Contact Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp Inc"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 font-semibold mb-1.5">GST Registration Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Address sub-block */}
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800 space-y-3">
                <span className="font-semibold text-slate-700 dark:text-slate-350 block uppercase tracking-wider text-[10px]">
                  Billing Address Address
                </span>
                
                <div>
                  <label className="block text-slate-500 mb-1.5">Street Details</label>
                  <input
                    type="text"
                    placeholder="e.g. 456 Main St, Office Suite 3B"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                  />
                </div>
                
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1.5">City</label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3 outline-none focus:border-brand-500 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1.5">State</label>
                    <input
                      type="text"
                      placeholder="Delhi"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-2 outline-none focus:border-brand-500 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1.5">ZIP Code</label>
                    <input
                      type="text"
                      placeholder="110001"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-2 outline-none focus:border-brand-500 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
