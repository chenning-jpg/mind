import React, { useState, useEffect } from 'react';
import { Tree } from '../types';

interface TreeVisualProps {
  tree: Tree;
  onClick?: () => void;
}

const TreeVisual: React.FC<TreeVisualProps> = ({ tree, onClick }) => {
  const [isCollecting, setIsCollecting] = useState(false);

  // Reset collecting state if tree stage changes (e.g., fruiting -> mature)
  useEffect(() => {
    if (tree.stage !== 'fruiting') {
      setIsCollecting(false);
    }
  }, [tree.stage]);

  const handleInteraction = (e: React.MouseEvent) => {
    if (tree.stage === 'fruiting') {
      e.stopPropagation();
      if (!isCollecting) {
        setIsCollecting(true);
        // Play animation for 600ms, then trigger the actual harvest logic (which is passed via onClick)
        setTimeout(() => {
          if (onClick) onClick();
        }, 600); 
      }
    } else {
      if (onClick) onClick();
    }
  };

  // Color Palette based on tree type - Updated for Pastel/Pop Look
  const isCherry = tree.type === 'cherry';
  const colors = {
    // Brighter, more pastel greens and pinks
    sapling: isCherry ? 'text-pink-400' : 'text-emerald-400',
    growing: isCherry ? 'text-pink-500' : 'text-emerald-500',
    mature: isCherry ? 'text-pink-500' : 'text-emerald-500', 
    fruiting: isCherry ? 'text-pink-600' : 'text-emerald-600',
    // Softer trunk colors
    trunk: isCherry ? '#8D6E63' : (tree.stage === 'growing' ? '#A1887F' : '#795548'),
    // Vibrant Orange/Gold for fruit to pop against pastel
    fruit: '#FB923C' 
  };

  // Define animations locally
  const styles = `
    @keyframes grow-pop {
      0% { opacity: 0; transform: scale(0.4) translateY(20px); }
      60% { opacity: 1; transform: scale(1.1) translateY(-5px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes sway {
      0% { transform: rotate(0deg); }
      25% { transform: rotate(1deg); }
      75% { transform: rotate(-1deg); }
      100% { transform: rotate(0deg); }
    }
    @keyframes fruit-appear {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.3); opacity: 1; }
      80% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes fruit-collect {
      0% { transform: scale(1) translateY(0); opacity: 1; }
      20% { transform: scale(1.4) translateY(-5px); filter: brightness(1.3); }
      100% { transform: scale(0) translateY(-40px); opacity: 0; }
    }

    .animate-grow {
      animation: grow-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      transform-origin: bottom center;
    }
    .animate-sway {
      animation: sway 4s ease-in-out infinite;
      transform-origin: bottom center;
    }
    
    .fruit-base {
      transform-origin: center;
      transform-box: fill-box;
    }
    
    .animate-fruit-appear {
      animation: fruit-appear 0.6s ease-out backwards;
    }
    
    .animate-fruit-collect {
      animation: fruit-collect 0.6s ease-in forwards;
      pointer-events: none; /* Prevent double clicks */
    }

    .fruit-interactive:hover {
      filter: brightness(1.2);
      transform: scale(1.2);
      transition: all 0.2s;
    }
  `;

  // Simple SVG representations for different stages
  const renderTree = () => {
    // We use tree.stage as key to trigger the animation when stage changes
    const commonProps = {
      viewBox: "0 0 100 100",
      key: tree.stage, 
      className: "w-full h-full animate-grow animate-sway drop-shadow-sm"
    };

    switch (tree.stage) {
      case 'sapling':
        return (
          <svg {...commonProps} className={`${commonProps.className} ${colors.sapling}`}>
            <path d="M50 90 L50 60 Q50 30 70 40" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <circle cx="70" cy="40" r="6" fill="currentColor" />
            <path d="M50 60 Q50 40 30 50" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <circle cx="30" cy="50" r="5" fill="currentColor" />
          </svg>
        );
      case 'growing':
        return (
          <svg {...commonProps} className={`${commonProps.className} ${colors.growing}`}>
            <path d="M50 90 L50 50" stroke={colors.trunk} strokeWidth="8" strokeLinecap="round" />
            <g className="animate-sway" style={{ animationDuration: '3s' }}>
              <circle cx="50" cy="40" r="28" fill="currentColor" opacity="0.9" />
              <circle cx="35" cy="50" r="18" fill="currentColor" opacity="0.8" />
              <circle cx="65" cy="50" r="18" fill="currentColor" opacity="0.8" />
            </g>
          </svg>
        );
      case 'mature':
        return (
          <svg {...commonProps} className={`${commonProps.className} ${colors.mature}`}>
             <path d="M50 90 L50 40" stroke={colors.trunk} strokeWidth="10" strokeLinecap="round" />
             <path d="M50 80 Q20 70 20 40 Q20 10 50 10 Q80 10 80 40 Q80 70 50 80" fill="currentColor" />
          </svg>
        );
      case 'fruiting':
        // Determine which class to use based on collection state
        const fruitClass = isCollecting 
          ? "fruit-base animate-fruit-collect" 
          : "fruit-base animate-fruit-appear fruit-interactive";

        return (
          <svg {...commonProps} className={`${commonProps.className} ${colors.fruiting}`}>
             <path d="M50 90 L50 40" stroke={colors.trunk} strokeWidth="12" strokeLinecap="round" />
             <path d="M50 85 Q10 75 10 35 Q10 5 50 5 Q90 5 90 35 Q90 75 50 85" fill="currentColor" />
             {/* Fruits Group */}
             <g>
               <circle className={fruitClass} cx="30" cy="30" r="7" fill={colors.fruit} style={isCollecting ? {} : { animationDelay: '100ms' }} />
               <circle className={fruitClass} cx="70" cy="40" r="7" fill={colors.fruit} style={isCollecting ? {} : { animationDelay: '200ms' }} />
               <circle className={fruitClass} cx="50" cy="20" r="7" fill={colors.fruit} style={isCollecting ? {} : { animationDelay: '300ms' }} />
               <circle className={fruitClass} cx="25" cy="55" r="6" fill={colors.fruit} style={isCollecting ? {} : { animationDelay: '400ms' }} />
               <circle className={fruitClass} cx="75" cy="55" r="6" fill={colors.fruit} style={isCollecting ? {} : { animationDelay: '500ms' }} />
             </g>
          </svg>
        );
    }
  };

  return (
    <div 
      onClick={handleInteraction}
      className="relative flex items-end justify-center transition-transform hover:scale-105 cursor-pointer group"
      style={{ width: '100px', height: '120px' }}
    >
      <style>{styles}</style>
      {renderTree()}
      <div className="absolute -bottom-2 w-16 h-3 bg-black/5 rounded-[100%] blur-[4px] group-hover:bg-black/10 transition-colors"></div>
    </div>
  );
};

export default TreeVisual;