
import React, { useEffect, useRef } from 'react';

const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();

    const stars: any[] = [];
    for(let i=0; i<200; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.08,
            vy: (Math.random() - 0.5) * 0.08,
            size: Math.random() * 1.8 + 0.2,
            color: Math.random() > 0.8 ? '#00d4ff' : '#ffffff',
            opacity: Math.random(),
            pulse: Math.random() * 0.02
        });
    }

    const draw = (time: number) => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Deep Space Glows
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width * 0.8);
      grad.addColorStop(0, 'rgba(0, 50, 100, 0.1)');
      grad.addColorStop(0.5, 'rgba(10, 20, 40, 0.05)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Constellation Lines
      ctx.lineWidth = 0.4;
      for(let i=0; i<stars.length; i++) {
        const s1 = stars[i];
        for(let j=i+1; j<stars.length; j++) {
            const s2 = stars[j];
            const dx = s1.x - s2.x;
            const dy = s1.y - s2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if(dist < 120) {
                const opacity = (1 - dist/120) * 0.15;
                ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
                ctx.beginPath();
                ctx.moveTo(s1.x, s1.y);
                ctx.lineTo(s2.x, s2.y);
                ctx.stroke();
            }
        }

        // Mouse connection
        const mdx = s1.x - mouse.x;
        const mdy = s1.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 150) {
            ctx.strokeStyle = `rgba(0, 212, 255, ${(1 - mdist/150) * 0.3})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.lineWidth = 0.4;
        }
      }

      // Stars
      stars.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        if(s.x < -20) s.x = canvas.width + 20;
        if(s.x > canvas.width + 20) s.x = -20;
        if(s.y < -20) s.y = canvas.height + 20;
        if(s.y > canvas.height + 20) s.y = -20;

        const currentOpacity = s.opacity * (0.4 + Math.sin(time * 0.002 + s.x) * 0.6);
        ctx.globalAlpha = currentOpacity;
        ctx.fillStyle = s.color;
        
        // Draw star with glow
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (s.size > 1.2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = s.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-1]" />;
};

export default AuroraBackground;
