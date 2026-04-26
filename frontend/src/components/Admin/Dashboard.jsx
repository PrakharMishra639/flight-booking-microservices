import { useState, useEffect } from 'react';
import { LayoutDashboard, Plane, Ticket, Wallet } from 'lucide-react';
import adminService from '../../redux/services/adminService';
import { formatCurrency } from '../../utils/helpers';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartFilter, setChartFilter] = useState('7days');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Generate mock data based on selected filter
  const getChartData = () => {
    switch (chartFilter) {
      case '15days':
        return {
          labels: Array.from({length: 15}, (_, i) => `Day ${i+1}`),
          data: Array.from({length: 15}, () => Math.floor(Math.random() * 20000) + 10000),
        };
      case '30days':
        return {
          labels: Array.from({length: 30}, (_, i) => `Day ${i+1}`),
          data: Array.from({length: 30}, () => Math.floor(Math.random() * 20000) + 10000),
        };
      case 'monthly':
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          data: [150000, 180000, 160000, 210000, 240000, 290000, 310000, 330000, 280000, 350000, 400000, 450000],
        };
      case 'yearly':
        return {
          labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
          data: [1200000, 1800000, 1600000, 2100000, 2400000, 3100000, 3900000],
        };
      case '7days':
      default:
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          data: [12500, 18200, 15300, 22100, 24500, 31000, 33278],
        };
    }
  };

  const currentChartData = getChartData();
  const revenueChartData = {
    labels: currentChartData.labels,
    datasets: [
      {
        label: 'Revenue',
        data: currentChartData.data,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#10b981',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 13, family: "'Inter', sans-serif" },
        bodyFont: { size: 14, family: "'Inter', sans-serif" },
        displayColors: false,
        callbacks: {
          label: (context) => formatCurrency(context.parsed.y)
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: true, color: '#f1f5f9', drawBorder: false },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } }
      }
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader /></div>;

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">System Overview</h2>
        <p className="text-slate-500 font-medium mt-1">Real-time statistics and platform health</p>
      </div>

      <Alert message={error} type="error" />

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Revenue Widget */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-emerald-50 text-emerald-500 p-4 rounded-2xl">
                <Wallet className="w-7 h-7" />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-3xl font-heading font-black text-slate-900 tracking-tight">{formatCurrency(stats.revenue?.total || 0)}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Today</span>
              <span className="text-sm font-bold text-slate-600">{formatCurrency(stats.revenue?.today || 0)}</span>
            </div>
          </div>

          {/* Bookings Widget */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-blue-50 text-blue-500 p-4 rounded-2xl">
                <Ticket className="w-7 h-7" />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Bookings</p>
            <p className="text-3xl font-heading font-black text-slate-900 tracking-tight">{stats.bookings?.total || 0}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-slate-600">{stats.bookings?.confirmed} Fixed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold text-slate-600">{stats.bookings?.pending} Wait</span>
              </div>
            </div>
          </div>

          {/* Active Flights */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-purple-50 text-purple-500 p-4 rounded-2xl">
                <Plane className="w-7 h-7" />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active Flights</p>
            <p className="text-3xl font-heading font-black text-slate-900 tracking-tight">{stats.flights?.active || 0}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold text-slate-600">{stats.flights?.delayed} Delayed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs font-bold text-slate-600">{stats.flights?.cancelled} Off</span>
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-orange-50 text-orange-500 p-4 rounded-2xl">
                <LayoutDashboard className="w-7 h-7" />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
            <p className="text-3xl font-heading font-black text-slate-900 tracking-tight">{stats.users?.total || 0}</p>
            <div className="mt-4 pt-4 border-t border-slate-50">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase mr-2">Active</span>
              <span className="text-sm font-bold text-slate-600">{stats.users?.active} Members</span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Chart Section */}
      {stats && (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 mb-12 overflow-x-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-heading font-black text-slate-900 tracking-tight">Revenue Trends</h3>
              <p className="text-sm font-medium text-slate-500">Performance overview</p>
            </div>
            <select
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value)}
              className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="7days">Last 7 Days</option>
              <option value="15days">Last 15 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
