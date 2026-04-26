import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, X, Clock, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';
import adminService from '../../redux/services/adminService';
import { setSchedules, setFlights, setAirports, setLoading, setError } from '../../redux/slices/adminSlice';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';
import { formatTime, formatDate } from '../../utils/helpers';

const SchedulesPage = () => {
  const dispatch = useDispatch();
  const { schedules, flights, airports, loading, error } = useSelector((state) => state.admin);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);

  const [flightSearchTerm, setFlightSearchTerm] = useState('');
  const [showFlightDropdown, setShowFlightDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowFlightDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleFlightSearchChange = (e) => {
    const val = e.target.value;
    setFlightSearchTerm(val);
    setShowFlightDropdown(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await adminService.getFlights({ search: val, limit: 10 });
        dispatch(setFlights(res.data || res || []));
      } catch (err) {
        console.error(err);
      }
    }, 400);
  };

  const [formData, setFormData] = useState({
    flight_id: '', source_airport_id: '', dest_airport_id: '',
    departure_time: '', arrival_time: '', base_price: 3000, status: 'SCHEDULED'
  });

  const [statusData, setStatusData] = useState({ status: 'SCHEDULED', delayMinutes: 0 });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [dispatch, page, search]);

  const fetchData = async () => {
    dispatch(setLoading(true));
    try {
      const [schedulesRes, flightsRes, airportsRes] = await Promise.all([
        adminService.getSchedules({ page, limit: 10, search }),
        adminService.getFlights({ limit: 100 }),
        adminService.getAirports({ limit: 100 })
      ]);
      dispatch(setSchedules(schedulesRes.data || schedulesRes || []));
      dispatch(setFlights(flightsRes.data || flightsRes || []));
      dispatch(setAirports(airportsRes.data || airportsRes || []));
      setTotalPages(schedulesRes.totalPages || 1);
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.flight_id) {
      alert("Validation Error: Please select a valid Flight Number from the dropdown.");
      return;
    }

    // Validation: Source and Destination cannot be the same
    if (formData.source_airport_id === formData.dest_airport_id) {
      alert("Operational Conflict: Origin and Destination airports cannot be identical.");
      return;
    }

    // Validation: Arrival must be after departure
    const depTime = new Date(formData.departure_time);
    const arrTime = new Date(formData.arrival_time);
    if (arrTime <= depTime) {
      alert("Schedule Error: Arrival time must be after the departure time.");
      return;
    }

    // Ensure numeric types are sent
    const payload = {
      ...formData,
      flight_id: parseInt(formData.flight_id),
      source_airport_id: parseInt(formData.source_airport_id),
      dest_airport_id: parseInt(formData.dest_airport_id),
      base_price: parseFloat(formData.base_price)
    };

    try {
      if (currentSchedule) {
        await adminService.updateSchedule(currentSchedule.schedule_id, payload);
      } else {
        await adminService.createSchedule(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateFlightStatus(currentSchedule.schedule_id, statusData.status, statusData.delayMinutes);
      setIsStatusModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('WARNING: Deleting a schedule will cancel all associated bookings and delete assigned seats. Proceed?')) {
      try {
        await adminService.deleteSchedule(id);
        fetchData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON-TIME': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'DELAYED': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
      case 'LANDED': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">Active Flight Schedules</h2>
          <p className="text-slate-500 font-medium">Manage departures, arrivals, and status updates</p>
        </div>
        <button
          onClick={() => { setCurrentSchedule(null); setFormData({ flight_id: '', source_airport_id: '', dest_airport_id: '', departure_time: '', arrival_time: '', base_price: 3500, status: 'SCHEDULED' }); setFlightSearchTerm(''); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Create Schedule
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
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Flight</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Route</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Schedule</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {schedules.map((item) => (
                <tr key={item.schedule_id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 tracking-widest">{item.Flight?.flight_no}</span>
                      <span className="text-xs font-bold text-slate-400 truncate w-32">{item.Flight?.Airline?.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-700">{item.SourceAirport?.code}</span>
                      <ArrowRight className="h-3 w-3 text-slate-300" />
                      <span className="text-sm font-black text-slate-700">{item.DestAirport?.code}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Calendar className="h-3 w-3 text-primary" />
                        {new Date(item.departure_time).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                        <Clock className="h-3 w-3 text-primary" />
                        {formatTime(item.departure_time)}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button
                      onClick={() => { setCurrentSchedule(item); setStatusData({ status: item.status, delayMinutes: 0 }); setIsStatusModalOpen(true); }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider transition-all hover:scale-105 ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button
                      onClick={() => { setCurrentSchedule(item); setFormData({ ...item, departure_time: item.departure_time.substring(0, 16), arrival_time: item.arrival_time.substring(0, 16) }); setFlightSearchTerm(item.Flight?.flight_no || ''); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.schedule_id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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

      {/* Main Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-heading font-black text-slate-900 tracking-tight">{currentSchedule ? 'Update Schedule' : 'New Flight Schedule'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2" ref={wrapperRef}>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Flight Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required={!formData.flight_id}
                    placeholder="Search Flight Number..."
                    value={flightSearchTerm}
                    onChange={handleFlightSearchChange}
                    onFocus={() => setShowFlightDropdown(true)}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-widest"
                  />
                  {showFlightDropdown && flights.length > 0 && (
                    <ul className="absolute z-[150] mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                      {flights.map(f => (
                        <li 
                          key={f.flight_id}
                          className="px-5 py-3 hover:bg-slate-50 cursor-pointer font-bold text-slate-700 text-sm border-b border-slate-50 last:border-none transition-colors"
                          onClick={() => {
                            setFormData({ ...formData, flight_id: f.flight_id });
                            setFlightSearchTerm(`${f.flight_no} (${f.Airline?.name})`);
                            setShowFlightDropdown(false);
                          }}
                        >
                          {f.flight_no} <span className="text-slate-400 text-xs ml-2">{f.Airline?.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Source Airport</label>
                <select
                  required value={formData.source_airport_id} onChange={(e) => setFormData({ ...formData, source_airport_id: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                >
                  <option value="">Origin</option>
                  {airports.filter(a => String(a.airport_id) !== String(formData.dest_airport_id)).map(a => <option key={a.airport_id} value={a.airport_id}>{a.code} - {a.city}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Destination Airport</label>
                <select
                  required value={formData.dest_airport_id} onChange={(e) => setFormData({ ...formData, dest_airport_id: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                >
                  <option value="">Target</option>
                  {airports.filter(a => String(a.airport_id) !== String(formData.source_airport_id)).map(a => <option key={a.airport_id} value={a.airport_id}>{a.code} - {a.city}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Departure Time</label>
                <input
                  type="datetime-local"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Arrival Time</label>
                <input
                  type="datetime-local"
                  required
                  min={formData.departure_time || new Date().toISOString().slice(0, 16)}
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Base Fare (₹)</label>
                <input
                  type="number" required value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="col-span-2 bg-slate-900 hover:bg-primary text-white py-5 mt-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-[0.98]"
              >
                {currentSchedule ? 'Sync All Parameters' : 'Authorize Flight Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 overflow-hidden border-2 border-primary/20">
            <div className="p-8 pb-4 text-center">
              <div className="bg-amber-50 text-amber-500 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-heading font-black text-slate-900 tracking-tight">Status Override</h3>
              <p className="text-slate-500 font-bold mt-2 truncate">Flight {currentSchedule?.Flight?.flight_no}</p>
            </div>

            <form onSubmit={handleStatusUpdate} className="p-8 pt-4 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Operational Status</label>
                <select
                  value={statusData.status} onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-widest text-sm"
                >
                  <option value="SCHEDULED">ON-TIME / SCHEDULED</option>
                  <option value="DELAYED">DELAYED</option>
                  <option value="CANCELLED">CANCELLED (Notify All)</option>
                  <option value="LANDED">LANDED / COMPLETED</option>
                </select>
              </div>

              {statusData.status === 'DELAYED' && (
                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Delay duration (minutes)</label>
                  <input
                    type="number" required value={statusData.delayMinutes} onChange={(e) => setStatusData({ ...statusData, delayMinutes: parseInt(e.target.value) })}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">Updating status will trigger real-time notifications via WebSockets & Email queues.</p>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="flex-1 px-4 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-colors">Abort</button>
                <button
                  type="submit"
                  className="flex-[2] bg-slate-900 hover:bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-[0.98]"
                >
                  Apply & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulesPage;
