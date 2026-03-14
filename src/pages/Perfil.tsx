import { TopHeader } from '@/components/layout/TopHeader';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { signOut } from '@/hooks/useAuth';

export default function Perfil() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      <TopHeader title="Perfil" />
      <motion.div
        className="px-5 pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Avatar section */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-2xl shadow-sm" style={{ border: '1px solid hsl(var(--border))' }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
          >
            👤
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              Meu Perfil
            </p>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              Administrador da família
            </p>
          </div>
        </div>

        {/* Menu items */}
        {[
          { emoji: '👨‍👩‍👧', label: 'Minha Família', desc: 'Gerenciar grupo familiar' },
          { emoji: '🔔', label: 'Notificações', desc: 'Configurar lembretes' },
          { emoji: '🔒', label: 'Segurança', desc: 'Alterar senha' },
          { emoji: '📋', label: 'Sobre o Ninho', desc: 'Versão 1.0.0' },
        ].map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl mb-3 text-left shadow-sm transition-opacity hover:opacity-70"
            style={{ border: '1px solid hsl(var(--border))' }}
          >
            <span className="text-xl w-8 text-center">{item.emoji}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                {item.label}
              </p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                {item.desc}
              </p>
            </div>
          </button>
        ))}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full mt-4 py-3.5 rounded-2xl text-sm font-bold transition-opacity hover:opacity-80"
          style={{
            backgroundColor: 'hsl(0 84% 50% / 0.08)',
            color: 'hsl(0 84% 45%)',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          Sair da conta
        </button>
      </motion.div>
    </div>
  );
}
