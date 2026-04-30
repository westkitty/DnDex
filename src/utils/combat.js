export const DAMAGE_TYPES = [
  'Slashing', 'Piercing', 'Bludgeoning', 
  'Fire', 'Cold', 'Lightning', 'Thunder', 
  'Poison', 'Acid', 'Necrotic', 'Radiant', 
  'Force', 'Psychic'
];

export const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 
  'Petrified', 'Poisoned', 'Prone', 'Restrained', 
  'Stunned', 'Unconscious', 'Exhaustion'
];

export const CONDITION_METADATA = {
  'Blinded': { icon: 'EyeOff', color: 'text-slate-400', bg: 'bg-slate-400/10' },
  'Charmed': { icon: 'Heart', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  'Deafened': { icon: 'VolumeX', color: 'text-slate-400', bg: 'bg-slate-400/10' },
  'Frightened': { icon: 'Ghost', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  'Grappled': { icon: 'Hand', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  'Incapacitated': { icon: 'ZapOff', color: 'text-slate-500', bg: 'bg-slate-500/10' },
  'Invisible': { icon: 'EyeOff', color: 'text-indigo-200', bg: 'bg-indigo-200/10' },
  'Paralyzed': { icon: 'Activity', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  'Petrified': { icon: 'Mountain', color: 'text-slate-600', bg: 'bg-slate-600/10' },
  'Poisoned': { icon: 'FlaskConical', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  'Prone': { icon: 'ArrowDown', color: 'text-slate-500', bg: 'bg-slate-500/10' },
  'Restrained': { icon: 'Link', color: 'text-amber-600', bg: 'bg-amber-600/10' },
  'Stunned': { icon: 'CloudLightning', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  'Unconscious': { icon: 'Moon', color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
  'Exhaustion': { icon: 'Timer', color: 'text-orange-500', bg: 'bg-orange-500/10' }
};

export const calculateFinalDamage = ({ amount, multiplier = 1, save = 'none' }) => {
  let final = amount;
  
  // Apply save
  if (save === 'success') {
    final = Math.floor(final / 2);
  }
  
  // Apply multiplier (resistance/vulnerability/immunity)
  final = Math.floor(final * multiplier);
  
  return Math.max(0, final);
};
