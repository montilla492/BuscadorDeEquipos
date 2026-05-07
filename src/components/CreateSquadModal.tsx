import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import { SquadStatus, Vibe } from '../types';

interface CreateSquadModalProps {
  onClose: () => void;
  onSubmit: (squad: any) => void;
}

export const CreateSquadModal: React.FC<CreateSquadModalProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [gameId, setGameId] = useState('valorant');
  const [maxMembers, setMaxMembers] = useState(5);
  const [rankLimit, setRankLimit] = useState('Cualquiera');
  const [vibe, setVibe] = useState(Vibe.CHILL);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-void/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-nebula w-full max-w-md border-l-4 border-neon-green p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase">Iniciar_Instancia</h2>
          <button onClick={onClose} className="p-1 hover:text-neon-green transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mono-label block mb-2">Título_del_Squad</label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Solo Ranked Platino"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-neon-green outline-none transition-all font-display font-bold uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mono-label block mb-2">Protocolo_Juego</label>
              <select 
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-neon-green outline-none transition-all font-display font-bold uppercase"
              >
                <option value="valorant" className="bg-nebula">VALORANT</option>
                <option value="lol" className="bg-nebula">LEAGUE OF LEGENDS</option>
                <option value="cs2" className="bg-nebula">COUNTER-STRIKE 2</option>
                <option value="minecraft" className="bg-nebula">MINECRAFT</option>
              </select>
            </div>
            <div>
              <label className="mono-label block mb-2">Máx_Slots</label>
              <input 
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-neon-green outline-none transition-all font-display font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mono-label block mb-2">Rango_Mínimo</label>
              <input 
                value={rankLimit}
                onChange={(e) => setRankLimit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-neon-green outline-none transition-all font-display font-bold uppercase"
              />
            </div>
            <div>
              <label className="mono-label block mb-2">Ambiente</label>
              <select 
                value={vibe}
                onChange={(e) => setVibe(e.target.value as Vibe)}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-neon-green outline-none transition-all font-display font-bold uppercase"
              >
                <option value={Vibe.CHILL} className="bg-nebula">CHILL / RELAJADO</option>
                <option value={Vibe.COMPETITIVE} className="bg-nebula">COMPETITIVO</option>
              </select>
            </div>
          </div>

          <button 
            onClick={() => onSubmit({ title, gameId, maxMembers, rankLimit, vibe })}
            disabled={!title}
            className="w-full py-4 bg-neon-green text-black font-black italic uppercase tracking-tighter shadow-[0_0_20px_rgba(0,255,65,0.2)] hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] transition-all disabled:opacity-50"
          >
            AUTORIZAR_INSTANCIA
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
