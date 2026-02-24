"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/sidebar';
import { Menu, X, Cloud, Monitor } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';

const ChatView = dynamic(() => import('@/components/views/chat-view'), { ssr: false });
const HistorialView = dynamic(() => import('@/components/views/historial-view'), { ssr: false });
const TelaranaView = dynamic(() => import('@/components/views/telarana-view'), { ssr: false });
const BufferView = dynamic(() => import('@/components/views/buffer-view'), { ssr: false });
const AjustesView = dynamic(() => import('@/components/views/ajustes-view'), { ssr: false });

type View = 'chat' | 'historial' | 'telarana' | 'buffer' | 'ajustes';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings, isLoaded } = useSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleViewChange = (view: string) => {
    setCurrentView(view as View);
    setSidebarOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatView />;
      case 'historial':
        return <HistorialView />;
      case 'telarana':
        return <TelaranaView />;
      case 'buffer':
        return <BufferView />;
      case 'ajustes':
        return <AjustesView />;
      default:
        return <ChatView />;
    }
  };

  // Mode info for mobile header
  const modeInfo = isLoaded && settings.mode === 'pc'
    ? { icon: Monitor, dotColor: 'bg-blue-400' }
    : { icon: Cloud, dotColor: 'bg-green-400' };

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FFF6E9]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C4473D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6B6B]">Cargando Kaede...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex bg-[#FFF6E9] overflow-hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#0B1F3B] flex items-center justify-between px-4 z-40 md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-white hover:bg-[#1a3358] rounded-lg transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-white text-lg font-poppins font-semibold">Kaede</h1>
        {/* Mode indicator */}
        <div className="flex items-center gap-1.5 p-2">
          <span className={`w-2 h-2 rounded-full ${modeInfo.dotColor} animate-pulse`}></span>
          <modeInfo.icon size={18} className="text-white/80" />
        </div>
      </div>

      {/* Sidebar - Desktop always visible, Mobile toggle */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar currentView={currentView} onNavigate={handleViewChange} />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-0 h-full overflow-hidden pt-14 md:pt-0">
        {renderView()}
      </div>
    </main>
  );
}
