import React from 'react';

const EntityReference = ({ entity }) => {
  if (!entity.actions) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-6 gap-2 bg-black/40 p-4 rounded-xl border border-white/5">
        {entity.stats && Object.entries(entity.stats).map(([stat, val]) => (
          <div key={stat} className="flex flex-col items-center">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat}</span>
            <span className="text-sm font-bold text-slate-100">{val}</span>
            <span className="text-[9px] text-slate-400 font-mono">({Math.floor((val-10)/2) >= 0 ? '+' : ''}{Math.floor((val-10)/2)})</span>
          </div>
        ))}
      </div>

      {entity.traits?.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Special Traits</h5>
          {entity.traits.map(t => (
            <div key={t.name} className="text-xs leading-relaxed">
              <span className="font-bold text-slate-200 italic mr-2">{t.name}.</span>
              <span className="text-slate-400">{t.description}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h5 className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em]">Actions</h5>
        {entity.actions.map(a => (
          <div key={a.name} className="text-xs leading-relaxed">
            <span className="font-bold text-slate-200 italic mr-2">{a.name}.</span>
            <span className="text-slate-400">{a.description}</span>
          </div>
        ))}
      </div>

      {entity.legendaryActionsList?.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">Legendary Actions</h5>
          {entity.legendaryActionsList.map(a => (
            <div key={a.name} className="text-xs leading-relaxed">
              <span className="font-bold text-slate-200 italic mr-2">{a.name}.</span>
              <span className="text-slate-400">{a.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntityReference;
