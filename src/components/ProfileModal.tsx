import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Gamepad2, Star, Edit3, Save, LogOut, Plus, Minus, Camera } from 'lucide-react';
import { UserProfile } from '../types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface ProfileModalProps {
  user: any;
  profile: UserProfile | null;
  onClose: () => void;
}

const AVAILABLE_GAMES = [
  { id: 'valorant', name: 'Valorant' },
  { id: 'lol', name: 'League of Legends' },
  { id: 'cs2', name: 'Counter-Strike 2' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'fortnite', name: 'Fortnite' },
  { id: 'apex', name: 'Apex Legends' },
  { id: 'dota2', name: 'Dota 2' },
  { id: 'r6', name: 'Rainbow Six Siege' }
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, profile, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || user.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [games, setGames] = useState<Record<string, any>>(profile?.games || {});
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName,
        bio: bio,
        photoURL: photoURL,
        games: games,
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
      setShowGamePicker(false);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for firestore strings if base64, but ideally use storage
        alert("La imagen es demasiado grande. Máximo 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleGame = (gameId: string) => {
    const newGames = { ...games };
    if (newGames[gameId]) {
      delete newGames[gameId];
    } else {
      newGames[gameId] = {
        rank: 'UNRANKED',
        role: 'PLAYER',
        vibe: 'chill',
        availability: { from: '00:00', to: '23:59' }
      };
    }
    setGames(newGames);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      onClose();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const activeGameIds = Object.keys(games);
  const inactiveGames = AVAILABLE_GAMES.filter(g => !activeGameIds.includes(g.id));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-void/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-nebula w-full max-w-3xl border-l-4 border-neon-purple p-6 shadow-[0_0_50px_rgba(124,58,237,0.2)] flex flex-col md:flex-row gap-6 relative overflow-y-auto max-h-[90vh]"
      >
        {/* Profile Sidebar */}
        <div className="flex flex-col items-center gap-4 shrink-0 md:w-56">
          <div 
            className={`relative group cursor-pointer ${isEditing ? 'ring-2 ring-neon-green ring-offset-2 ring-offset-void' : ''}`}
            onClick={() => isEditing && fileInputRef.current?.click()}
          >
            <img 
              src={photoURL || (profile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=7C3AED&color=fff`)} 
              alt={user.displayName || ''} 
              className="w-28 h-28 rounded-sm border-2 border-neon-purple shadow-[0_0_20px_rgba(124,58,237,0.4)] object-cover bg-void"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
                <Camera size={24} className="text-white mb-1" />
                <span className="text-[8px] font-mono font-bold">CAMBIAR_FOTO</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
            <div className="absolute -bottom-2 -right-2 bg-neon-purple text-void font-black px-2 py-1 text-[10px] italic">LVL_99</div>
          </div>

          <div className="text-center w-full space-y-2">
            {isEditing ? (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="NOMBRE_DE_PERFIL"
                className="w-full bg-void border-b border-neon-purple text-lg font-black italic uppercase text-center outline-none focus:border-neon-green transition-colors"
              />
            ) : (
              <h2 className="text-xl font-black italic uppercase tracking-tighter truncate max-w-full">
                {displayName || profile?.displayName || user.displayName}
              </h2>
            )}
            <p className="font-mono text-[9px] text-neon-purple/60 uppercase">PLAYER_BIT: {user.uid.slice(0, 8)}</p>
            
            <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-white/5 rounded-sm border border-white/5 w-full">
               <Star className="text-yellow-400 fill-yellow-400" size={10} />
               <span className="text-xs font-black italic">{profile?.reputation ?? 0} REP</span>
            </div>

            <div className="w-full py-1 px-2 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center gap-2">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0">
                <div className="w-full h-full bg-blue-500 scale-150 rotate-45 transform translate-x-1 translate-y-1"></div>
                <div className="absolute text-[8px] text-white font-bold">G</div>
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-[7px] font-mono text-blue-400 uppercase leading-none">Net_Conectada</span>
                <span className="text-[9px] font-bold text-white/70 truncate w-full text-left">{user.email}</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-1.5 border border-red-500/30 text-red-500 font-mono text-[8px] font-black uppercase hover:bg-red-500 hover:text-white transition-all group/logout"
            >
              <LogOut size={10} className="group-hover/logout:translate-x-0.5 transition-transform" />
              CERRAR_SESIÓN
            </button>
          </div>
        </div>

        {/* Main Info Area */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          <div className="flex justify-between items-center bg-white/5 p-3 brutal-border-sm border-l-2 border-neon-purple">
            <span className="mono-label text-[10px] text-white/50">EXPEDIENTE_USUARIO // COD_PROFILE</span>
            <div className="flex gap-2">
              {isEditing ? (
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-neon-green text-black px-3 py-1 font-black italic text-[10px] uppercase hover:bg-white transition-all disabled:opacity-50"
                >
                  <Save size={12} />
                  {loading ? '...' : 'CONFIRMAR'}
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 font-black italic text-[10px] uppercase hover:bg-neon-purple hover:border-neon-purple transition-all"
                >
                  <Edit3 size={12} />
                  MODIFICAR
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:text-red-500 transition-colors text-white/30">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full">
            {/* Bio Section */}
            <div className="bg-white/3 p-4 brutal-border flex flex-col min-h-[140px]">
              <label className="mono-label block mb-2 uppercase text-[9px] text-neon-purple">Bio_Log</label>
              {isEditing ? (
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="flex-1 bg-void border border-neon-purple/20 p-2 text-xs font-mono text-white outline-none focus:border-neon-purple resize-none"
                  placeholder="Insertar datos biográficos..."
                />
              ) : (
                <p className="text-[11px] font-mono text-white/70 italic leading-relaxed overflow-y-auto max-h-[120px]">
                  "{profile?.bio || "Sin biografía definida en el sistema."}"
                </p>
              )}
            </div>

            {/* Games Section */}
            <div className="flex flex-col min-w-0">
              <div className="flex justify-between items-center mb-2">
                <label className="mono-label block uppercase text-[9px] text-neon-purple">Stack_Comunicaciones</label>
                {isEditing && (
                  <button 
                    onClick={() => setShowGamePicker(!showGamePicker)}
                    className={`p-1 rounded-sm transition-all ${showGamePicker ? 'bg-neon-purple text-void rotate-45' : 'bg-neon-purple/10 text-neon-purple hover:bg-neon-purple hover:text-white'}`}
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              
              <div className="flex-1 min-h-[140px] overflow-y-auto pr-1 space-y-1">
                <AnimatePresence mode="popLayout">
                  {activeGameIds.length > 0 ? activeGameIds.map(gameId => {
                    const game = AVAILABLE_GAMES.find(g => g.id === gameId);
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        key={gameId} 
                        className="flex justify-between items-center p-2 bg-white/5 border border-white/5 hover:border-neon-purple/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Gamepad2 size={12} className="text-neon-purple" />
                          <span className="text-[9px] font-bold font-display uppercase tracking-tight">{game?.name || gameId}</span>
                        </div>
                        {isEditing ? (
                          <button 
                            onClick={() => toggleGame(gameId)}
                            className="text-red-500/50 hover:text-red-500 p-0.5"
                          >
                            <Minus size={12} />
                          </button>
                        ) : (
                          <div className="w-1.5 h-1.5 bg-neon-green rounded-full shadow-[0_0_5px_rgba(0,255,65,0.4)]"></div>
                        )}
                      </motion.div>
                    );
                  }) : !isEditing && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 border border-dashed border-white/10 rounded-sm">
                      <Gamepad2 size={24} />
                      <span className="text-[8px] mt-2">NO_STACK_DETECTED</span>
                    </div>
                  )}
                </AnimatePresence>

                {isEditing && showGamePicker && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 gap-1 mt-2"
                  >
                    {inactiveGames.map(game => (
                      <button
                        key={game.id}
                        onClick={() => toggleGame(game.id)}
                        className="flex items-center justify-between p-2 bg-void border border-dashed border-white/10 hover:border-neon-purple text-left transition-all"
                      >
                        <span className="text-[8px] font-bold text-white/50 uppercase truncate">{game.name}</span>
                        <Plus size={8} className="text-white/20" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
