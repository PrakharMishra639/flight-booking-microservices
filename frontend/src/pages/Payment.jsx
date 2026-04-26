import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import paymentService from '../redux/services/paymentService';
import bookingService from '../redux/services/bookingService';
import PaymentForm from '../components/Payment/PaymentForm';
import ETicket from '../components/Payment/ETicket';
import Loader from '../components/Common/Loader';
import Alert from '../components/Common/Alert';

import { formatCurrency } from '../utils/helpers';
import { CheckCircle2, Clock, Download, FileText } from 'lucide-react';
import { clearBookingFlow } from '../redux/slices/bookingSlice';
import { getSocket } from '../utils/socket';

// Make sure you replace this with your actual Stripe key via environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder_key_replace_me');

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  
  const [clientSecret, setClientSecret] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amountDue, setAmountDue] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef(null);

  const handleDownloadTicket = () => {
    window.print();
  };

  useEffect(() => {
    const socket = getSocket();
    if (socket && bookingId) {
      socket.emit('join_booking', bookingId);

      socket.on('payment_status_update', (data) => {
        if (data.status === 'SUCCESS') {
          handlePaymentSuccess(data.transactionId);
        }
      });

      socket.on('booking_status_update', (data) => {
        if (data.status === 'CONFIRMED') {
          setBookingDetails(prev => ({ ...prev, status: 'CONFIRMED' }));
          setPaymentSuccess(true);
        }
      });
    }

    const fetchAndInitiatePayment = async () => {
      try {
        const booking = await bookingService.getBooking(bookingId);
        setBookingDetails(booking);

        if (booking.status === 'CONFIRMED') {
           setPaymentSuccess(true);
           setLoading(false);
           return;
        }
        
        if (booking.status !== 'PENDING') {
           setError(`Booking payment cannot be processed. Status: ${booking.status}`);
           setLoading(false);
           return;
        }

        // We initiate with 'ALL' or empty to allow multi-method selection on frontend
        const paymentData = await paymentService.initiatePayment(bookingId, 'ALL');
        setClientSecret(paymentData.clientSecret);
        setAmountDue(paymentData.amount);
        
      } catch (err) {
        setError(err.response?.data?.error || 'Could not initiate payment.');
      } finally {
        setLoading(false);
      }
    };
    fetchAndInitiatePayment();

    // Check if we just returned from a redirect-based payment (like UPI)
    const checkPaymentIntent = async () => {
      const clientSecretParam = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
      if (clientSecretParam) {
        setLoading(true);
        const stripe = await stripePromise;
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecretParam);
        if (paymentIntent.status === 'succeeded') {
          handlePaymentSuccess(paymentIntent.id);
        } else if (paymentIntent.status === 'processing') {
          setError("Your payment is processing. We will update you once it's confirmed.");
        } else {
          setError("Payment failed. Please try again.");
        }
        setLoading(false);
      }
    };
    checkPaymentIntent();

    return () => {
      if (socket) {
        socket.emit('leave_booking', bookingId);
        socket.off('payment_status_update');
        socket.off('booking_status_update');
      }
    };
  }, [bookingId]);

  const handlePaymentSuccess = async (transactionId) => {
    try {
      if (transactionId) {
        await paymentService.manualPaymentCallback(bookingId, 'SUCCESS', transactionId, 'ALL');
      }
      // Optimistically update status for E-Ticket rendering
      setBookingDetails(prev => ({ ...prev, status: 'CONFIRMED' }));
    } catch (err) {
      console.error('Failed to sync payment callback with backend', err);
    }
    setPaymentSuccess(true);
    dispatch(clearBookingFlow());
  };

  if (loading) return <Loader fullScreen />;

  if (paymentSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 text-center rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg w-full">
           <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
           <h2 className="text-3xl font-heading font-black text-slate-900 mb-2">Payment Successful!</h2>
           <p className="text-slate-500 font-medium mb-8">Your booking {bookingDetails?.pnr} has been confirmed. A confirmation email has been sent to {bookingDetails?.contact_email}.</p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               {redirectTo === 'webcheckin' ? (
                 <button 
                   onClick={() => navigate(`/web-checkin?pnr=${bookingDetails?.pnr}`)} 
                   className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center"
                 >
                   Return to Web Check-in
                 </button>
               ) : (
                 <>
                   <button 
                     onClick={handleDownloadTicket} 
                     disabled={downloading}
                     className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-primary disabled:bg-slate-300 text-white rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
                   >
                     {downloading ? (
                       <span className="flex items-center gap-2">Generating...</span>
                     ) : (
                       <span className="flex items-center gap-2"><Download className="w-5 h-5" /> Download E-Ticket</span>
                     )}
                   </button>
                   <button 
                     onClick={() => navigate('/profile')} 
                     className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                   >
                     <FileText className="w-5 h-5" /> View Bookings
                   </button>
                 </>
               )}
           </div>
        </div>
        
        {/* Render the off-screen E-Ticket component for PDF capture */}
        <ETicket ref={ticketRef} booking={bookingDetails} />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-12 px-4 bg-slate-50/50">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-7 order-2 lg:order-1">
           <div className="bg-white p-10 border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 h-full">
              <h2 className="text-3xl font-heading font-black text-slate-900 mb-2 tracking-tight">Checkout</h2>
              <p className="text-slate-500 font-medium mb-8">Secure your flight reservation securely</p>
              
              <Alert message={error} type="error" />
              
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#0f172a',
                      colorBackground: '#ffffff',
                      colorText: '#0f172a',
                      colorDanger: '#ef4444',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '12px',
                    },
                  },
                  defaultValues: {
                    billingDetails: {
                      name: bookingDetails?.BookingDetails?.[0]?.passenger_name || '',
                    }
                  }
                }}>
                  <PaymentForm onPaymentSuccess={handlePaymentSuccess} />
                </Elements>
              ) : (
                !error && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                    <Loader />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Initializing Secure Vault...</p>
                  </div>
                )
              )}
           </div>
        </div>

        <div className="lg:col-span-5 order-1 lg:order-2">
           <div className="bg-primary p-8 rounded-3xl shadow-lg text-white">
              <div className="mb-8">
                 <p className="text-primary-100">Booking Reference (PNR)</p>
                 <p className="text-3xl font-heading font-bold">{bookingDetails?.pnr || '------'}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-primary-dark/30 pb-4">
                  <span>Amount Due</span>
                  <span className="font-bold">{formatCurrency(amountDue !== null ? amountDue : bookingDetails?.total_price || 0)}</span>
                </div>
              </div>

              <div className="flex items-start bg-primary-dark/30 p-4 rounded-xl text-sm">
                 <Clock className="w-5 h-5 mr-3 shrink-0" />
                 <p>Please complete payment within 10 minutes from when you initiated the booking to guarantee your seats.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Payment;
