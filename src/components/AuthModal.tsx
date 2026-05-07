import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Loader2, LogIn } from 'lucide-react';
import { loginWithGoogle, registerWithEmail, loginWithEmail } from '../lib/firebase';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        if (!name) throw new Error('El nombre es obligatorio');
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error con Google Auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-void/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-nebula w-full max-w-md border-l-4 border-neon-green p-8 shadow-[0_0_50px_rgba(0,255,65,0.1)] relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setIsRegister(false)}
              className={`text-sm font-black italic uppercase tracking-tighter pb-1 border-b-2 transition-all ${!isRegister ? 'text-neon-green border-neon-green' : 'text-white/30 border-transparent hover:text-white'}`}
            >
              INGRESAR_SISTEMA
            </button>
            <button 
              onClick={() => setIsRegister(true)}
              className={`text-sm font-black italic uppercase tracking-tighter pb-1 border-b-2 transition-all ${isRegister ? 'text-neon-green border-neon-green' : 'text-white/30 border-transparent hover:text-white'}`}
            >
              NUEVO_REGISTRO
            </button>
          </div>

          <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">
            {isRegister ? 'REGISTRAR_PILOTO' : 'IDENTIFICAR_USUARIO'}
          </h2>
          <p className="text-xs font-mono text-white/40 uppercase">Acceso restringido a la red GamerMatch</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="mono-label text-[10px]">NOMBRE_DE_PILA</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-void border border-white/10 p-3 pl-10 text-xs font-mono text-white outline-none focus:border-neon-green transition-all"
                  placeholder="NOM_DISPLAY"
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="mono-label text-[10px]">CORREO_ELECTRÓNICO</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-void border border-white/10 p-3 pl-10 text-xs font-mono text-white outline-none focus:border-neon-green transition-all"
                placeholder="USER@NETWORK.COM"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="mono-label text-[10px]">CÓDIGO_ACCESO</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-void border border-white/10 p-3 pl-10 text-xs font-mono text-white outline-none focus:border-neon-green transition-all"
                placeholder="********"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono uppercase italic">
              ERROR_SISTEMA: {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-neon-green text-black font-black italic uppercase tracking-tighter hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : (
              <>
                <LogIn size={18} />
                <span>{isRegister ? 'COMPLETAR_REGISTRO' : 'INICIAR_SESIÓN'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span className="text-[9px] font-mono text-white/30 uppercase">O_CONECTAR_VÍA</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 border border-white/10 text-white/70 font-mono text-[10px] font-bold uppercase hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-3"
          >
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0">
              <div className="w-full h-full bg-blue-500 scale-150 rotate-45 transform translate-x-1 translate-y-1 relative">
                 <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-black rotate-[-45deg] scale-[0.6]">G</div>
              </div>
            </div>
            ACCEDER_CON_GOOGLE_ID
          </button>
        </div>

        <p className="mt-8 text-center text-[8px] font-mono text-white/20 uppercase leading-relaxed tracking-widest">
          Al acceder, aceptas los protocolos de privacidad y términos de servicio de la red GamerMatch v4.0.2
        </p>
      </motion.div>
    </motion.div>
  );
};
