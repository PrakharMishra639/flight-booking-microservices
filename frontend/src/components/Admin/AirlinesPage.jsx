import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, Search, X, ImagePlus } from 'lucide-react';
import adminService from '../../redux/services/adminService';
import { setAirlines, setLoading, setError } from '../../redux/slices/adminSlice';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';

const AirlinesPage = () => {
  const dispatch = useDispatch();
  const { airlines, loading, error } = useSelector((state) => state.admin);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAirline, setCurrentAirline] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', country: '' });

  useEffect(() => {
    fetchAirlines();
  }, [dispatch]);

  const fetchAirlines = async () => {
    dispatch(setLoading(true));
    try {
      const data = await adminService.getAirlines();
      dispatch(setAirlines(data));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentAirline) {
        await adminService.updateAirline(currentAirline.airline_id, formData);
      } else {
        await adminService.createAirline(formData);
      }
      setIsModalOpen(false);
      fetchAirlines();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this airline?')) {
      try {
        await adminService.deleteAirline(id);
        fetchAirlines();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleLogoUpload = async (id, file) => {
    if (!file) return;
    try {
      await adminService.uploadAirlineLogo(id, file);
      fetchAirlines(); // Refresh UI to show new logo if displayed
      alert('Logo uploaded successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">Airline Management</h2>
          <p className="text-slate-500 font-medium">Configure partner air carriers</p>
        </div>
        <button 
          onClick={() => { setCurrentAirline(null); setFormData({ name: '', code: '', country: '' }); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add New Airline
        </button>
      </div>

      <Alert message={error} type="error" />

      {loading ? (
        <div className="flex justify-center py-20"><Loader /></div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Airline</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Code</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Country</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {airlines.map((airline) => (
                <tr key={airline.airline_id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-900">{airline.name}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-black uppercase tracking-widest">{airline.code}</span>
                  </td>
                  <td className="px-8 py-5 text-slate-600 font-medium">{airline.country}</td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <label className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer inline-block">
                      <ImagePlus className="h-4 w-4" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleLogoUpload(airline.airline_id, e.target.files[0])}
                      />
                    </label>
                    <button 
                      onClick={() => { setCurrentAirline(airline); setFormData(airline); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(airline.airline_id)}
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
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-heading font-black text-slate-900 tracking-tight">{currentAirline ? 'Update Airline' : 'Add Airline'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Airline Name</label>
                <input 
                  type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                  placeholder="e.g. AeroFlow Global"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">IATA Code</label>
                  <input 
                    type="text" required maxLength={3} value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="AF"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                  <input 
                    type="text" required value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="India"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-[0.98] mt-4"
              >
                {currentAirline ? 'Update Carrier' : 'Register Airline'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirlinesPage;
