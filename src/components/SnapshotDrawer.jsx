import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Trash2, RotateCcw, X, Clock, Plus, Target } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SnapshotDrawer = ({ isOpen, onClose, state, saveSnapshot, loadSnapshot, deleteSnapshot }) => {
  const [newName, setNewName] = useState('');

  const handleSave = () => {
    saveSnapshot(newName);
    setNewName('');
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[110] bg-slate-950/40 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-[var(--color-obsidian-950)] border-l border-white/5 z-[120] flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
               <Camera className="w-4 h-4 text-emerald-400" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Temporal Echoes</span>
            </div>
            <h2 className="text-xl font-black text-slate-100 uppercase italic tracking-wider">Snapshots</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 border-b border-white/5 bg-black/10 space-y-4">
           <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Archive Current State</label>
             <div className="flex gap-2">
                <input 
                  placeholder="Snapshot label..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500/30 transition-all placeholder:text-slate-800"
                />
                <button 
                  onClick={handleSave}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
             </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {state.snapshots.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-700 opacity-50">
               <Clock className="w-12 h-12 mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest text-center">No snapshots recorded in this timeline</p>
            </div>
          ) : (
            state.snapshots.map((snap) => (
              <div key={snap.id} className="glass-dark p-4 rounded-2xl border border-white/5 space-y-3 group hover:border-emerald-500/20 transition-all">
                <div className="flex items-start justify-between">
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-100">{snap.name}</span>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{snap.timestamp}</span>
                   </div>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => loadSnapshot(snap.id)}
                        className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors"
                        title="Revert to this snapshot"
                      >
                         <RotateCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteSnapshot(snap.id)}
                        className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                        title="Delete snapshot"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                      <Target className="w-3 h-3" /> {snap.state.entities.length} Units
                   </div>
                   <div className="w-1 h-1 rounded-full bg-slate-800" />
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                      <Clock className="w-3 h-3" /> Round {snap.state.round}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-black/20 border-t border-white/5">
           <p className="text-[9px] font-bold text-slate-700 leading-relaxed italic">
             Snapshots capture the entire battlefield state, including tokens, health, and logs. Up to 10 points can be maintained.
           </p>
        </div>
      </motion.aside>
    </>
  );
};

export default SnapshotDrawer;
