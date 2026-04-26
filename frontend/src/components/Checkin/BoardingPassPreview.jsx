import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { Download, Plane, MapPin, Clock, User, LogIn, Wifi } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/helpers';
const BoardingPassPreview = ({ pass, schedule, pnr }) => {
  const passRef = useRef();

  const handleDownload = async () => {
    const element = passRef.current;
    if (!element) return;
    const imgData = await toPng(element, { quality: 1.0, pixelRatio: 2 });
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`BoardingPass_${pass.passenger_name}_${pnr}.pdf`);
  };

  if (!pass || !schedule) return null;

  const flight = schedule.Flight;
  const source = schedule.SourceAirport;
  const dest = schedule.DestAirport;
  const airline = flight.Airline;

  return (
    <div className="max-w-4xl mx-auto mb-16">
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Documentation</p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black transition-all shadow-xl active:scale-95 group"
        >
          <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          Download PDF Pass
        </button>
      </div>

      <div 
        ref={passRef}
        className="bg-white rounded-[2rem] overflow-hidden shadow-2xl text-slate-900 border border-slate-200"
        style={{ width: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header */}
        <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl">
              {airline.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider">{airline.name}</h2>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em]">Boarding Pass</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confirmation</p>
            <h3 className="text-3xl font-black font-mono tracking-tighter">{pnr}</h3>
          </div>
        </div>

        <div className="p-10">
          {/* Main Info */}
          <div className="grid grid-cols-12 gap-8 items-center mb-10">
            <div className="col-span-4">
              <p className="text-5xl font-black tracking-tighter mb-1">{source.code}</p>
              <p className="text-sm font-bold text-slate-500 uppercase">{source.city}</p>
            </div>
            
            <div className="col-span-4 flex flex-col items-center">
              <div className="w-full flex items-center gap-4 mb-2">
                <div className="h-[2px] flex-1 bg-slate-200 dashed border-t-2 border-dashed border-slate-300"></div>
                <Plane className="w-6 h-6 text-slate-300 rotate-90" />
                <div className="h-[2px] flex-1 bg-slate-200 dashed border-t-2 border-dashed border-slate-300"></div>
              </div>
              <div className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                {flight.flight_no}
              </div>
            </div>

            <div className="col-span-4 text-right">
              <p className="text-5xl font-black tracking-tighter mb-1">{dest.code}</p>
              <p className="text-sm font-bold text-slate-500 uppercase">{dest.city}</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-8 py-8 border-y-2 border-dashed border-slate-100 mb-10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Passenger</p>
              <p className="font-black text-lg truncate uppercase">{pass.passenger_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
              <p className="font-black text-lg">{formatDate(schedule.departure_time, { weekday: undefined })}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Departure</p>
              <p className="font-black text-lg">{formatTime(schedule.departure_time)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Arrival</p>
              <p className="font-black text-lg">{formatTime(schedule.arrival_time)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gate</p>
              <p className="font-black text-lg">{pass.gate}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center min-w-[100px]">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Seat</p>
                  <p className="text-4xl font-black text-indigo-600">{pass.seat_number}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center min-w-[100px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Boarding</p>
                  <p className="text-4xl font-black text-slate-900">{new Date(pass.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <Wifi className="w-4 h-4" /> Complimentary WiFi
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <LogIn className="w-4 h-4" /> Zone 1 Boarding
                 </div>
              </div>
            </div>

            <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl overflow-hidden">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pass.qr_code)}&size=140x140&bgcolor=ffffff&color=0f172a`}
                alt="Boarding Pass QR Code"
                className="w-[140px] h-[140px]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 flex justify-between items-center px-10 border-t border-slate-200">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             Issued at: {new Date(pass.issued_at).toLocaleString()}
           </p>
           <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest italic">
             Safe Skies, Happy Travels
           </p>
        </div>
      </div>
    </div>
  );
};

export default BoardingPassPreview;
