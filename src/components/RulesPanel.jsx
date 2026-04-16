import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Book, Info, Shield, Swords, Brain, Flame, Skull, 
  History, Library, Zap, ScrollText, AlertCircle 
} from 'lucide-react';
import ActionLedger from './ActionLedger';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const RULES_DATABASE = [
  { title: 'Blinded', category: 'Condition', content: 'A blinded creature can’t see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature’s attack rolls have disadvantage.' },
  { title: 'Charmed', category: 'Condition', content: 'A charmed creature can’t attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.' },
  { title: 'Deafened', category: 'Condition', content: 'A deafened creature can’t hear and automatically fails any ability check that requires hearing.' },
  { title: 'Frightened', category: 'Condition', content: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can’t willingly move closer to the source of its fear.' },
  { title: 'Grappled', category: 'Condition', content: 'A grappled creature’s speed becomes 0, and it can’t benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from the reach of the grappler or grappling effect.' },
  { title: 'Incapacitated', category: 'Condition', content: 'An incapacitated creature can’t take actions or reactions.' },
  { title: 'Invisible', category: 'Condition', content: 'An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. Attack rolls against the creature have disadvantage, and the creature’s attack rolls have advantage.' },
  { title: 'Paralyzed', category: 'Condition', content: 'A paralyzed creature is incapacitated and can’t move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.' },
  { title: 'Petrified', category: 'Condition', content: 'A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging. The creature is incapacitated, can’t move or speak, and is unaware of its surroundings.' },
  { title: 'Poisoned', category: 'Condition', content: 'A poisoned creature has disadvantage on attack rolls and ability checks.' },
  { title: 'Prone', category: 'Condition', content: 'A prone creature’s only movement option is to crawl, unless it stands up and thereby ends the condition. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.' },
  { title: 'Restrained', category: 'Condition', content: 'A restrained creature’s speed becomes 0. Attack rolls against the creature have advantage, and the creature’s attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.' },
  { title: 'Stunned', category: 'Condition', content: 'A stunned creature is incapacitated, can’t move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.' },
  { title: 'Unconscious', category: 'Condition', content: 'An unconscious creature is incapacitated, can’t move or speak, and is unaware of its surroundings. The creature drops whatever it’s holding and falls prone. It automatically fails Str and Dex saves. Attack rolls against it have advantage. Any attack that hits is a critical hit if the attacker is within 5 feet.' },
  { title: 'Exhaustion', category: 'Condition', content: '1: Disadvantage on ability checks. 2: Speed halved. 3: Disadvantage on attack rolls and saving throws. 4: Hit point maximum halved. 5: Speed reduced to 0. 6: Death.' },
  { title: 'Cover (Half)', category: 'Rule', content: '+2 bonus to AC and Dexterity saving throws. A target has half cover if an obstacle blocks at least half of its body.' },
  { title: 'Cover (Three-Quarters)', category: 'Rule', content: '+5 bonus to AC and Dexterity saving throws. A target has three-quarters cover if about three-quarters of it is covered by an obstacle.' },
  { title: 'Cover (Total)', category: 'Rule', content: 'A target with total cover can’t be targeted directly by an attack or a spell, although some spells can reach such a target by including it in an area of effect.' },
  { title: 'Concentration', category: 'Rule', content: 'When taking damage, make a Constitution saving throw to maintain concentration. The DC equals 10 or half the damage you take, whichever number is higher.' }
];

const RulesPanel = ({ encounter, onClose }) => {
  const [activeTab, setActiveTab] = useState('ledger'); // Default to Ledger in Phase 2
  const [query, setQuery] = useState('');
  const { state, updateState } = encounter;

  const filtered = useMemo(() => {
    if (!query) return RULES_DATABASE;
    const q = query.toLowerCase();
    return RULES_DATABASE.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.category.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q)
    );
  }, [query]);

  const categories = ['Condition', 'Rule'];

  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute md:relative right-0 top-0 h-full w-full md:w-80 glass-dark border-l border-white/10 z-40 flex flex-col shadow-2xl"
    >
      {/* Header & Close */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-dragon-950/40">
        <div className="flex items-center gap-2">
          {activeTab === 'library' ? (
            <Library className="w-5 h-5 text-indigo-400" />
          ) : (
            <History className="w-5 h-5 text-rose-400" />
          )}
          <h2 className="font-serif font-bold text-lg tracking-tight">
            {activeTab === 'library' ? 'Grimoire' : 'Ledger'}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-5 h-5 opacity-50" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-dragon-950 border-b border-white/5">
        <button 
          onClick={() => setActiveTab('ledger')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg",
            activeTab === 'ledger' ? "bg-white/5 text-rose-400" : "text-dragon-500 hover:text-dragon-300"
          )}
        >
          <History className="w-3.5 h-3.5" /> Ledger
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg",
            activeTab === 'library' ? "bg-white/5 text-indigo-400" : "text-dragon-500 hover:text-dragon-300"
          )}
        >
          <Library className="w-3.5 h-3.5" /> Library
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'library' ? (
            <motion.div 
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="relative mb-6">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dragon-600" />
                <input 
                  placeholder="Search rules..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full glass bg-dragon-950/40 border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-indigo-500/50 transition-all placeholder:text-dragon-600"
                />
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-custom space-y-6">
                {categories.map(cat => {
                  const items = filtered.filter(i => i.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-3">
                      <h3 className="text-[10px] font-bold text-dragon-500 uppercase tracking-[0.2em] px-1">{cat}s</h3>
                      {items.map(item => (
                        <div key={item.title} className="glass p-4 rounded-xl border-white/5 hover:bg-white/5 transition-colors group cursor-default">
                          <h4 className="font-serif font-bold text-indigo-300 mb-1 group-hover:text-indigo-200 transition-colors uppercase tracking-wide flex items-center gap-2 text-sm">
                            {cat === 'Condition' ? <Skull className="w-3 h-3 opacity-50" /> : <Info className="w-3 h-3 opacity-50" />}
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-dragon-400 leading-relaxed font-sans">{item.content}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="ledger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 overflow-hidden"
            >
              <ActionLedger 
                logs={state.logs || []} 
                onClear={() => updateState(prev => ({ ...prev, logs: [] }), "Audit log reset by DM.")} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-dragon-950/40 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2 text-[8px] font-bold text-dragon-600 uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-health-base animate-pulse" />
          {activeTab === 'library' ? 'D&D 5e Reference Library' : 'Live Action Auditing Active'}
        </div>
      </div>
    </motion.aside>
  );
};

export default RulesPanel;
