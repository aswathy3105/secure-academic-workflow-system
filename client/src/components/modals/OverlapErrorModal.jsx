import React from 'react';
import Modal from '../Modal';
import { AlertCircle, XCircle } from 'lucide-react';

const OverlapErrorModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Conflict">
      <div className="flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="p-6 bg-red-500/10 rounded-full animate-bounce">
          <XCircle size={64} className="text-red-500" />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
            ⚠ Conflict Detected
          </h3>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            You already applied for leave during this time. Please choose a different date or time range.
          </p>
        </div>

        <div className="pt-6 w-full">
          <button
            onClick={onClose}
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all"
          >
            Go Back & Fix
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OverlapErrorModal;
