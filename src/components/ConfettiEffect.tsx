import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: {
    x: number;
    y: number;
    rotation: number;
  };
}

interface ConfettiEffectProps {
  isActive: boolean;
  duration?: number;
}

const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ 
  isActive, 
  duration = 3000 
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const colors = [
    '#fbbf24', // yellow-400
    '#f59e0b', // amber-500
    '#d97706', // amber-600
    '#92400e', // amber-800
    '#451a03', // amber-900
    '#ef4444', // red-500
    '#dc2626', // red-600
    '#7c3aed', // violet-600
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#10b981', // emerald-500
    '#84cc16', // lime-500
  ];

  useEffect(() => {
    if (!isActive) {
      setConfetti([]);
      return;
    }

    // Criar confetes
    const newConfetti: ConfettiPiece[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 3 + 2,
        rotation: (Math.random() - 0.5) * 10,
      },
    }));

    setConfetti(newConfetti);

    // Animar confetes
    const animate = () => {
      setConfetti(prev => 
        prev
          .map(piece => ({
            ...piece,
            x: piece.x + piece.velocity.x,
            y: piece.y + piece.velocity.y,
            rotation: piece.rotation + piece.velocity.rotation,
            velocity: {
              ...piece.velocity,
              y: piece.velocity.y + 0.1, // gravidade
            },
          }))
          .filter(piece => piece.y < window.innerHeight + 50) // remover confetes que saíram da tela
      );
    };

    const interval = setInterval(animate, 16); // ~60fps

    // Limpar após a duração
    const timeout = setTimeout(() => {
      setConfetti([]);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isActive, duration]);

  if (!isActive || confetti.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute rounded-full"
          style={{
            left: piece.x,
            top: piece.y,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            boxShadow: `0 0 ${piece.size}px ${piece.color}`,
          }}
        />
      ))}
    </div>
  );
};

export default ConfettiEffect; 