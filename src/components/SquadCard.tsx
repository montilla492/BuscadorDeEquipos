import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Zap, Flame, Mic, UserPlus, MessageSquare, Trash2, LogOut, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Squad, SquadStatus } from '../types';
import { Chat } from './Chat';

interface SquadCardProps {
  squad: Squad;
  onJoin: (id: string) => void;
  onDelete: (id: string) => void;
  onLeave: (id: string) => void;
  onVote: (targetUid: string, value: number) => void;
  user: any;
}

export const SquadCard: React.FC<SquadCardProps> = ({ squad, onJoin, onDelete, onLeave, onVote, user }) => {
  const isSearching = squad.status === SquadStatus.SEARCHING;
  const isMember = user && squad.memberIds.includes(user.uid);
  const isLeader = user && squad.leaderId === user.uid;
  const [showChat, setShowChat] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#15151A] border-l-4 border-neon-green p-4 md:p-5 flex flex-col gap-3 relative group transition-all"
    >
      <div className="absolute top-2 right-2">
        <span className="text-sm md:text-xl font-black text-white/5 italic group-hover:text-neon-green/10">
          #{squad.id.slice(-2).toUpperCase()}
        </span>
      </div>
      
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <span className="text-[10px] font-mono bg-neon-green text-black px-1.5 py-0.5 mr-2 font-bold uppercase shrink-0">
            {squad.gameId}
          </span>
          <h3 className="text-base md:text-lg font-bold text-white tracking-tight truncate mt-1">{squad.title}</h3>
        </div>
      </div>

      <div className="flex gap-4 items-center py-2">
        <div className="flex -space-x-2">
          {squad.members.slice(0, 3).map((m, idx) => (
            <div key={`${m.uid}-${idx}`} className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-[#15151A] overflow-hidden">
               <img src={`https://ui-avatars.com/api/?name=${m.displayName}&background=random`} alt="" className="w-full h-full object-cover opacity-50" />
            </div>
          ))}
          {squad.members.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-neon-green border-2 border-[#15151A] flex items-center justify-center text-black text-[10px] font-bold">
              +{squad.members.length - 3}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/40 font-mono leading-none tracking-widest uppercase">RANGO // AMBIENTE</span>
          <span className="text-xs text-white/70 font-mono font-bold">{squad.rankLimit} // {squad.vibe}</span>
        </div>
      </div>

      <AnimatePresence>
        {isDeleting && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border-2 border-red-500 p-4 flex flex-col gap-3 rounded-lg z-10"
          >
            <p className="text-sm font-mono text-red-500 text-center uppercase font-black">¿DESINTEGRAR_SQUAD_AHORA?</p>
            <div className="flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(squad.id); }} 
                className="flex-1 bg-red-500 text-white font-mono text-xs py-2 font-black border-2 border-red-600 hover:bg-red-600 transition-colors"
              >
                SÍ_BORRAR
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }} 
                className="flex-1 bg-white/10 text-white font-mono text-xs py-2 font-black hover:bg-white/20 transition-colors"
              >
                ABORTAR
              </button>
            </div>
          </motion.div>
        )}

        {isLeaving && (
           <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border-2 border-red-500 p-4 flex flex-col gap-3 rounded-lg z-10"
          >
            <p className="text-sm font-mono text-red-500 text-center uppercase font-black">¿SOLICITAR_BAJA_SQUAD?</p>
            <div className="flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onLeave(squad.id); }} 
                className="flex-1 bg-red-500 text-white font-mono text-xs py-2 font-black border-2 border-red-600 hover:bg-red-600 transition-colors"
              >
                SÍ_SALIR
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsLeaving(false); }} 
                className="flex-1 bg-white/10 text-white font-mono text-xs py-2 font-black hover:bg-white/20 transition-colors"
              >
                ABORTAR
              </button>
            </div>
          </motion.div>
        )}

        {showMembers && isMember && !isDeleting && !isLeaving && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-2 py-2"
          >
            <label className="mono-label text-[8px]">Valorar_Compañeros</label>
            {squad.members.filter(m => m.uid !== user.uid).map((m, idx) => (
              <div 
                key={`${m.uid}-${idx}`} 
                className={`flex justify-between items-center bg-white/5 p-3 brutal-border rounded-sm border-l-2 transition-colors ${
                  ((m as any).reputation ?? 0) > 0 ? 'border-neon-green/50 border-l-neon-green' : 
                  ((m as any).reputation ?? 0) < 0 ? 'border-red-500/50 border-l-red-500' : 
                  'border-white/10 hover:border-neon-green/30'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase truncate max-w-[120px] text-white/90">{m.displayName}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-neon-green rounded-full shadow-[0_0_5px_rgba(0,255,65,0.5)]"></div>
                    <span className="text-[8px] font-mono text-neon-green/70">REP_LVL: {(m as any).reputation ?? 0}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onVote(m, 1); 
                    }} 
                    className="w-10 h-10 text-neon-green bg-neon-green/10 p-2 rounded-lg border border-neon-green/20 hover:bg-neon-green hover:text-black transition-all flex items-center justify-center group/btn active:scale-95"
                    title="Buen Jugador (+1)"
                  >
                    <ThumbsUp size={18} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onVote(m, -1); 
                    }} 
                    className="w-10 h-10 text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center group/btn active:scale-95"
                    title="Mal Jugador (-1)"
                  >
                    <ThumbsDown size={18} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
        
        {showChat && isMember && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Chat squadId={squad.id} user={user} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-2 flex flex-wrap gap-2">
        {!isMember ? (
          <button
            onClick={() => onJoin(squad.id)}
            disabled={!isSearching}
            className={`flex-1 py-2.5 font-mono text-xs font-black uppercase tracking-widest transition-all
              ${isSearching 
                ? 'bg-white text-black hover:bg-neon-green hover:shadow-[0_0_15px_rgba(0,255,65,0.3)]' 
                : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
              }`}
          >
            {isSearching ? 'AUTORIZAR_UNIÓN' : 'SQUAD_LLENO'}
          </button>
        ) : (
          <>
            <button 
              onClick={() => setShowChat(!showChat)}
              className={`flex-1 min-w-[70px] py-2 flex items-center justify-center gap-2 border transition-all uppercase text-[10px] font-bold
                ${showChat ? 'bg-neon-green text-black border-neon-green' : 'border-white/10 text-white/50 hover:border-white/30'}`}
            >
              <MessageSquare size={14} />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`flex-1 min-w-[70px] py-2 flex items-center justify-center gap-2 border transition-all uppercase text-[10px] font-bold
                ${showMembers ? 'bg-neon-green text-black border-neon-green' : 'border-white/10 text-white/50 hover:border-white/30'}`}
            >
              <Users size={14} />
              <span className="hidden sm:inline">Votar</span>
            </button>
            {isLeader ? (
              <button 
                onClick={() => setIsDeleting(true)}
                className="px-3 py-2 border border-white/10 text-white/30 hover:border-red-500 hover:text-red-500 transition-all uppercase text-[10px] font-bold flex items-center gap-2"
                title="Desintegrar Squad"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Borrar</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsLeaving(true)}
                className="px-3 py-2 border border-white/10 text-white/30 hover:border-red-500 hover:text-red-500 transition-all uppercase text-[10px] font-bold flex items-center gap-2"
                title="Abandonar Squad"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
