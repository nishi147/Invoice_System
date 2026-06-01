import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ShieldAlert, UserCheck, UserMinus, ShieldCheck } from 'lucide-react';
import api from '../services/api.js';

const Users = () => {
  const { user: currentUser } = useSelector((state) => state.auth);

  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/auth/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        alert(`User role updated to ${newRole}`);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/auth/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        alert(`User account is now ${newStatus}`);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
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
          User Administration
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage system staff accounts, assign roles, and activate/deactivate accounts.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden text-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
              <th className="p-4">User Details</th>
              <th className="p-4">Email</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4">Account Status</th>
              <th className="p-4">Created Date</th>
              <th className="p-4 text-center">Toggle status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 uppercase">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-850 dark:text-slate-200 block">{u.name}</span>
                      {currentUser?._id === u._id && (
                        <span className="text-[9px] text-brand-600 dark:text-brand-400 font-semibold mt-0.5 block">You (Active Session)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-450">{u.email}</td>
                <td className="p-4">
                  <select
                    disabled={currentUser?._id === u._id}
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-transparent py-1.5 px-2.5 outline-none focus:border-brand-500 dark:border-slate-800 disabled:opacity-50"
                  >
                    <option value="staff">Staff</option>
                    <option value="accountant">Accountant</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="p-4">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                    u.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-slate-450">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-center">
                  <button
                    disabled={currentUser?._id === u._id}
                    onClick={() => handleStatusToggle(u._id, u.status)}
                    className={`rounded-lg p-2 transition-colors ${
                      u.status === 'active'
                        ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                        : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                    } disabled:opacity-30`}
                    title={u.status === 'active' ? 'Deactivate User' : 'Activate User'}
                  >
                    {u.status === 'active' ? <UserMinus className="h-4. w-4" /> : <UserCheck className="h-4. w-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
