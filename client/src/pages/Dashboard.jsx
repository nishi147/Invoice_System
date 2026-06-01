import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Scale, 
  FileClock, 
  ArrowUpRight, 
  Users 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import api from '../services/api.js';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/dashboard-stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  const { summary, chartData, statusCounts } = stats || {
    summary: {
      totalRevenue: 0,
      currentMonthRevenue: 0,
      revenueGrowthPercent: 0,
      outstandingAmount: 0,
      totalOverdueAmount: 0,
      unpaidInvoiceCount: 0,
      totalExpenses: 0,
      currentMonthExpenses: 0,
      expenseBreakdown: {},
      netProfit: 0,
      profitMarginPercent: 0,
      averageMonthlyRevenue: 0,
    },
    chartData: [],
    statusCounts: [],
  };

  const currencySymbol = '₹';

  // Format currency helper
  const formatCurrency = (val) => `${currencySymbol}${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const topCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue),
      subtext: `This month: ${formatCurrency(summary.currentMonthRevenue)}`,
      badge: {
        text: `${summary.revenueGrowthPercent >= 0 ? '+' : ''}${summary.revenueGrowthPercent.toFixed(1)}%`,
        isPositive: summary.revenueGrowthPercent >= 0,
      },
      icon: <DollarSign className="h-6 w-6 text-emerald-500" />,
      bg: 'from-emerald-500/10 to-teal-500/5',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(summary.outstandingAmount),
      subtext: `Overdue: ${formatCurrency(summary.totalOverdueAmount)}`,
      badge: {
        text: `${summary.unpaidInvoiceCount} unpaid`,
        isPositive: false,
        neutral: true,
      },
      icon: <FileClock className="h-6 w-6 text-amber-500" />,
      bg: 'from-amber-500/10 to-orange-500/5',
      border: 'border-amber-500/20',
    },
    {
      title: 'Operating Expenses',
      value: formatCurrency(summary.totalExpenses),
      subtext: `This month: ${formatCurrency(summary.currentMonthExpenses)}`,
      badge: {
        text: 'Cash Outflow',
        isPositive: false,
        neutral: true,
      },
      icon: <Receipt className="h-6 w-6 text-rose-500" />,
      bg: 'from-rose-500/10 to-pink-500/5',
      border: 'border-rose-500/20',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(summary.netProfit),
      subtext: `Profit Margin: ${summary.profitMarginPercent.toFixed(1)}%`,
      badge: {
        text: `${summary.profitMarginPercent >= 15 ? 'Healthy' : 'Stabilized'}`,
        isPositive: summary.profitMarginPercent >= 15,
      },
      icon: <Scale className="h-6 w-6 text-indigo-500" />,
      bg: 'from-indigo-500/10 to-brand-500/5',
      border: 'border-indigo-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome and banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-outfit text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl">
            Financial Health Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time operations summary, tax deductions, and cash flow reports.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.bg} p-6 shadow-md backdrop-blur-sm dark:bg-slate-900 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className="rounded-xl bg-white p-2 dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
                {card.icon}
              </div>
            </div>
            <div className="mt-4">
              <span className="font-outfit text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
                {card.value}
              </span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {card.subtext}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                  card.badge.neutral 
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : card.badge.isPositive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                }`}>
                  {card.badge.text}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue vs Expense Area Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h3 className="font-outfit text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Revenue vs Expenses Comparison
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                  formatter={(val) => [`${currencySymbol}${val.toLocaleString()}`, undefined]}
                />
                <Legend iconType="circle" fontSize={12} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice Status Donut Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-outfit text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Invoice Status Distribution
          </h3>
          <div className="h-72 flex flex-col items-center justify-center">
            {statusCounts.every(item => item.value === 0) ? (
              <p className="text-slate-400 text-xs py-8">No invoice records found</p>
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusCounts}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Invoices`, 'Volume']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs">
                  {statusCounts.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-600 dark:text-slate-400">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Revenue Trend Line Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-outfit text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Monthly Profit Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }} />
                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-outfit text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Expense Breakdown by Category
          </h3>
          <div className="h-64">
            {Object.keys(summary.expenseBreakdown).length === 0 || Object.values(summary.expenseBreakdown).every(val => val === 0) ? (
              <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                No operating expenses logged yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(summary.expenseBreakdown).map(([name, value]) => ({ name, value }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                    formatter={(value) => [formatCurrency(value), 'Amount']}
                  />
                  <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]}>
                    {Object.entries(summary.expenseBreakdown).map((entry, index) => {
                      const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#64748b'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
