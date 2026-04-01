import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const TimePicker = ({ label, value, onChange, error }) => {
  // value format: "09:00 AM"
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (value) {
      const [time, p] = value.split(' ');
      const [h, m] = time.split(':');
      setHour(h);
      setMinute(m);
      setPeriod(p);
    }
  }, [value]);

  const handleHourChange = (e) => {
    const newHour = e.target.value;
    setHour(newHour);
    onChange(`${newHour}:${minute} ${period}`);
  };

  const handleMinuteChange = (e) => {
    const newMinute = e.target.value;
    setMinute(newMinute);
    onChange(`${hour}:${newMinute} ${period}`);
  };

  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    onChange(`${hour}:${minute} ${newPeriod}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Clock size={12} className="text-primary-500" /> {label}
        </label>
      )}
      <div className="flex gap-2">
        {/* Hour Dropdown */}
        <div className="relative flex-1 group">
          <select
            value={hour}
            onChange={handleHourChange}
            className={`w-full bg-slate-950 border ${error ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-slate-800'} rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-primary-500/50 focus:outline-none text-white appearance-none cursor-pointer text-center font-bold`}
          >
            {hours.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center text-slate-500 font-bold">:</div>

        {/* Minute Dropdown */}
        <div className="relative flex-1 group">
          <select
            value={minute}
            onChange={handleMinuteChange}
            className={`w-full bg-slate-950 border ${error ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-slate-800'} rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-primary-500/50 focus:outline-none text-white appearance-none cursor-pointer text-center font-bold`}
          >
            {minutes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* AM/PM Dropdown */}
        <div className="relative w-24 group">
          <select
            value={period}
            onChange={handlePeriodChange}
            className={`w-full bg-slate-950 border ${error ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-slate-800'} rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-primary-500/50 focus:outline-none text-white appearance-none cursor-pointer text-center font-black uppercase tracking-widest bg-primary-600/10 border-primary-500/30`}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TimePicker;
