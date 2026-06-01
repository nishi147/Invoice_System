import React, { useState, useEffect } from 'react';
import { History, ShieldAlert } from 'lucide-react';
import api from '../services/api.js';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: { page, limit: 20 }
      });
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  if (loading && page === 1) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-outfit text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
          <History className="h-6 w-6 text-brand-600" />
          System Audit Logs
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Compliance logs tracking all write operations, payments, creations, and authentication actions.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden text-xs">
        {logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-450 gap-2">
            <ShieldAlert className="h-8 w-8 text-slate-300" />
            <p>No audit events logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                  <th className="p-4 pl-5">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Triggered By</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 font-mono text-[11px]">
                    <td className="p-4 pl-5 text-slate-450">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block rounded px-2 py-0.5 font-bold uppercase ${
                        log.action.includes('FAILED')
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20'
                          : log.action.includes('DELETE') || log.action.includes('CANCEL')
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-650 dark:text-slate-350">
                      {log.userName ? (
                        <div>
                          <p className="font-bold">{log.userName}</p>
                          <p className="text-[9px] text-slate-400 font-normal">{log.userEmail}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Anonymous / System</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-sans max-w-xs break-words">{log.details}</td>
                    <td className="p-4 text-slate-400">{log.ipAddress || '-'}</td>
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
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-sans font-semibold hover:bg-slate-50 dark:border-slate-800 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-sans font-semibold hover:bg-slate-50 dark:border-slate-800 disabled:opacity-50"
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

export default AuditLogs;
