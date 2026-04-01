import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }} 
            className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[2.5rem] p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-black">{title}</h2>
              <button 
                onClick={onClose} 
                className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
              >
                <X size={24} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
