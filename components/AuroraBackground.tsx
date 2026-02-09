
import React, { useEffect, useRef } from 'react';

const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 10000 : 30000;
    const arms = 5; 
    const coreRadius = 40;

    class Star {
      x: number = 0;
      y: number = 0;
      angle: number = 0;
      dist: number = 0;
      speed: number = 0;
      size: number = 0;
      color: string = '';
      opacity: number = 0;
      twinkleSpeed: number = 0;

      constructor(w: number, h: number) {
        this.reset(w, h, true);
      }

      reset(w: number, h: number, isInitial = false) {
        const maxDist = Math.max(w, h);
        this.dist = isInitial 
          ? Math.random() * maxDist
          : maxDist * 0.8;
        
        const armIndex = Math.floor(Math.random() * arms);
        const armAngle = (armIndex * (Math.PI * 2)) / arms;
        this.angle = armAngle + (this.dist * 0.003) + (Math.random() * 0.5);
        
        this.speed = 0.02 + Math.random() * 0.05;
        this.size = Math.random() * 1.2 + 0.2;
        this.twinkleSpeed = Math.random() * 0.08;

        // Palette Nexus : Cyan, Bleu, Blanc Cristal
        const rand = Math.random();
        if (rand > 0.7) this.color = '#00d4ff'; // Cyan
        else if (rand > 0.4) this.color = '#3b82f6'; // Bleu
        else this.color = '#ffffff'; // Blanc
      }

      update(w: number, h: number) {
        this.dist -= (1.2 + (1000 / (this.dist + 1)));
        this.angle -= this.speed * (400 / (this.dist + 100));
        
        if (this.dist < coreRadius) {
          this.reset(w, h, false);
        }

        const pulse = Math.sin(Date.now() * this.twinkleSpeed) * 0.3 + 0.7;
        this.opacity = (Math.min(1, this.dist / 400)) * pulse;

        const centerX = w / 2;
        const centerY = h / 2;
        this.x = centerX + Math.cos(this.angle) * this.dist;
        this.y = centerY + Math.sin(this.angle) * this.dist * 0.7;
      }

      draw(context: CanvasRenderingContext2D) {
        context.globalAlpha = this.opacity * 0.8;
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push(new Star(canvas.width, canvas.height));
      }
    };

    window.addEventListener('resize', init);
    init();

    const render = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nébuleuse Cyan Profond
      const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width/1.2
      );
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.1)');
      gradient.addColorStop(0.4, 'rgba(59, 130, 246, 0.05)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'lighter';
      stars.forEach(star => {
        star.update(canvas.width, canvas.height);
        star.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none select-none overflow-hidden bg-[#020617]">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
      
      {/* Glow Cyan */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
         <div className="w-[400px] h-[400px] bg-cyan-500/20 blur-[150px] rounded-full animate-pulse-slow"></div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.2); opacity: 0.25; }
        }
        .animate-pulse-slow { animation: pulse 10s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default AuroraBackground;
