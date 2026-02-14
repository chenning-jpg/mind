import React from 'react';
import { AppView } from '../types';
import { Leaf, MessageCircleHeart, BookOpen, Store } from 'lucide-react';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: AppView.FOREST, icon: Leaf, label: '森林' },
    { view: AppView.CHAT, icon: MessageCircleHeart, label: '转化' },
    { view: AppView.ARCHIVE, icon: BookOpen, label: '档案' },
    { view: AppView.MARKET, icon: Store, label: '市集' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="bg-black/90 backdrop-blur-xl text-white rounded-full p-2 shadow-2xl flex gap-1 pointer-events-auto shadow-black/20">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`
                relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300
                ${isActive ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'}
              `}
            >
              <item.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && (
                <span className="absolute -bottom-8 text-black bg-white/90 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shadow-sm fade-in whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Navigation;