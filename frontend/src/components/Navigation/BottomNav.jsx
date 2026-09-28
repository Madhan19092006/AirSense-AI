import React from 'react';
import { 
  Home, 
  Cpu, 
  Map, 
  Navigation, 
  Bell 
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navTabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'forecast', label: 'Forecast', icon: Cpu },
    { id: 'heatmap', label: 'Map', icon: Map },
    { id: 'route', label: 'Route', icon: Navigation },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-1.5 shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 cursor-pointer min-w-[56px] ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${
                isActive ? 'scale-110 bg-emerald-500/15' : ''
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
