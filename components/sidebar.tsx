"use client";

import { MessageCircle, BookOpen, Network, Database, Settings, Cloud, Monitor } from 'lucide-react';
import Image from 'next/image';
import { useSettings } from '@/hooks/use-settings';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { settings, triggerHaptic, isLoaded, getEffectiveTheme } = useSettings();

  const navItems = [
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'historial', icon: BookOpen, label: 'Historial' },
    { id: 'telarana', icon: Network, label: 'Telaraña' },
    { id: 'buffer', icon: Database, label: 'Buffer' },
    { id: 'ajustes', icon: Settings, label: 'Ajustes' },
  ];

  const handleNavClick = (view: string) => {
    triggerHaptic(30);
    onNavigate(view);
  };

  // Get mode info
  const modeInfo = isLoaded && settings.mode === 'pc' 
    ? { icon: Monitor, label: 'Modo PC', color: 'bg-blue-500' }
    : { icon: Cloud, label: 'Modo Nube', color: 'bg-[var(--color-success)]' };

  return (
    <aside className="flex w-64 bg-[var(--color-primary)] flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-poppins font-bold text-[var(--color-background)] text-center">Kaede</h1>
        
        {/* Avatar */}
        <div className="mt-4 flex justify-center">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-3 border-[var(--color-accent)] shadow-lg">
            <Image
              src="/avatar.jpg"
              alt="Kaede Avatar"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Mode Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 bg-white/10 rounded-full py-2 px-4">
          <span className={`w-2 h-2 rounded-full ${modeInfo.color} animate-pulse`}></span>
          <modeInfo.icon size={14} className="text-white/80" />
          <span className="text-xs text-white/80">{modeInfo.label}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === id
                ? 'bg-[var(--color-background)] text-[var(--color-primary)]'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            {currentView === id && (
              <span className="absolute left-0 w-1 h-8 bg-[var(--color-accent)] rounded-r"></span>
            )}
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/50 text-center">
          v3.0 • Fase 3 {getEffectiveTheme() === 'dark' ? '🌙' : '☀️'}
        </p>
      </div>
    </aside>
  );
}
