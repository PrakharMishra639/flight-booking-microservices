import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, ShieldAlert, User, Search, Mail, Phone, Calendar } from 'lucide-react';
import adminService from '../../redux/services/adminService';
import { setUsers, updateUserInState, setLoading, setError } from '../../redux/slices/adminSlice';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';
import { formatDate } from '../../utils/helpers';

const UsersPage = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.admin);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [dispatch]);

  const fetchUsers = async () => {
    dispatch(setLoading(true));
    try {
      const data = await adminService.getUsers();
      dispatch(setUsers(data));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmMessage = newRole === 'ADMIN' 
      ? `Promote ${user.name} to Administrator? They will have full access to the system.`
      : `Demote ${user.name} to regular User? This will revoke their admin privileges.`;

    if (window.confirm(confirmMessage)) {
      try {
        const updatedUser = await adminService.updateUserRole(user.user_id, newRole);
        dispatch(updateUserInState(updatedUser));
        // If we just promoted a user, let's refresh to get the standard view
        fetchUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">Identity & Access</h2>
          <p className="text-slate-500 font-medium italic">Manage user roles and administrative permissions</p>
        </div>
        
        <div className="relative w-full md:w-96 text-lg">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 font-bold" />
          <input 
            type="text" 
            placeholder="Find users by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-3xl font-bold text-slate-900 shadow-2xl shadow-slate-200/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      <Alert message={error} type="error" />

      {loading ? (
        <div className="flex justify-center py-20"><Loader /></div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Profile</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contact Information</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Created</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Current Role</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${u.role === 'ADMIN' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {u.role === 'ADMIN' ? <Shield className="h-6 w-6" /> : <User className="h-6 w-6" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight">{u.name}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{u.status}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Mail className="h-3 w-3 text-slate-300" />
                      {u.email}
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Phone className="h-3 w-3 text-slate-200" />
                        {u.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-200" />
                      {formatDate(u.created_at)}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-[0.1em] ${u.role === 'ADMIN' ? 'bg-primary/5 text-primary border-primary/20' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {u.user_id !== currentUser?.user_id ? (
                      <button 
                        onClick={() => handleRoleToggle(u)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-2 ml-auto ${
                          u.role === 'ADMIN' 
                          ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' 
                          : 'bg-slate-900 text-white hover:bg-primary shadow-lg shadow-slate-900/10'
                        }`}
                      >
                        {u.role === 'ADMIN' ? (
                          <>
                            <ShieldAlert className="h-4 w-4" />
                            Demote
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            Promote to Admin
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 italic">Self (Protected)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
