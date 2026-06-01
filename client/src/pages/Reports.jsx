import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Clock, 
  Receipt, 
  TrendingUp, 
  ShieldAlert 
} from 'lucide-react';

const Reports = () => {
  const [downloading, setDownloading] = useState(null);

  const reportTypes = [
    {
      id: 'revenue',
      title: 'Revenue Audit Report',
      description: 'Granular log of all cash receipts, billing transaction IDs, invoice numbers, and paying client details.',
      icon: <TrendingUp className="h-6 w-6 text-emerald-500" />,
      bg: 'from-emerald-500/10 to-teal-500/5',
      border: 'border-emerald-500/20',
    },
    {
      id: 'expenses',
      title: 'Operating Expenses Report',
      description: 'Aggregated breakdowns of all categorized corporate spending, payment channels, vendors, and notes.',
      icon: <Receipt className="h-6 w-6 text-rose-500" />,
      bg: 'from-rose-500/10 to-pink-500/5',
      border: 'border-rose-500/20',
    },
    {
      id: 'pandl',
      title: 'Profit & Loss Statement',
      description: 'Comparative monthly ledger tracking cash inflows (paid invoices) against operating costs (expenses).',
      icon: <BarChart3 className="h-6 w-6 text-indigo-500" />,
      bg: 'from-indigo-500/10 to-brand-500/5',
      border: 'border-indigo-500/20',
    },
    {
      id: 'tax',
      title: 'Tax & GST Deductions',
      description: 'Historical summary tracking item GST collections and TDS withholdings from generated invoices.',
      icon: <FileSpreadsheet className="h-6 w-6 text-sky-500" />,
      bg: 'from-sky-500/10 to-blue-500/5',
      border: 'border-sky-500/20',
    },
    {
      id: 'outstanding',
      title: 'Accounts Receivable Report',
      description: 'Detailed roster of unpaid or overdue client balances, days past due date, and contact listings.',
      icon: <Clock className="h-6 w-6 text-amber-500" />,
      bg: 'from-amber-500/10 to-orange-500/5',
      border: 'border-amber-500/20',
    },
  ];

  const handleExport = async (type, format) => {
    const loaderId = `${type}-${format}`;
    setDownloading(loaderId);
    try {
      const url = `/api/reports/export?type=${type}&format=${format}`;
      
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `report_${type}_${Date.now()}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      console.error('Failed to trigger export download:', err);
      alert('Error triggering export download');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-outfit text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl">
          Financial Exporter Center
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generate and download operational reports to CSV or Microsoft Excel spreadsheets.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className={`rounded-2xl border ${report.border} bg-gradient-to-br ${report.bg} p-6 shadow-sm dark:bg-slate-900 flex flex-col justify-between gap-5 transition-all hover:shadow-md`}
          >
            <div className="flex gap-4 items-start">
              <div className="rounded-xl bg-white p-2.5 dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                {report.icon}
              </div>
              <div>
                <h3 className="font-outfit text-sm font-bold text-slate-800 dark:text-slate-100">
                  {report.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {report.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                onClick={() => handleExport(report.id, 'xlsx')}
                disabled={downloading !== null}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                {downloading === `${report.id}-xlsx` ? (
                  <div className="h-4. w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4 text-slate-400" />
                )}
                Excel Spreadsheet (.xlsx)
              </button>

              <button
                onClick={() => handleExport(report.id, 'csv')}
                disabled={downloading !== null}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                {downloading === `${report.id}-csv` ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4 text-slate-400" />
                )}
                CSV Format (.csv)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Box */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50 flex gap-3 text-xs text-slate-500 leading-relaxed max-w-2xl">
        <ShieldAlert className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-350">Regulatory Notice:</span>
          <p className="mt-0.5">
            Spreadsheets compiled by the exporter align with double-entry accounting structures. Confirm calculations and GST reports with your chartered accountant before filling tax forms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
