import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LevelConfig, Particle, Ring } from '../types';
import { GAME_CONSTANTS, COLORS } from '../constants';
import { audioService } from '../services/audioService';

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

interface GameCanvasProps {
  level: LevelConfig;
  streak: number;
  bonusScale: number;
  onGameOver: (success: boolean, stars: number) => void;
  onExit: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, streak, bonusScale, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ringsLeft, setRingsLeft] = useState(level.ringsToWin);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isAiming, setIsAiming] = useState(false);
  
  // Game State Refs (Mutable for performance)
  const stateRef = useRef({
    time: 0,
    targetX: GAME_CONSTANTS.CANVAS_WIDTH / 2,
    targetY: GAME_CONSTANTS.TARGET_Y,
    obstacleAngle: 0,
    currentRing: null as Ring | null,
    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    texts: [] as FloatingText[],
    targetScale: 1,
    perfectHits: 0,
    ringsLanded: 0,
    shake: 0,
    // Aiming
    dragStartX: 0,
    dragStartY: 0,
    dragCurrentX: 0,
    dragCurrentY: 0,
  });

  const triggerShake = (amount: number, vibrationPattern: number | number[] = 0) => {
    stateRef.current.shake = amount;
    if (navigator.vibrate) {
      navigator.vibrate(vibrationPattern);
    }
  };

  const spawnParticles = (x: number, y: number, color: string, count: number, speedMultiplier: number = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 5 + 2) * speedMultiplier;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 3 + 2,
      });
    }
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
    stateRef.current.texts.push({
      x,
      y,
      text,
      life: 1.0,
      color
    });
  };

  // Input Handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isGameOver || stateRef.current.currentRing) return;
    
    setIsAiming(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      stateRef.current.dragStartX = e.clientX - rect.left;
      stateRef.current.dragStartY = e.clientY - rect.top;
      stateRef.current.dragCurrentX = stateRef.current.dragStartX;
      stateRef.current.dragCurrentY = stateRef.current.dragStartY;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isAiming) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      stateRef.current.dragCurrentX = e.clientX - rect.left;
      stateRef.current.dragCurrentY = e.clientY - rect.top;
    }
  };

  const handlePointerUp = () => {
    if (!isAiming) return;
    setIsAiming(false);

    const { dragStartX, dragStartY, dragCurrentX, dragCurrentY } = stateRef.current;
    const dx = dragStartX - dragCurrentX;
    const dy = dragStartY - dragCurrentY;
    
    // Calculate pull vector (Slingshot style: pull back to shoot forward)
    // We want pulling DOWN to shoot UP.
    // If I drag down (currentY > startY), dy is negative.
    // So vector is (-dx, -dy) scaled.
    
    // Actually, standard slingshot: Vector = Start - Current.
    // If I drag Down (CurrentY > StartY), StartY - CurrentY is Negative.
    // So the shot goes Down.
    // Wait, usually: Pull Back (Down) -> Shot goes Forward (Up).
    // So Vector = (Start - Current).
    // If StartY=500, CurrentY=600 (Down). VectorY = -100. (Upwards in screen coords? No, Screen Y increases down).
    // In Canvas: Y=0 is top. Y=800 is bottom.
    // If I want to shoot UP (Decrease Y), I need negative VY.
    // If I drag DOWN (Increase Y), Start-Current is Negative.
    // Perfect.

    const pullDistance = Math.hypot(dx, dy);
    
    if (pullDistance < 20) return; // Deadzone

    // Calculate power
    let power = pullDistance * GAME_CONSTANTS.DRAG_SENSITIVITY;
    power = Math.max(GAME_CONSTANTS.MIN_POWER, Math.min(power, GAME_CONSTANTS.MAX_POWER));

    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;

    audioService.playShoot();
    stateRef.current.currentRing = {
      x: GAME_CONSTANTS.CANVAS_WIDTH / 2,
      y: GAME_CONSTANTS.SPAWN_Y,
      vx,
      vy,
      angle: angle + Math.PI / 2, // Visual rotation offset for dart sprite
      active: true,
      landed: false,
      scale: bonusScale,
    };
  };

  const update = useCallback(() => {
    const state = stateRef.current;
    state.time += 0.016; // Approx 60fps

    // Shake decay
    if (state.shake > 0) state.shake *= 0.9;
    if (state.shake < 0.5) state.shake = 0;

    // 1. Update Target
    if (level.targetMoveRange > 0) {
      state.targetX = (GAME_CONSTANTS.CANVAS_WIDTH / 2) + Math.sin(state.time * level.targetSpeed * 50) * level.targetMoveRange;
    }
    
    if (level.scaleSpeed > 0) {
      state.targetScale = 1 + Math.sin(state.time * level.scaleSpeed * 50) * 0.2;
    }

    if (level.obstacleSpeed > 0) {
      state.obstacleAngle += level.obstacleSpeed;
    }

    // 2. Update Dart
    if (state.currentRing && state.currentRing.active) {
      const dart = state.currentRing;
      
      // Apply Physics
      dart.x += dart.vx;
      dart.y += dart.vy;
      dart.vy += GAME_CONSTANTS.GRAVITY; // Gravity
      
      // Update rotation to follow velocity vector
      dart.angle = Math.atan2(dart.vy, dart.vx) + Math.PI / 2;

      // Check for out of bounds
      if (dart.y > GAME_CONSTANTS.CANVAS_HEIGHT + 50 || dart.x < -50 || dart.x > GAME_CONSTANTS.CANVAS_WIDTH + 50) {
        dart.active = false;
        state.currentRing = null;
        handleMiss();
        return;
      }

      // Check collision with Target Plane
      // We check if the tip of the dart is within the target area
      // To prevent tunneling at high speeds, we could use line intersection, but simple radius check near target Y is ok for arcade
      
      // Distance to target center
      const dx = dart.x - state.targetX;
      const dy = dart.y - state.targetY;
      const dist = Math.hypot(dx, dy);
      
      const hitRadius = level.targetRadius * state.targetScale;

      // Check Obstacle first
      if (level.obstacleSpeed > 0) {
        const obsRadius = hitRadius + 25; // Orbit radius
        const obsX = state.targetX + Math.cos(state.obstacleAngle) * obsRadius;
        const obsY = state.targetY + Math.sin(state.obstacleAngle) * obsRadius;
        
        const distToObs = Math.hypot(dart.x - obsX, dart.y - obsY);
        // Obstacle hit radius
        if (distToObs < 15) { 
           handleMiss();
           dart.active = false;
           state.currentRing = null;
           return;
        }
      }

      // Hit Detection
      // We allow hitting the board if we are close enough in Z-space (visualized as being close to center)
      // Since it's 2D, we just check if it enters the circle.
      // To make it feel "dart-like", we only count it if the dart is moving "into" the board (not falling away too fast?)
      // Simplest: If distance < radius.
      
      if (dist < hitRadius) {
        dart.landed = true;
        dart.active = false;
        
        // Pin the dart to the board relative position for visual
        dart.x = state.targetX + dx;
        dart.y = state.targetY + dy;

        // Calculate accuracy
        // Bullseye is inner 30%
        const isPerfect = dist < (hitRadius * 0.3);
        
        handleHit(isPerfect);
        
        setTimeout(() => {
          stateRef.current.currentRing = null;
        }, 150);
      }
    }

    // 3. Update Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.size *= 0.95;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }

    // 4. Update Shockwaves
    for (let i = state.shockwaves.length - 1; i >= 0; i--) {
      const s = state.shockwaves[i];
      s.radius += 8; // Expand fast
      s.opacity -= 0.04;
      if (s.opacity <= 0) {
        state.shockwaves.splice(i, 1);
      }
    }

    // 5. Update Floating Text
    for (let i = state.texts.length - 1; i >= 0; i--) {
      const t = state.texts[i];
      t.y -= 2; // Float up
      t.life -= 0.015;
      if (t.life <= 0) {
        state.texts.splice(i, 1);
      }
    }

  }, [level, isGameOver, bonusScale]);

  const handleHit = (isPerfect: boolean) => {
    const state = stateRef.current;
    state.ringsLanded++;
    setRingsLeft(prev => prev - 1);
    
    if (isPerfect) {
      state.perfectHits++;
      setScore(s => s + 300);
      triggerShake(15, [30, 50, 30]); 
      audioService.playPerfect();
      spawnParticles(state.targetX, state.targetY, COLORS.accent, 30, 1.5);
      state.shockwaves.push({ x: state.targetX, y: state.targetY, radius: level.targetRadius, opacity: 1.0 });
      spawnFloatingText(state.targetX, state.targetY - 50, "PERFECT!", COLORS.accent);
    } else {
      setScore(s => s + 100);
      triggerShake(5, 10);
      audioService.playHit();
      spawnParticles(state.targetX, state.targetY, COLORS.primary, 10);
    }

    if (state.ringsLanded >= level.ringsToWin) {
      setIsGameOver(true);
      setTimeout(() => {
        audioService.playWin();
        let stars = 1;
        const perfectRatio = state.perfectHits / level.ringsToWin;
        if (perfectRatio >= 0.5) stars = 2;
        if (perfectRatio === 1.0) stars = 3;
        onGameOver(true, stars);
      }, 500);
    }
  };

  const handleMiss = () => {
    triggerShake(30, 200);
    audioService.playFail();
    setIsGameOver(true);
    // Spawn particles at screen edge or last pos
    const x = stateRef.current.currentRing?.x || 0;
    const y = stateRef.current.currentRing?.y || 0;
    spawnParticles(x, y, COLORS.danger, 30);
    spawnFloatingText(GAME_CONSTANTS.CANVAS_WIDTH/2, GAME_CONSTANTS.TARGET_Y - 50, "MISS!", COLORS.danger);
    
    setTimeout(() => {
      onGameOver(false, 0);
    }, 800);
  };

  const drawDart = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number, color: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;

    // Body (Shaft)
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 10);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Head (Triangle)
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-6, -10);
    ctx.lineTo(6, -10);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Flights (Tail)
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-8, 25);
    ctx.lineTo(0, 20);
    ctx.lineTo(8, 25);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  };

  const drawTarget = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    // Outer Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.primary;
    
    // Outer Ring (White/Black)
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.primary;
    ctx.stroke();

    // Middle Ring (Score zone)
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner Ring
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
    ctx.fill();
    ctx.strokeStyle = COLORS.primary;
    ctx.stroke();

    // Bullseye
    ctx.shadowColor = COLORS.accent;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
    
    ctx.shadowBlur = 0;
  };

  const drawTrajectory = (ctx: CanvasRenderingContext2D, startX: number, startY: number, vx: number, vy: number) => {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    let simX = startX;
    let simY = startY;
    let simVx = vx;
    let simVy = vy;

    // Simulate 30 frames
    for (let i = 0; i < 20; i++) {
      simX += simVx;
      simY += simVy;
      simVy += GAME_CONSTANTS.GRAVITY;
      ctx.lineTo(simX, simY);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw end target helper
    ctx.beginPath();
    ctx.arc(simX, simY, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = stateRef.current;
    
    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT);

    // Apply Shake
    ctx.save();
    if (state.shake > 0) {
      const dx = (Math.random() - 0.5) * state.shake;
      const dy = (Math.random() - 0.5) * state.shake;
      ctx.translate(dx, dy);
    }

    // Floor Guide
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GAME_CONSTANTS.SPAWN_Y);
    ctx.lineTo(GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.SPAWN_Y);
    ctx.stroke();

    // Draw Target
    drawTarget(ctx, state.targetX, state.targetY, level.targetRadius * state.targetScale);

    // Obstacle
    if (level.obstacleSpeed > 0) {
      const hitRadius = level.targetRadius * state.targetScale;
      const obsRadius = hitRadius + 25;
      const obsX = state.targetX + Math.cos(state.obstacleAngle) * obsRadius;
      const obsY = state.targetY + Math.sin(state.obstacleAngle) * obsRadius;
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.danger;
      ctx.beginPath();
      ctx.arc(obsX, obsY, 12, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.danger;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Shockwaves
    state.shockwaves.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(217, 70, 239, ${s.opacity})`;
      ctx.lineWidth = 5;
      ctx.stroke();
    });

    // Aiming State
    if (isAiming && !state.currentRing) {
      const dx = state.dragStartX - state.dragCurrentX;
      const dy = state.dragStartY - state.dragCurrentY;
      const pullDist = Math.hypot(dx, dy);
      
      // Aim Line (Slingshot string visual)
      ctx.beginPath();
      ctx.moveTo(GAME_CONSTANTS.CANVAS_WIDTH / 2, GAME_CONSTANTS.SPAWN_Y);
      ctx.lineTo(state.dragCurrentX + (GAME_CONSTANTS.CANVAS_WIDTH/2 - state.dragStartX), state.dragCurrentY + (GAME_CONSTANTS.SPAWN_Y - state.dragStartY));
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Trajectory Prediction
      if (pullDist > 20) {
        let power = pullDist * GAME_CONSTANTS.DRAG_SENSITIVITY;
        power = Math.max(GAME_CONSTANTS.MIN_POWER, Math.min(power, GAME_CONSTANTS.MAX_POWER));
        const angle = Math.atan2(dy, dx);
        const vx = Math.cos(angle) * power;
        const vy = Math.sin(angle) * power;
        
        drawTrajectory(ctx, GAME_CONSTANTS.CANVAS_WIDTH / 2, GAME_CONSTANTS.SPAWN_Y, vx, vy);
        
        // Power Meter (Curved bar near player)
        const powerPct = (power - GAME_CONSTANTS.MIN_POWER) / (GAME_CONSTANTS.MAX_POWER - GAME_CONSTANTS.MIN_POWER);
        ctx.beginPath();
        ctx.arc(GAME_CONSTANTS.CANVAS_WIDTH / 2, GAME_CONSTANTS.SPAWN_Y, 60, Math.PI, Math.PI + (Math.PI * powerPct));
        ctx.strokeStyle = `hsl(${powerPct * 120}, 100%, 50%)`;
        ctx.lineWidth = 6;
        ctx.stroke();
      }

      // Draw ghost dart at spawn
      // Calculate rotation based on pull
      const angle = Math.atan2(dy, dx) + Math.PI/2;
      drawDart(ctx, GAME_CONSTANTS.CANVAS_WIDTH/2, GAME_CONSTANTS.SPAWN_Y, angle, bonusScale, '#fff');
    } else if (!state.currentRing) {
        // Idle Dart
        drawDart(ctx, GAME_CONSTANTS.CANVAS_WIDTH/2, GAME_CONSTANTS.SPAWN_Y, 0, bonusScale, '#fff');
        
        // Hint Text
        ctx.font = "12px Orbitron, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.textAlign = "center";
        ctx.fillText("DRAG TO AIM", GAME_CONSTANTS.CANVAS_WIDTH/2, GAME_CONSTANTS.SPAWN_Y + 50);
    }

    // Active Dart
    if (state.currentRing) {
      drawDart(ctx, state.currentRing.x, state.currentRing.y, state.currentRing.angle, state.currentRing.scale, COLORS.accent);
    }

    // Draw Particles
    state.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw Floating Text
    ctx.font = "bold 24px Orbitron, sans-serif";
    ctx.textAlign = "center";
    state.texts.forEach(t => {
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.life;
      ctx.fillText(t.text, t.x, t.y);
      ctx.globalAlpha = 1.0;
    });

    ctx.restore();
  }, [level, isAiming, bonusScale]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = GAME_CONSTANTS.CANVAS_WIDTH;
    canvas.height = GAME_CONSTANTS.CANVAS_HEIGHT;

    let animationFrameId: number;
    const render = () => {
      update();
      draw(ctx);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [update, draw]);

  return (
    <div className="relative w-full h-full max-w-md mx-auto bg-slate-900 overflow-hidden shadow-2xl select-none">
      {/* HUD */}
      <div className="absolute top-8 left-0 right-0 px-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-widest">Score</span>
          <span className="text-2xl font-bold font-mono text-white neon-text">{score}</span>
        </div>
        
        {streak > 1 && (
          <div className="flex flex-col items-center animate-pulse">
            <span className="text-xs text-orange-400 uppercase tracking-widest font-bold">Streak x{streak}</span>
            <span className="text-orange-500 font-bold text-sm">Power +20%</span>
          </div>
        )}

        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase tracking-widest">Level {level.id}</span>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: level.ringsToWin }).map((_, i) => (
               <div 
                 key={i} 
                 className={`w-3 h-3 rounded-full border border-white ${
                   i < (level.ringsToWin - ringsLeft) 
                     ? 'bg-fuchsia-500 shadow-[0_0_10px_#d946ef]' 
                     : 'bg-transparent opacity-30'
                 }`}
               />
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onExit(); }}
        className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-white/50 hover:text-white p-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <canvas 
        ref={canvasRef} 
        className="w-full h-full block touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
};