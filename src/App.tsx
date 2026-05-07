import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit, 
  addDoc,
  deleteDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  where,
  getDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import { db, auth, loginWithGoogle } from './lib/firebase';
import { SquadCard } from './components/SquadCard';
import { CreateSquadModal } from './components/CreateSquadModal';
import { ProfileModal } from './components/ProfileModal';
import { Squad, SquadStatus, UserProfile } from './types';
import { 
  LayoutDashboard, 
  Users, 
  User, 
  Bell, 
  Gamepad2, 
  Plus,
  Loader2,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filterGame, setFilterGame] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    const authUnsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Real-time profile listener
        const userDocRef = doc(db, 'users', u.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.data() as UserProfile);
          } else {
            // Auto-create profile if missing
            setDoc(userDocRef, {
              uid: u.uid,
              displayName: u.displayName || 'Player',
              photoURL: u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || 'P'}&background=7C3AED&color=fff`,
              reputation: 0,
              games: {},
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        });
      } else {
        setUserProfile(null);
        unsubscribeProfile();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribeProfile();
    };
  }, []);

  const [topPlayers, setTopPlayers] = useState<UserProfile[]>([]);
  useEffect(() => {
    if (!user) {
      setTopPlayers([]);
      return;
    }
    const q = query(
      collection(db, 'users'),
      orderBy('reputation', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTopPlayers(snapshot.docs.map(d => d.data() as UserProfile));
    }, (error) => {
      console.warn("Ranking sync limited:", error.message);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let q = query(
      collection(db, 'squads'),
      where('status', '==', SquadStatus.SEARCHING),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    if (filterGame) {
      q = query(
        collection(db, 'squads'),
        where('status', '==', SquadStatus.SEARCHING),
        where('gameId', '==', filterGame),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Squad));
      setSquads(data);
      setLoading(false);
    }, (error) => {
      console.error("Squads sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterGame]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateSquad = async (data: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'squads'), {
        ...data,
        leaderId: user.uid,
        memberIds: [user.uid],
        members: [{
          uid: user.uid,
          displayName: user.displayName,
          role: 'Líder',
          status: 'ready'
        }],
        status: SquadStatus.SEARCHING,
        createdAt: serverTimestamp()
      });
      setIsCreating(false);
    } catch (err) {
      console.error("Error al crear squad:", err);
      alert("Error al iniciar instancia de squad.");
    }
  };
  const handleVote = async (targetUser: { uid: string, displayName: string, photoURL?: string }, value: number) => {
    if (!user) return;
    if (user.uid === targetUser.uid) return; 
    
    console.log(`[VOTE] Attempting vote for ${targetUser.uid} (${targetUser.displayName}) with value ${value}`);
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log(`[VOTE] Target user profile not found, initializing...`);
        await setDoc(userRef, {
          uid: targetUser.uid,
          displayName: targetUser.displayName || 'Player',
          photoURL: targetUser.photoURL || `https://ui-avatars.com/api/?name=${targetUser.displayName || 'P'}&background=random`,
          reputation: value,
          games: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(userRef, {
          reputation: increment(value),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`[VOTE] Vote successful for ${targetUser.uid}`);
    } catch (err: any) {
      console.error("[VOTE] Error:", err);
      const errorMsg = err.message || 'Denegado por el sistema';
      alert(`ERROR_SISTEMA: No se pudo registrar la valoración. ${errorMsg}`);
    }
  };

  const handleJoinRequest = async (squadId: string) => {
    if (!user) return alert('Debes iniciar sesión para unirte a un squad.');
    
    console.log(`[JOIN] Request for squad ${squadId}`);
    const targetSquad = squads.find(s => s.id === squadId);
    if (!targetSquad) return;
    if (targetSquad.memberIds.includes(user.uid)) return alert('Ya eres miembro de este squad.');
    if (targetSquad.memberIds.length >= targetSquad.maxMembers) return alert('El squad está lleno.');

    try {
      const squadRef = doc(db, 'squads', squadId);
      const newMember: any = {
        uid: user.uid,
        displayName: user.displayName || 'Player',
        role: 'Miembro',
        status: 'ready'
      };

      if (userProfile) {
        newMember.reputation = userProfile.reputation || 0;
      }

      await updateDoc(squadRef, {
        memberIds: arrayUnion(user.uid),
        members: arrayUnion(newMember)
      });
      
      console.log(`[JOIN] Success for squad ${squadId}`);
      alert('¡CONEXIÓN_ESTABLECIDA: Te has unido!');
    } catch (err: any) {
      console.error("[JOIN] Error:", err);
      alert(`ERROR_CONEXIÓN: ${err.message || 'Inténtalo de nuevo'}`);
    }
  };

  const handleLeaveSquad = async (squadId: string) => {
    if (!user) return;
    console.log(`[LEAVE] Attempting for squad ${squadId}`);
    const targetSquad = squads.find(s => s.id === squadId);
    if (!targetSquad) return;
    
    if (targetSquad.leaderId === user.uid) {
      console.log(`[LEAVE] Leader leaving, calling delete`);
      return handleDeleteSquad(squadId);
    }

    try {
      const squadRef = doc(db, 'squads', squadId);
      const memberToRemove = targetSquad.members.find(m => m.uid === user.uid);
      
      if (!memberToRemove) {
        console.warn(`[LEAVE] Member object not found in list`);
        return;
      }

      await updateDoc(squadRef, {
        memberIds: arrayRemove(user.uid),
        members: arrayRemove(memberToRemove)
      });
      console.log(`[LEAVE] Success for squad ${squadId}`);
      alert('PROTOCOL_SALIDA_COMPLETADO: Has abandonado el squad.');
    } catch (err: any) {
      console.error("[LEAVE] Error:", err);
      alert(`DENEGADO_SALIDA: ${err.message}`);
    }
  };

  const handleDeleteSquad = async (squadId: string) => {
    console.log(`[DELETE] Attempting for squad ${squadId}`);
    try {
      const squadRef = doc(db, 'squads', squadId);
      await deleteDoc(squadRef);
      console.log(`[DELETE] Success for squad ${squadId}`);
      alert('SQUAD_DESINTEGRADO: Todos los enlaces han sido cortados.');
    } catch (err: any) {
      console.error("[DELETE] Error:", err);
      alert(`FALLO_SISTEMA_BORRADO: Solo el líder puede purgar el squad. ${err.message}`);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-void overflow-hidden text-on-surface select-none">
      {/* Modales */}
      <AnimatePresence>
        {isCreating && (
          <CreateSquadModal 
            onClose={() => setIsCreating(false)} 
            onSubmit={handleCreateSquad} 
          />
        )}
        {isProfileOpen && user && (
          <ProfileModal 
            user={user} 
            profile={userProfile} 
            onClose={() => setIsProfileOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Navegación Superior */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 bg-nebula shrink-0 z-40 relative">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 md:hidden text-white/70 hover:text-white"
          >
            <LayoutDashboard size={20} />
          </button>
          <div className="w-8 h-8 bg-neon-green rounded-sm flex items-center justify-center text-black font-black italic shadow-[0_0_15px_rgba(0,255,65,0.2)] shrink-0">GM</div>
          <h1 className="text-sm md:text-xl font-bold tracking-tighter font-display uppercase truncate">
            GAMERMATCH <span className="hidden sm:inline text-neon-green/40 text-[10px] font-mono ml-2 tracking-normal">v4.0.2_EXP</span>
          </h1>
        </div>
        
        <div className="flex gap-4 md:gap-8 items-center">
          <div className="hidden lg:flex flex-col items-end">
            <span className="mono-label">Estado del Sistema</span>
            <span className="text-[10px] font-mono text-neon-green animate-pulse">● WS_CONEXIÓN_SEGURA</span>
          </div>
          {user ? (
            <div 
              className="flex items-center gap-2 md:gap-3 cursor-pointer group"
              onClick={() => setIsProfileOpen(true)}
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold leading-none group-hover:text-neon-green transition-colors">{user.displayName}</span>
                <span className="text-[9px] font-mono text-neon-green uppercase">JUGADOR_ACTIVO</span>
              </div>
              <img 
                src={userProfile?.photoURL || user.photoURL || ''} 
                alt={user.displayName || ''} 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-neon-green shadow-[0_0_10px_rgba(0,255,65,0.2)] group-hover:scale-105 transition-transform"
              />
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-4 md:px-6 py-2 border border-neon-green text-neon-green font-mono text-[10px] md:text-xs font-bold uppercase hover:bg-neon-green hover:text-black transition-all"
            >
              {isLoggingIn ? "SICRONIZANDO..." : "Iniciar"}
            </button>
          )}
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Izquierda: Filtros */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 border-r border-white/10 bg-nebula p-6 flex flex-col gap-8 transition-transform duration-300 md:relative md:translate-x-0
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex justify-between items-center md:hidden mb-2">
            <span className="mono-label">MENÚ_SISTEMA</span>
            <button onClick={() => setIsMenuOpen(false)} className="text-white/30"><Plus className="rotate-45" size={20}/></button>
          </div>
          <div>
            <label className="mono-label block mb-4">Protocolo de Juego</label>
            <ul className="space-y-3 font-display">
              <li 
                onClick={() => { setFilterGame(null); setIsMenuOpen(false); }}
                className={`flex justify-between items-center px-3 py-2.5 rounded-sm cursor-pointer font-black italic text-sm transition-all ${!filterGame ? 'bg-neon-green text-black shadow-[0_0_15px_rgba(0,255,65,0.3)]' : 'text-white/50 border border-white/5 hover:bg-white/5'}`}
              >
                <span>TODOS_LOS_SQUADS</span>
                {!filterGame && <span className="text-[10px] font-mono opacity-50">SELECTED</span>}
              </li>
              {[
                { id: 'valorant', name: 'Valorant' },
                { id: 'lol', name: 'League of Legends' },
                { id: 'cs2', name: 'Counter-Strike 2' },
                { id: 'minecraft', name: 'Minecraft' }
              ].map(game => (
                <li 
                  key={game.id} 
                  onClick={() => { setFilterGame(game.id); setIsMenuOpen(false); }}
                  className={`flex justify-between items-center px-3 py-2.5 border rounded-sm cursor-pointer transition-all text-sm font-bold ${filterGame === game.id ? 'bg-neon-green text-black border-neon-green' : 'text-white/50 border-white/5 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>{game.name.toUpperCase()}</span>
                  {filterGame === game.id && <span className="text-[10px] font-mono opacity-50 italic">ACTIVE</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto md:mt-0">
            <label className="mono-label block mb-4">Ajuste de Red</label>
            <div className="bg-white/5 p-4 brutal-border rounded-sm">
              <span className="text-[9px] font-mono block text-white/30">ALGORITMO_MATCHMAKING</span>
              <p className="text-xs font-black mt-1 uppercase">Índice_Compatibilidad_X</p>
              <div className="h-1 w-full bg-white/10 mt-3 rounded-full overflow-hidden">
                <div className="h-full w-[88%] bg-neon-green shadow-[0_0_5px_rgba(0,255,65,1)]"></div>
              </div>
              <span className="text-[10px] text-neon-green font-mono mt-2 block">OPTIMIZADO // 88%</span>
            </div>
          </div>
        </aside>

        {/* Overlay para móvil */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-void/80 backdrop-blur-sm z-20 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Feed Principal */}
        <main className="flex-1 p-4 md:p-8 grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 content-start overflow-y-auto scrollbar-hide bg-[#0D0D12]">
          <div className="col-span-full flex flex-col lg:flex-row lg:items-baseline justify-between mb-4 gap-2 border-b border-white/5 pb-2">
            <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase">Escuadrones_En_Vivo</h2>
            <div className="flex gap-4 font-mono text-[9px] md:text-[10px] items-center">
              <span className="text-white/40 tracking-widest px-2 py-0.5 bg-white/5">FILTRADO:</span>
              <span className="text-neon-green border-b border-neon-green/30 cursor-pointer hover:text-white transition-colors">LATENCIA_MÍNIMA</span>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="animate-spin text-neon-green" size={48} />
                <span className="font-mono text-xs text-neon-green tracking-[0.2em]">OBTENIENDO_DATOS...</span>
              </div>
            ) : squads.length > 0 ? (
              squads.map(squad => (
                <SquadCard 
                  key={squad.id} 
                  squad={squad} 
                  onJoin={handleJoinRequest} 
                  onDelete={handleDeleteSquad}
                  onLeave={handleLeaveSquad}
                  onVote={handleVote}
                  user={user} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-24 brutal-border bg-white/2 border-dashed">
                <Users className="mx-auto mb-4 text-white/5" size={64} />
                <h3 className="font-display text-xl text-white italic font-black uppercase">Sin_Resultados</h3>
                <p className="text-white/30 font-mono text-xs">No se detectan pulsos de squad en tu sector.</p>
              </div>
            )}
          </AnimatePresence>
        </main>

        {/* Sidebar Derecha: Estadísticas y Actividad */}
        <aside className="hidden lg:flex w-80 border-l border-white/10 bg-void p-6 flex flex-col shrink-0">
          <div className="flex flex-col h-full">
            <div className="mb-8">
              <h3 className="mono-label mb-4">Tráfico_En_Vivo</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-2 opacity-60">
                    <span>LATENCIA_WS</span>
                    <span className="text-neon-green">12ms</span>
                  </div>
                  <div className="h-8 flex items-end gap-[2px]">
                    {[20, 40, 30, 50, 60, 80, 40].map((h, i) => (
                      <div key={i} className="flex-1 bg-neon-green/20" style={{ height: `${h}%` }}>
                        <div className={`w-full bg-neon-green ${h > 60 ? 'opacity-80' : 'opacity-40'}`} style={{ height: '30%' }}></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 brutal-border">
                    <span className="text-[9px] text-white/30 block mono-label !tracking-normal">Jugadores</span>
                    <span className="text-xl font-black italic">14.2k</span>
                  </div>
                  <div className="bg-white/5 p-3 brutal-border">
                    <span className="text-[9px] text-white/30 block mono-label !tracking-normal">Tasa_Sincro</span>
                    <span className="text-xl font-black italic">0.04s</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
              <h3 className="mono-label mb-4">Top_Jugadores_Rep</h3>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {topPlayers.map((p, i) => (
                    <motion.div 
                      key={`${p.uid}-${i}`} 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`flex items-center gap-3 bg-white/5 p-2 brutal-border border-l-2 transition-colors ${
                        (p.reputation ?? 0) > 0 ? 'border-neon-green/50 border-l-neon-green' : 
                        (p.reputation ?? 0) < 0 ? 'border-red-500/50 border-l-red-500' : 
                        'border-white/10 border-l-neon-green/30'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-neon-green font-bold">#{i+1}</span>
                      <img src={p.photoURL} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-[10px] font-bold truncate uppercase">{p.displayName}</span>
                        <div className="flex items-center gap-1">
                          <Trophy size={8} className="text-neon-green" />
                          <span className="text-[8px] font-mono text-white/40">REP: {p.reputation ?? 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 shrink-0">
              <div className="flex items-center gap-3 text-[10px] text-white/20 italic font-mono uppercase tracking-widest">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_5px_rgba(0,255,65,0.5)]"></div>
                Feed_Seguro_Activo
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Acción Flotante */}
      {user && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(true)}
          className="fixed bottom-6 right-6 md:right-[340px] px-6 md:px-8 py-3 bg-neon-green text-black font-display font-black italic uppercase tracking-tighter shadow-[0_0_30px_rgba(0,255,65,0.4)] flex items-center gap-2 z-40 rounded-sm"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nueva_Instancia_Squad</span>
          <span className="sm:hidden font-mono text-[10px]">CREAR</span>
        </motion.button>
      )}
    </div>
  );
}

function NavLink({ icon, label, active, count }: { icon: React.ReactNode, label: string, active?: boolean, count?: number }) {
  return (
    <motion.div 
      whileTap={{ y: -2 }}
      className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative
        ${active ? 'text-neon-purple drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]' : 'text-on-surface-variant hover:text-white'}
      `}
    >
      <div className="relative">
        {icon}
        {count && (
          <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold border border-void">
            {count}
          </span>
        )}
      </div>
      <span className="font-display text-[9px] font-black uppercase tracking-widest">{label}</span>
    </motion.div>
  );
}
