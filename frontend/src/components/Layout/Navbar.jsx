import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import authService from '../../redux/services/authService';
import { PlaneTakeoff, User as UserIcon, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { isAuthenticated, user, refreshToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout(refreshToken);
    } catch (e) {
      console.error(e);
    } finally {
      dispatch(logout());
      navigate('/');
    }
  };

  return (
    <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${isScrolled ? 'glass py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center text-slate-900">
          
          <Link to="/" className="flex items-center space-x-2">
            <PlaneTakeoff className="h-8 w-8 text-primary" />
            <span className="text-xl font-heading font-bold tracking-tight text-primary">AeroFlow</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link to="/" className="text-primary hover:text-primary-dark transition-colors">Search Flights</Link>
            <Link to="/web-checkin" className="text-primary hover:text-primary-dark transition-colors">Web Check-In</Link>
            <Link to="/about" className="text-primary hover:text-primary-dark transition-colors">About</Link>
            <Link to="/support" className="text-primary hover:text-primary-dark transition-colors">Support</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 bg-white/50 hover:bg-white/80 p-2 pr-4 rounded-full border border-slate-200 transition-all focus:outline-none"
                >
                  <div className="bg-primary/10 text-primary p-1.5 rounded-full">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden"
                    >
                      {user?.role === 'ADMIN' && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-3 hover:bg-slate-50 text-sm">
                          <LayoutDashboard className="h-4 w-4 mr-2 text-slate-500" /> Admin Dashboard
                        </Link>
                      )}
                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-3 hover:bg-slate-50 text-sm">
                        <UserIcon className="h-4 w-4 mr-2 text-slate-500" /> My Profile
                      </Link>
                      <button onClick={() => { setDropdownOpen(false); handleLogout(); }} className="w-full flex items-center px-4 py-3 hover:bg-red-50 text-red-600 text-sm text-left">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">Sign In</Link>
                <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-md shadow-primary/20">
                  Register
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-primary focus:outline-none">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass border-t-0"
          >
            <div className="px-4 py-6 flex flex-col space-y-4">
               <Link to="/" onClick={()=>setMobileMenuOpen(false)} className="hover:text-primary px-2">Search Flights</Link>
               <Link to="/web-checkin" onClick={()=>setMobileMenuOpen(false)} className="hover:text-primary px-2">Web Check-In</Link>
               {isAuthenticated ? (
                 <>
                    <Link to="/profile" onClick={()=>setMobileMenuOpen(false)} className="hover:text-primary px-2">My Profile</Link>
                    {user?.role === 'ADMIN' && (
                       <Link to="/admin" onClick={()=>setMobileMenuOpen(false)} className="hover:text-primary px-2">Admin</Link>
                    )}
                    <button onClick={handleLogout} className="text-left text-red-600 hover:text-red-700 px-2 pt-4 border-t border-slate-200/50">Logout</button>
                 </>
               ) : (
                 <>
                  <Link to="/login" onClick={()=>setMobileMenuOpen(false)} className="hover:text-primary px-2">Sign In</Link>
                  <Link to="/register" onClick={()=>setMobileMenuOpen(false)} className="hover:text-primary px-2 font-medium">Register</Link>
                 </>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
