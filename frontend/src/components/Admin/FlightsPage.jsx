import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, X, Plane } from 'lucide-react';
import adminService from '../../redux/services/adminService';
import { setFlights, setAirlines, setLoading, setError } from '../../redux/slices/adminSlice';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';

const FlightsPage = () => {
  const dispatch = useDispatch();
  const { flights, airlines, loading, error } = useSelector((state) => state.admin);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFlight, setCurrentFlight] = useState(null);
  const [formData, setFormData] = useState({ 
    flight_no: '', airline_id: '', aircraft_type: '', seat_capacity: 180, base_price: 0, status: 'ACTIVE' 
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [dispatch, page, search]);

  const fetchData = async () => {
    dispatch(setLoading(true));
    try {
      const [flightsRes, airlinesData] = await Promise.all([
        adminService.getFlights({ page, limit: 10, search }),
        adminService.getAirlines()
      ]);
      dispatch(setFlights(flightsRes.data || []));
      dispatch(setAirlines(airlinesData || []));
      setTotalPages(flightsRes.totalPages || 1);
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, airline_id: parseInt(formData.airline_id) };
      if (currentFlight) {
        await adminService.updateFlight(currentFlight.flight_id, payload);
      } else {
        await adminService.createFlight(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this flight?')) {
      try {
        await adminService.deleteFlight(id);
        fetchData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">Fleet Asset Manager</h2>
          <p className="text-slate-500 font-medium">Manage aircraft and flight numbers</p>
        </div>
        <button 
          onClick={() => { setCurrentFlight(null); setFormData({ flight_no: '', airline_id: airlines[0]?.airline_id || '', aircraft_type: 'Airbus A320', seat_capacity: 180, base_price: 3000, status: 'ACTIVE' }); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add Asset
        </button>
      </div>

      <Alert message={error} type="error" />

      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <input
          type="text"
          placeholder="Search by Flight Number..."
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
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Flight Number</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Airline</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Aircraft</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Capacity</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {flights.map((flight) => (
                <tr key={flight.flight_id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-xl">
                        <Plane className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="font-black text-slate-900 tracking-widest uppercase">{flight.flight_no}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-600">{flight.Airline?.name || 'Unknown'}</span>
                  </td>
                  <td className="px-8 py-5 font-medium text-slate-500 italic">{flight.aircraft_type}</td>
                  <td className="px-8 py-5">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black tracking-widest">{flight.seat_capacity} SEATS</span>
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button 
                      onClick={() => { setCurrentFlight(flight); setFormData(flight); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(flight.flight_id)}
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
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-heading font-black text-slate-900 tracking-tight">{currentFlight ? 'Modify Flight' : 'Register New Flight'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Flight No</label>
                  <input 
                    type="text" required value={formData.flight_no} onChange={(e) => setFormData({...formData, flight_no: e.target.value.toUpperCase()})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all font-mono tracking-widest"
                    placeholder="AF101"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Airline</label>
                  <select 
                    required value={formData.airline_id} onChange={(e) => setFormData({...formData, airline_id: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="">Select Carrier</option>
                    {airlines.map(a => <option key={a.airline_id} value={a.airline_id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Aircraft Model</label>
                <input 
                  type="text" required value={formData.aircraft_type} onChange={(e) => setFormData({...formData, aircraft_type: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. Boeing 787 Dreamliner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total Capacity</label>
                  <input 
                    type="number" required value={formData.seat_capacity} onChange={(e) => setFormData({...formData, seat_capacity: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Base Price (Global)</label>
                  <input 
                    type="number" required value={formData.base_price} onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Global Status</label>
                <select 
                  value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="ACTIVE">OPERATIONAL</option>
                  <option value="MAINTENANCE">GROUNDED / MAINTENANCE</option>
                  <option value="RETIRED">DECOMMISSIONED</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-primary text-white py-4 mt-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-[0.98]"
              >
                {currentFlight ? 'Confirm Modifications' : 'Commit Fleet Asset'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightsPage;
