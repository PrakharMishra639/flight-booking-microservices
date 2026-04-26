import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, Terminal, AlertCircle, Database, Calendar } from 'lucide-react';
import adminService from '../../redux/services/adminService';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';
import Pagination from '../Common/Pagination'; // PAGINATION helper
import  { getSocket } from '../../utils/socket';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // PAGINATION and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const itemsPerPage = 50; // Increased limit for logs

  useEffect(() => {
    fetchStructuredLogs();
    
    // Connect to WebSockets for real-time log streaming
    const socket = getSocket();
    
    const handleNewLog = (newLog) => {
      // Prepend the new log if it matches current filters
      setLogs(prevLogs => {
        // Skip adding if it doesn't match active filters
        if (categoryFilter && newLog.category !== categoryFilter) return prevLogs;
        if (levelFilter && newLog.level !== levelFilter) return prevLogs;
        
        // Remove the oldest log if we exceed itemsPerPage to avoid memory bloat
        const updatedLogs = [newLog, ...prevLogs];
        if (updatedLogs.length > itemsPerPage) updatedLogs.pop();
        
        return updatedLogs;
      });
      setTotalLogs(prev => prev + 1);
    };

    socket.on('new_system_log', handleNewLog);

    return () => {
      socket.off('new_system_log', handleNewLog);
    };
  }, [currentPage, categoryFilter, levelFilter]);

  const fetchStructuredLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(categoryFilter && { category: categoryFilter }),
        ...(levelFilter && { level: levelFilter })
      };
      
      const data = await adminService.getStructuredLogs(params);
      
      // Checking for the structured format from LogService
      if (data && data.logs) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
        setTotalLogs(data.pagination.total);
      } else {
        // Fallback for unexpected data formats
        setLogs([]);
        setTotalLogs(0);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch structured system logs. Make sure to seed or generate some traffic!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelStyle = (level) => {
    switch(level?.toLowerCase()) {
      case 'error': return 'text-red-500 bg-red-50 border-red-100';
      case 'warn': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'info': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">Structured System Logs</h2>
          <p className="text-slate-500 font-medium">Categorized application health monitoring</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <select 
            value={categoryFilter} 
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 uppercase tracking-widest text-xs focus:ring-2 focus:ring-primary/20"
          >
            <option value="">ALL CATEGORIES</option>
            <option value="system">SYSTEM</option>
            <option value="error">ERROR</option>
            <option value="booking">BOOKING</option>
            <option value="payment">PAYMENT</option>
            <option value="flights">FLIGHTS</option>
            <option value="users">USERS</option>
          </select>
          
          <select 
            value={levelFilter} 
            onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 uppercase tracking-widest text-xs focus:ring-2 focus:ring-primary/20"
          >
            <option value="">ALL LEVELS</option>
            <option value="info">INFO</option>
            <option value="warn">WARNING</option>
            <option value="error">ERROR</option>
          </select>

          <button 
            onClick={() => { setCurrentPage(1); fetchStructuredLogs(); }}
            disabled={loading}
            className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-primary transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <Alert message={error} type="error" />

      <div className="relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <input 
          type="text" 
          placeholder="Refine visible logs by message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[2rem] font-bold text-slate-900 shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] w-48">Timestamp</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] w-32">Level</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] w-40">Category</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Message / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <Loader />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400">
                    <Terminal className="h-10 w-10 mx-auto opacity-20 mb-3" />
                    <p className="font-bold">No log entries found for this criteria.</p>
                  </td>
                </tr>
              ) : filteredLogs.map((log, index) => (
                <tr key={log._id || index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4 align-top">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-mono font-black text-slate-900">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 align-top">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getLevelStyle(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-8 py-4 align-top">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm align-top">
                    <p className="font-bold text-slate-800 break-words">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-2 text-[10px] font-mono bg-slate-900 border-l-2 border-primary text-slate-300 p-2 rounded-lg overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION usage */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-500">
                  <Database className="h-6 w-6" />
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Indexed Logs</p>
                  <p className="text-xl font-black text-slate-900">{totalLogs.toLocaleString()}</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-500">
                  <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Polling Status</p>
                  <p className="text-sm font-bold text-slate-900">Real-time WebSocket connection active</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-2xl text-red-500">
                  <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Persistence</p>
                  <p className="text-sm font-bold text-slate-900">MongoDB /logs</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default LogsPage;

