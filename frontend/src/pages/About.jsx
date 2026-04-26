import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PlaneTakeoff, Globe2, Shield, Award, Users, Star,
  Zap, Heart, TrendingUp, ArrowRight
} from 'lucide-react';

const stats = [
  { value: '2M+', label: 'Passengers Served' },
  { value: '150+', label: 'Destinations' },
  { value: '50+', label: 'Airline Partners' },
  { value: '98%', label: 'Customer Satisfaction' },
];

const values = [
  { icon: Shield, title: 'Safety First', desc: 'Every booking is protected with end-to-end encryption and fraud prevention.' },
  { icon: Zap, title: 'Instant Booking', desc: 'Real-time seat availability and instant confirmation in under 3 seconds.' },
  { icon: Heart, title: 'Passenger First', desc: 'Our 24/7 support team is always here to help you fly without stress.' },
  { icon: TrendingUp, title: 'Best Price Guarantee', desc: 'We match or beat any comparable fare. No hidden fees, ever.' },
];

const team = [
  { name: 'Arjun Sharma', role: 'CEO & Co-Founder', initials: 'AS', color: 'from-blue-500 to-cyan-400' },
  { name: 'Priya Verma', role: 'CTO & Co-Founder', initials: 'PV', color: 'from-violet-500 to-pink-400' },
  { name: 'Rahul Mehta', role: 'Head of Operations', initials: 'RM', color: 'from-emerald-500 to-teal-400' },
  { name: 'Sneha Kapoor', role: 'Head of Design', initials: 'SK', color: 'from-orange-500 to-amber-400' },
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const About = () => {
  return (
    <div className="bg-slate-50 min-h-screen">

      {/* Hero */}
      <div className="relative bg-slate-900 pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #06b6d4 0%, transparent 50%)' }}
        />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest mb-6">
              <PlaneTakeoff className="h-4 w-4" /> Our Story
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-black text-white mb-6">
              Flying the World,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Together
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              AeroFlow was founded with a simple belief: booking a flight should be as exciting as the journey itself. We're reimagining travel for millions of passengers worldwide.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 -mt-12">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp}
              className="bg-white rounded-3xl p-6 text-center shadow-xl border border-slate-100"
            >
              <p className="text-4xl font-black text-slate-900 mb-1">{s.value}</p>
              <p className="text-sm text-slate-500 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Mission */}
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Our Mission</p>
            <h2 className="text-4xl font-heading font-black text-slate-900 mb-6 leading-tight">
              Making the World Accessible to Everyone
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              We believe travel is a fundamental human right. Whether you're flying for business or chasing adventure, AeroFlow provides the tools, transparency, and care to get you there — at the best possible price.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Since our founding, we've helped over 2 million passengers reach 150+ destinations across the globe, partnering with 50+ airlines to ensure you always have options.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-primary to-cyan-500 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/30">
              <Globe2 className="h-12 w-12 mb-6 opacity-80" />
              <p className="text-2xl font-black mb-2">150+ Destinations</p>
              <p className="opacity-80">From bustling metros to hidden gems — we connect you everywhere.</p>
              <div className="mt-8 flex gap-2">
                {['DEL', 'BOM', 'BLR', 'DXB', 'LHR', 'JFK'].map(code => (
                  <span key={code} className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg">{code}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-slate-900 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">What We Stand For</p>
            <h2 className="text-4xl font-heading font-black text-white">Our Core Values</h2>
          </motion.div>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid md:grid-cols-2 gap-6"
          >
            {values.map((v) => (
              <motion.div key={v.title} variants={fadeUp}
                className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:bg-slate-800 transition-colors"
              >
                <div className="bg-primary/10 text-primary p-3 rounded-2xl w-fit mb-5">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{v.title}</h3>
                <p className="text-slate-400 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Team */}
      <div className="max-w-5xl mx-auto px-6 py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">The People Behind</p>
          <h2 className="text-4xl font-heading font-black text-slate-900">Meet Our Team</h2>
        </motion.div>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {team.map((member) => (
            <motion.div key={member.name} variants={fadeUp}
              className="bg-white rounded-3xl p-6 text-center border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.color} text-white font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                {member.initials}
              </div>
              <p className="font-bold text-slate-900">{member.name}</p>
              <p className="text-sm text-slate-500 mt-1">{member.role}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary to-cyan-500 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="max-w-3xl mx-auto px-6 text-center"
        >
          <h2 className="text-4xl font-heading font-black text-white mb-4">Ready to Take Off?</h2>
          <p className="text-white/80 text-lg mb-8">Join millions of travellers who trust AeroFlow for every journey.</p>
          <Link to="/"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
          >
            Search Flights <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>

    </div>
  );
};

export default About;
