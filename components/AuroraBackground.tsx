
import React, { useEffect, useRef } from 'react';

const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5,
      opacity: Math.random(),
      speed: Math.random() * 0.01 + 0.005
    }));

    const draw = (time: number) => {
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#e6f1ff';
      stars.forEach(star => {
        star.opacity += star.speed;
        if (star.opacity > 1 || star.opacity < 0) star.speed *= -1;
        ctx.globalAlpha = Math.max(0, star.opacity);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Aurora effect (simplified with radial gradients)
      ctx.globalAlpha = 0.05;
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.5 + Math.sin(time * 0.0005) * 100,
        canvas.height * 0.2,
        0,
        canvas.width * 0.5,
        canvas.height * 0.2,
        canvas.width * 0.6
      );
      gradient.addColorStop(0, '#00d4ff');
      gradient.addColorStop(0.5, '#7b4dff');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-1]" />;
};

export default AuroraBackground;
