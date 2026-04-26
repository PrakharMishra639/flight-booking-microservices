import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plane, 
  MapPin, 
  Clock, 
  Ticket, 
  Wallet, 
  Building2,
  ChevronRight,
  User,
  Terminal,
  X
} from 'lucide-react';

import { useSelector } from 'react-redux';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useSelector((state) => state.auth);
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Building2, label: 'Airlines', path: '/admin/airlines' },
    { icon: MapPin, label: 'Airports', path: '/admin/airports' },
    { icon: Plane, label: 'Flights', path: '/admin/flights' },
    { icon: Clock, label: 'Schedules', path: '/admin/schedules' },
    { icon: User, label: 'Users', path: '/admin/users' },
    { icon: Ticket, label: 'Bookings', path: '/admin/bookings' },
    { icon: Wallet, label: 'Payments', path: '/admin/payments' },
    { icon: Terminal, label: 'System Logs', path: '/admin/logs' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 p-6 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-2 mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-heading font-black text-white tracking-widest">AEROFLOW <span className="text-primary font-bold">ADMIN</span></span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group
              ${isActive 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                : 'hover:bg-slate-800/50 hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-primary'}`} />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800/50">
        <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/30">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Signed in as</p>
          <p className="text-sm font-bold text-white truncate">{user ? `${user.first_name} ${user.last_name}` : 'Administrator'}</p>
        </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
