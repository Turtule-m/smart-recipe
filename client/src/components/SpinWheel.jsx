import React, { useEffect, useRef, useState } from 'react';

const COLORS = ['#0f766e', '#be123c', '#b45309', '#4338ca', '#15803d', '#a21caf', '#0369a1'];
const WHEEL_SIZE = 320;
const TWO_PI = Math.PI * 2;

const easeOutCubic = (time) => 1 - Math.pow(1 - time, 3);

const normalizeRotation = (rotation) => ((rotation % TWO_PI) + TWO_PI) % TWO_PI;

const truncateLabel = (label) => (label.length > 24 ? `${label.slice(0, 21)}...` : label);

export default function SpinWheel({ recipeNames, onSelect }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animationRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = WHEEL_SIZE * pixelRatio;
    canvas.height = WHEEL_SIZE * pixelRatio;
    canvas.style.width = `${WHEEL_SIZE}px`;
    canvas.style.height = `${WHEEL_SIZE}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const drawWheel = () => {
      const center = WHEEL_SIZE / 2;
      const radius = center - 6;
      const segmentCount = Math.max(recipeNames.length, 1);
      const segmentAngle = TWO_PI / segmentCount;

      context.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

      if (recipeNames.length === 0) {
        context.beginPath();
        context.arc(center, center, radius, 0, TWO_PI);
        context.fillStyle = '#e2e8f0';
        context.fill();
        context.fillStyle = '#475569';
        context.font = '600 16px Inter, system-ui, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Search recipes first', center, center);
        return;
      }

      recipeNames.forEach((name, index) => {
        const startAngle = -Math.PI / 2 + rotationRef.current + index * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        context.beginPath();
        context.moveTo(center, center);
        context.arc(center, center, radius, startAngle, endAngle);
        context.closePath();
        context.fillStyle = COLORS[index % COLORS.length];
        context.fill();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();

        context.save();
        context.translate(center, center);
        context.rotate(startAngle + segmentAngle / 2);
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';
        context.font = '700 13px Inter, system-ui, sans-serif';
        context.fillText(truncateLabel(name), radius - 16, 0);
        context.restore();
      });

      context.beginPath();
      context.arc(center, center, 18, 0, TWO_PI);
      context.fillStyle = '#ffffff';
      context.fill();
      context.strokeStyle = '#0f172a';
      context.lineWidth = 2;
      context.stroke();
    };

    drawWheel();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [recipeNames]);

  const spin = () => {
    if (isSpinning || recipeNames.length === 0) {
      return;
    }

    const selectedIndex = Math.floor(Math.random() * recipeNames.length);
    const segmentAngle = TWO_PI / recipeNames.length;
    const startRotation = rotationRef.current;
    const extraTurns = 5 + Math.floor(Math.random() * 3);
    const selectedCenterAngle = selectedIndex * segmentAngle + segmentAngle / 2;
    const targetRotation = extraTurns * TWO_PI - selectedCenterAngle;
    const totalRotation = targetRotation - normalizeRotation(startRotation);
    const duration = 4200;
    const startedAt = performance.now();

    setIsSpinning(true);
    onSelect(null);

    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      rotationRef.current = startRotation + totalRotation * easedProgress;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const center = WHEEL_SIZE / 2;
      const radius = center - 6;
      const segmentCount = recipeNames.length;
      const drawSegmentAngle = TWO_PI / segmentCount;

      context.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

      recipeNames.forEach((name, index) => {
        const startAngle = -Math.PI / 2 + rotationRef.current + index * drawSegmentAngle;
        const endAngle = startAngle + drawSegmentAngle;

        context.beginPath();
        context.moveTo(center, center);
        context.arc(center, center, radius, startAngle, endAngle);
        context.closePath();
        context.fillStyle = COLORS[index % COLORS.length];
        context.fill();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();

        context.save();
        context.translate(center, center);
        context.rotate(startAngle + drawSegmentAngle / 2);
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';
        context.font = '700 13px Inter, system-ui, sans-serif';
        context.fillText(truncateLabel(name), radius - 16, 0);
        context.restore();
      });

      context.beginPath();
      context.arc(center, center, 18, 0, TWO_PI);
      context.fillStyle = '#ffffff';
      context.fill();
      context.strokeStyle = '#0f172a';
      context.lineWidth = 2;
      context.stroke();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      rotationRef.current = normalizeRotation(rotationRef.current);
      setIsSpinning(false);
      onSelect(selectedIndex);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-80 w-80">
        <canvas
          ref={canvasRef}
          className="h-80 w-80 rounded-full shadow-sm"
          aria-label="Recipe spin wheel"
        />
        <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 -translate-y-1 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-slate-950" />
      </div>

      <button
        className="min-h-11 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        type="button"
        onClick={spin}
        disabled={isSpinning || recipeNames.length === 0}
      >
        {isSpinning ? 'Spinning...' : 'Spin for a recipe'}
      </button>
    </div>
  );
}
