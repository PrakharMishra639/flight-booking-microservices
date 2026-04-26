import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, Search, X, MapPin } from 'lucide-react';
import adminService from '../../redux/services/adminService';
import { setAirports, setLoading, setError } from '../../redux/slices/adminSlice';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';

const AirportsPage = () => {
  const dispatch = useDispatch();
  const { airports, loading, error } = useSelector((state) => state.admin);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAirport, setCurrentAirport] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', code: '', city: '', country: '', latitude: '', longitude: '', timezone: '', terminal_count: 1 
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAirports();
  }, [dispatch, page, search]);

  const fetchAirports = async () => {
    dispatch(setLoading(true));
    try {
      const data = await adminService.getAirports({ page, limit: 10, search });
      dispatch(setAirports(data.data || []));
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentAirport) {
        await adminService.updateAirport(currentAirport.airport_id, formData);
      } else {
        await adminService.createAirport(formData);
      }
      setIsModalOpen(false);
      fetchAirports();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this airport? This may affect existing schedules.')) {
      try {
        await adminService.deleteAirport(id);
        fetchAirports();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">Airport Infrastructure</h2>
          <p className="text-slate-500 font-medium">Manage global travel hubs</p>
        </div>
        <button 
          onClick={() => { setCurrentAirport(null); setFormData({ name: '', code: '', city: '', country: '', latitude: '', longitude: '', timezone: 'GMT', terminal_count: 1 }); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add Hub
        </button>
      </div>

      <Alert message={error} type="error" />

      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <input
          type="text"
          placeholder="Search by Airport Name, Code or City..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader /></div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Code / Name</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">City</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Coordinates</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {airports.map((airport) => (
                <tr key={airport.airport_id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 tracking-wider">[{airport.code}]</span>
                      <span className="text-sm font-bold text-slate-500">{airport.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-700">{airport.city}, {airport.country}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl w-fit">
                      <MapPin className="h-3 w-3 text-primary" />
                      {airport.latitude}, {airport.longitude}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button 
                      onClick={() => { setCurrentAirport(airport); setFormData(airport); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(airport.airport_id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-white rounded-xl text-sm font-bold disabled:opacity-50 text-slate-700 shadow-sm transition-all hover:shadow-md"
            >
              Previous
            </button>
            <span className="text-sm font-bold text-slate-500">Page {page} of {totalPages}</span>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-white rounded-xl text-sm font-bold disabled:opacity-50 text-slate-700 shadow-sm transition-all hover:shadow-md"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-heading font-black text-slate-900 tracking-tight">{currentAirport ? 'Edit Hub' : 'New Hub'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Airport Name</label>
                <input 
                  type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. Indira Gandhi International"
                />
              </div>
              <div className="space-y-2 col-span-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">IATA Code</label>
                <input 
                  type="text" required maxLength={3} value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all font-mono tracking-widest uppercase"
                  placeholder="DEL"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                <input 
                  type="text" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                <input 
                  type="text" required value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                <input 
                  type="number" step="any" required value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                <input 
                  type="number" step="any" required value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Timezone (e.g. GMT+5:30)</label>
                <input 
                  type="text" required value={formData.timezone} onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Terminals</label>
                <input 
                  type="number" required value={formData.terminal_count} onChange={(e) => setFormData({...formData, terminal_count: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button 
                type="submit"
                className="col-span-2 bg-slate-900 hover:bg-primary text-white py-4 mt-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-[0.98]"
              >
                {currentAirport ? 'Update Destination' : 'Activate Hub'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirportsPage;
