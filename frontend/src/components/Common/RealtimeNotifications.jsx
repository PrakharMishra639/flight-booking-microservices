import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { getSocket } from '../../utils/socket';

const RealtimeNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const socket = getSocket();

        // Specific notification events
        const handleNotification = (data) => {
            const id = Date.now();
            const newNotification = {
                id,
                title: data.title || 'Notification',
                message: data.message || 'You have a new update',
                type: data.type || 'INFO',
                timestamp: data.timestamp || new Date()
            };

            setNotifications(prev => [newNotification, ...prev].slice(0, 5)); // Keep last 5

            // Auto-remove after 6 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 6000);
        };

        // Flight status update listener
        const handleFlightUpdate = (data) => {
            handleNotification({
                title: 'Flight Status Update',
                message: `Flight schedule ${data.scheduleId} is now ${data.status}. ${data.delayMinutes > 0 ? `Delayed by ${data.delayMinutes} mins.` : ''}`,
                type: 'FLIGHT_UPDATE'
            });
        };

        socket.on('user_notification', handleNotification);
        socket.on('flight_status_update', handleFlightUpdate);

        return () => {
            socket.off('user_notification', handleNotification);
            socket.off('flight_status_update', handleFlightUpdate);
        };
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'TEST':
            case 'INFO':
                return { icon: <Info className="w-5 h-5 text-blue-500" />, bg: 'bg-white', border: 'border-blue-100' };
            case 'FLIGHT_UPDATE':
                return { icon: <Bell className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50', border: 'border-indigo-100' };
            case 'ALERT':
                return { icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50', border: 'border-amber-100' };
            default:
                return { icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, bg: 'bg-white', border: 'border-slate-100' };
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {notifications.map((n) => {
                    const styles = getTypeStyles(n.type);
                    return (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, x: 20 }}
                            className={`pointer-events-auto flex items-start gap-4 p-5 rounded-3xl border ${styles.border} ${styles.bg} shadow-2xl shadow-slate-200/50 relative group overflow-hidden`}
                        >
                            {/* Accent line for flight updates */}
                            {n.type === 'FLIGHT_UPDATE' && (
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500" />
                            )}
                            
                            <div className="shrink-0 mt-1">
                                {styles.icon}
                            </div>
                            
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{n.title}</h4>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed">{n.message}</p>
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2 block">
                                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <button
                                onClick={() => removeNotification(n.id)}
                                className="shrink-0 p-1 hover:bg-slate-100 rounded-lg text-slate-300 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default RealtimeNotifications;
