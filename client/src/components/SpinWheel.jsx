import React, { useEffect, useRef, useState } from 'react';

const COLORS = [
  { bg: '#d2493a', text: '#ffffff' }, // Terracotta Red
  { bg: '#f59e0b', text: '#1c1917' }, // Vibrant Amber Orange
  { bg: '#fff7ed', text: '#1c1917' }, // Soft Cream
  { bg: '#1c1917', text: '#fff7ed' }, // Deep Charcoal
  { bg: '#ea580c', text: '#ffffff' }, // Warm Orange/Red
  { bg: '#fff7ed', text: '#1c1917' }  // Soft Cream
];

const truncateLabel = (label) => (label.length > 20 ? `${label.slice(0, 17)}...` : label);

export default function SpinWheel({ items, onSpinStart, onSpinEnd }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio || 1;
    const size = 320;
    const center = size / 2;
    const radius = center - 8;

    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const segmentCount = Math.max(items.length, 1);
    const segmentAngle = (2 * Math.PI) / segmentCount;

    context.clearRect(0, 0, size, size);

    if (items.length === 0) {
      // Empty state wheel
      context.beginPath();
      context.arc(center, center, radius, 0, 2 * Math.PI);
      context.fillStyle = '#f5f5f4';
      context.fill();
      context.strokeStyle = '#e7e5e4';
      context.lineWidth = 4;
      context.stroke();

      context.fillStyle = '#78716c';
      context.font = 'bold 14px Inter, system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('No Items Available', center, center);
      return;
    }

    // Draw slices
    items.forEach((item, index) => {
      const startAngle = -Math.PI / 2 + index * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      const colorScheme = COLORS[index % COLORS.length];

      context.beginPath();
      context.moveTo(center, center);
      context.arc(center, center, radius, startAngle, endAngle);
      context.closePath();
      context.fillStyle = colorScheme.bg;
      context.fill();

      // Border between slices
      context.strokeStyle = '#e2e8f0';
      context.lineWidth = 1.5;
      context.stroke();

      // Draw labels
      context.save();
      context.translate(center, center);
      context.rotate(startAngle + segmentAngle / 2);
      context.textAlign = 'right';
      context.textBaseline = 'middle';
      context.fillStyle = colorScheme.text;
      context.font = 'bold 13px Inter, system-ui, sans-serif';
      
      if (colorScheme.text === '#ffffff') {
        context.shadowColor = 'rgba(0, 0, 0, 0.4)';
        context.shadowBlur = 4;
        context.shadowOffsetX = 1;
        context.shadowOffsetY = 1;
      }
      
      context.fillText(truncateLabel(item), radius - 20, 0);
      context.restore();
    });

    // Draw outer rim
    context.beginPath();
    context.arc(center, center, radius, 0, 2 * Math.PI);
    context.strokeStyle = '#1c1917';
    context.lineWidth = 6;
    context.stroke();

    // Draw pegs (dots) on the outer rim
    const pegCount = Math.max(segmentCount * 2, 8);
    const pegAngleStep = (2 * Math.PI) / pegCount;
    for (let i = 0; i < pegCount; i++) {
      const angle = -Math.PI / 2 + i * pegAngleStep;
      const pegX = center + (radius - 3) * Math.cos(angle);
      const pegY = center + (radius - 3) * Math.sin(angle);
      context.beginPath();
      context.arc(pegX, pegY, 3.5, 0, 2 * Math.PI);
      context.fillStyle = '#f59e0b';
      context.fill();
      context.strokeStyle = '#1c1917';
      context.lineWidth = 1;
      context.stroke();
    }

    // Draw central hub
    context.beginPath();
    context.arc(center, center, 24, 0, 2 * Math.PI);
    context.fillStyle = '#1c1917';
    context.fill();
    context.strokeStyle = '#f59e0b';
    context.lineWidth = 2.5;
    context.stroke();

    // Inner central cap
    context.beginPath();
    context.arc(center, center, 8, 0, 2 * Math.PI);
    context.fillStyle = '#fff7ed';
    context.fill();
  }, [items]);

  const spin = () => {
    if (isSpinning || items.length === 0) return;

    const segmentCount = items.length;
    const winningIndex = Math.floor(Math.random() * segmentCount);

    const segmentAngle = 360 / segmentCount;
    // Add natural variation to where the selector lands in the segment
    const offset = segmentAngle * 0.2 + Math.random() * (segmentAngle * 0.6);
    const targetAngleOnWheel = winningIndex * segmentAngle + offset;
    const targetRotationAngle = 360 - targetAngleOnWheel;

    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full spins
    const finalRotation = rotation + 360 * extraSpins + (targetRotationAngle - (rotation % 360) + 360) % 360;

    setIsSpinning(true);
    setRotation(finalRotation);
    
    if (onSpinStart) {
      onSpinStart();
    }

    // Wait for the 5000ms transition to finish
    setTimeout(() => {
      setIsSpinning(false);
      if (onSpinEnd) {
        onSpinEnd(winningIndex, items[winningIndex]);
      }
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Ticker Pin & Rotating Container */}
      <div className="relative h-[320px] w-[320px] select-none">
        {/* Ticker Pin */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 flex flex-col items-center">
          <svg 
            className={`w-8 h-10 drop-shadow-md transform origin-top transition-transform ${isSpinning ? 'animate-tick' : ''}`}
            viewBox="0 0 30 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M15 40C15 40 30 18 30 12C30 5.37258 24.6274 0 18 0H12C5.37258 0 0 5.37258 0 12C0 18 15 40 15 40Z" 
              fill="#dc2626" 
            />
            <circle cx="15" cy="12" r="5" fill="#fff7ed" />
          </svg>
        </div>

        {/* Rotating Canvas Wrapper */}
        <div 
          className="h-[320px] w-[320px] rounded-full shadow-lg overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 5000ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
          }}
        >
          <canvas
            ref={canvasRef}
            className="h-[320px] w-[320px] rounded-full"
            aria-label="Recipe spin wheel"
          />
        </div>
      </div>

      {/* Spin Button */}
      <button
        className="min-h-12 w-full max-w-[200px] rounded-lg bg-stone-900 px-6 text-sm font-bold text-white shadow-md transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        type="button"
        onClick={spin}
        disabled={isSpinning || items.length === 0}
      >
        {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL'}
      </button>

      {/* Inject Keyframe CSS styles inline so they work immediately */}
      <style>{`
        @keyframes tick {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          80% { transform: rotate(5deg); }
        }
        .animate-tick {
          animation: tick 0.15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
