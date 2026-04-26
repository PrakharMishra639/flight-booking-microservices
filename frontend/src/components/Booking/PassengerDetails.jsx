import { User, Mail, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const PassengerDetails = ({ count, passengers, onChange, email, onEmailChange }) => {
  const [touched, setTouched] = useState({});
  const [idTouched, setIdTouched] = useState(Array.from({ length: count }, () => ({})));

  const PassengerRules = {
    name: {
      regex: /^[a-zA-Z\s]{2,50}$/,
      message: 'Name must be 2-50 characters (letters and spaces only)'
    },
    age: {
      min: 1,
      max: 120,
      message: 'Age must be between 1 and 120'
    },
    idNumber: {
      regex: /^[a-zA-Z0-9]{12}$/,
      message: 'ID Number must be exactly 12 alphanumeric characters'
    }
  };

  const getFieldError = (pIndex, field, value) => {
    if (!value && field !== 'gender') return 'This field is required';
    
    if (field === 'name') {
      if (!PassengerRules.name.regex.test(value)) return PassengerRules.name.message;
    }
    if (field === 'age') {
      const age = parseInt(value);
      if (isNaN(age) || age < PassengerRules.age.min || age > PassengerRules.age.max) {
        return PassengerRules.age.message;
      }
    }
    if (field === 'idNumber') {
      if (!PassengerRules.idNumber.regex.test(value)) return PassengerRules.idNumber.message;
    }
    return null;
  };

  const handlePassengerChange = (index, field, value) => {
    // For ID number, strictly enforce alphanumeric and max length
    if (field === 'idNumber') {
      value = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    }
    
    const updated = [...passengers];
    if (!updated[index]) updated[index] = { name: '', age: '', gender: 'MALE', idType: 'PASSPORT', idNumber: '' };
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleBlur = (index, field) => {
    const newIdTouched = [...idTouched];
    if (!newIdTouched[index]) newIdTouched[index] = {};
    newIdTouched[index][field] = true;
    setIdTouched(newIdTouched);
  };

  const getInputClass = (index, field, value) => {
    const error = getFieldError(index, field, value);
    const isTouched = idTouched[index] && idTouched[index][field];
    const shouldShowError = isTouched || (value !== '' && value !== undefined && value !== null);
    
    return `block w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 transition-all text-sm ${
      shouldShowError && error 
        ? 'border-red-500 ring-red-500/10 focus:ring-red-500 focus:border-red-500 shadow-[0_4px_10px_rgba(239,68,68,0.05)]' 
        : (isTouched || value) && !error
          ? 'border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500' 
          : 'border-slate-300 focus:ring-primary focus:border-primary'
    }`;
  };

  const renderError = (index, field, value) => {
    const error = getFieldError(index, field, value);
    const isTouched = idTouched[index] && idTouched[index][field];
    const shouldShowError = (isTouched || (value !== '' && value !== undefined && value !== null)) && error;
    
    if (!shouldShowError) return null;
    return <p className="mt-1.5 text-[10px] text-red-500 font-bold ml-1 leading-tight">{error}</p>;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        Passenger Information
      </h3>
      
      {/* Contact Email - DISABLED as requested */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Contact Email
        </label>
        <div className="relative group">
          <input
            type="email" 
            disabled
            value={email} 
            className="block w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed opacity-80"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified
          </div>
        </div>
        <p className="mt-2 text-[10px] text-slate-400 font-medium">Booking details and e-tickets will be sent to your registered email.</p>
      </div>

      {/* Passenger Cards */}
      {Array.from({ length: count }).map((_, index) => {
        const p = passengers[index] || { name: '', age: '', gender: 'MALE', idType: 'PASSPORT', idNumber: '' };
        
        return (
          <div key={index} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden active:scale-[0.99] transition-all">
            {/* Accent bar */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-r-3xl" />
            
            <h4 className="font-bold text-slate-800 mb-6 flex items-center text-lg pl-2">
               <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mr-3 text-xs font-black">{index + 1}</span>
               Passenger {index + 1}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              {/* Full Name */}
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Full Name</label>
                <input
                  type="text" required
                  value={p.name} 
                  onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                  onBlur={() => handleBlur(index, 'name')}
                  className={getInputClass(index, 'name', p.name)}
                  placeholder="As per ID Proof (Min 2 chars)"
                />
                {renderError(index, 'name', p.name)}
              </div>

              {/* Age + Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Age</label>
                  <input
                    type="number" required
                    value={p.age} 
                    onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                    onBlur={() => handleBlur(index, 'age')}
                    className={getInputClass(index, 'age', p.age)}
                    placeholder="1-120"
                  />
                  {renderError(index, 'age', p.age)}
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Gender</label>
                  <select
                    value={p.gender} onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                    className="block w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer font-medium"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              
              {/* ID Type */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">ID Proof Type</label>
                <select
                  value={p.idType} onChange={(e) => handlePassengerChange(index, 'idType', e.target.value)}
                  className="block w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer font-medium"
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="NATIONAL_ID">Aadhar / National ID</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">ID Proof Number</label>
                <input
                  type="text" required
                  value={p.idNumber} 
                  onChange={(e) => handlePassengerChange(index, 'idNumber', e.target.value)}
                  onBlur={() => handleBlur(index, 'idNumber')}
                  className={getInputClass(index, 'idNumber', p.idNumber)}
                  placeholder="Exactly 12 alphanumeric"
                />
                {renderError(index, 'idNumber', p.idNumber)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default PassengerDetails;
