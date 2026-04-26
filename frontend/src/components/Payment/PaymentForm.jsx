import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Loader2, Lock, Terminal } from 'lucide-react';
import Alert from '../Common/Alert';

const PaymentForm = ({ onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    // confirmPayment handles both direct success and redirect-based methods (like UPI)
    const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL is required for redirect-based methods like UPI
        return_url: window.location.href, 
      },
      redirect: 'if_required', // Handle success directly if no redirect is needed (like most cards)
    });

    if (paymentError) {
      setError(paymentError.message);
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setProcessing(false);
      onPaymentSuccess(paymentIntent.id);
    } else {
      // Payment might be pending or redirecting
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert message={error} type="error" onDismiss={() => setError(null)} />
      
      <div className="bg-white p-6 border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50">
        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 block ml-1">Secure Payment Method</label>
        
        <PaymentElement options={{
          layout: 'accordion',
          business: { name: 'AeroFlow Global' },
          terms: { card: 'never' }
        }} />
      </div>

      <div className="text-center text-[10px] font-bold text-slate-400 flex items-center justify-center uppercase tracking-widest">
         <Lock className="w-3 h-3 mr-2 text-emerald-500" /> All transactions are encrypted & secure
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex justify-center items-center py-5 px-4 bg-slate-900 hover:bg-primary text-white rounded-[1.5rem] font-black text-sm shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {processing ? (
          <Loader2 className="animate-spin h-5 w-5 mr-2" />
        ) : (
          <Terminal className="h-4 w-4 mr-2" />
        )}
        {processing ? 'Processing Securely...' : 'Complete Payment Now'}
      </button>
    </form>
  );
};

export default PaymentForm;
