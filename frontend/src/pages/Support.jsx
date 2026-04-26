import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Phone, Mail, FileText, ChevronDown,
  Search, Clock, CheckCircle2, ArrowRight, Headphones, BookOpen, Ticket
} from 'lucide-react';

const categories = [
  { icon: Ticket, title: 'Booking & Reservation', desc: 'Help with new bookings, changes, and cancellations' },
  { icon: BookOpen, title: 'Check-In & Boarding', desc: 'Online check-in, boarding passes, and seat upgrades' },
  { icon: MessageCircle, title: 'Baggage', desc: 'Lost luggage, allowances, and special items' },
  { icon: FileText, title: 'Refunds & Payments', desc: 'Refund status, payment issues, and invoices' },
  { icon: Headphones, title: 'Flight Status', desc: 'Delays, cancellations, and real-time updates' },
  { icon: Phone, title: 'Special Assistance', desc: 'Wheelchair, medical needs, and unaccompanied minors' },
];

const faqs = [
  {
    q: 'How do I cancel or change my flight booking?',
    a: 'You can cancel or change your booking through the "My Profile" section under "My Bookings". Changes are subject to the airline\'s fare rules. Cancellations made 24+ hours before departure are generally eligible for a refund.'
  },
  {
    q: 'When will I receive my refund?',
    a: 'Refunds are typically processed within 5–7 business days to your original payment method. International cards may take up to 14 days depending on your bank. You\'ll receive a confirmation email once the refund is initiated.'
  },
  {
    q: 'Can I select my seat after booking?',
    a: 'Yes! After completing your booking, go to "My Bookings" in your profile. If the airline allows seat selection, you\'ll see the option to choose or upgrade your seat.'
  },
  {
    q: 'What is the baggage allowance?',
    a: 'Baggage allowance varies by airline and fare class. Economy class typically includes 15–23 kg checked baggage. You can view the exact allowance on your booking confirmation or the airline\'s website.'
  },
  {
    q: 'How do I get a boarding pass?',
    a: 'Most airlines allow online check-in 24–48 hours before departure. Visit your airline\'s website or app to check in and download your boarding pass. AeroFlow will send you a reminder email before check-in opens.'
  },
  {
    q: 'My payment failed but money was deducted. What should I do?',
    a: 'If your payment was deducted but the booking wasn\'t confirmed, the amount will be automatically refunded within 3–5 business days. If it\'s not refunded, please contact support with your transaction ID and we\'ll resolve it immediately.'
  },
];

const channels = [
  { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with us in real-time', availability: 'Available 24/7', color: 'text-blue-600 bg-blue-50', action: 'Start Chat' },
  { icon: Phone, title: 'Phone Support', desc: '+91 1800-XXX-XXXX', availability: '6 AM – 11 PM IST', color: 'text-emerald-600 bg-emerald-50', action: 'Call Now' },
  { icon: Mail, title: 'Email Support', desc: 'support@aeroflow.com', availability: 'Response in 4–6 hours', color: 'text-violet-600 bg-violet-50', action: 'Send Email' },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const FAQItem = ({ faq }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800 pr-4">{faq.q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Support = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* Hero */}
      <div className="relative bg-slate-900 pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 60%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 70% 20%, #6366f1 0%, transparent 50%)' }}
        />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest mb-6">
              <Headphones className="h-4 w-4" /> Help Center
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-6">
              How Can We{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Help You?
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-10">
              Search our knowledge base or reach out to our 24/7 support team.
            </p>
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers..."
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white shadow-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary text-base"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Channels */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 -mt-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid md:grid-cols-3 gap-5"
        >
          {channels.map((ch) => (
            <motion.div key={ch.title} variants={fadeUp}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-2xl ${ch.color} flex items-center justify-center mb-4`}>
                <ch.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{ch.title}</h3>
              <p className="text-slate-600 text-sm mt-1">{ch.desc}</p>
              <div className="flex items-center gap-2 mt-4">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-500">{ch.availability}</span>
              </div>
              <button className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {ch.action} <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Help Categories */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Browse By Topic</p>
          <h2 className="text-3xl font-heading font-black text-slate-900">Common Topics</h2>
        </motion.div>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {categories.map((cat) => (
            <motion.div key={cat.title} variants={fadeUp}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="bg-primary/10 text-primary p-2.5 rounded-xl w-fit mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <cat.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{cat.title}</h3>
              <p className="text-sm text-slate-500">{cat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* FAQs */}
      <div className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Got Questions?</p>
            <h2 className="text-3xl font-heading font-black text-slate-900">Frequently Asked Questions</h2>
          </motion.div>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-3"
          >
            {faqs.map((faq) => (
              <motion.div key={faq.q} variants={fadeUp}>
                <FAQItem faq={faq} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Still need help */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #3b82f6 0%, transparent 60%)' }}
          />
          <div className="relative">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/20 text-primary p-4 rounded-2xl">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-3xl font-heading font-black text-white mb-4">Still Need Help?</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
              Our dedicated support team is available 24/7 to resolve any issue you face.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-2xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30">
                <MessageCircle className="h-5 w-5" /> Start Live Chat
              </button>
              <Link to="/"
                className="flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-colors"
              >
                Back to Search <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default Support;
