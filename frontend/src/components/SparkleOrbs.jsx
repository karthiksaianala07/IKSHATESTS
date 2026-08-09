import React, { useEffect, useState, useRef } from 'react';

const COLOR_PRESETS = [
  { primary: '#f97316', shadow: 'rgba(249, 115, 22, 0.25)' }, // Orange
  { primary: '#ef4444', shadow: 'rgba(239, 68, 68, 0.25)' }, // Red
  { primary: '#94a3b8', shadow: 'rgba(148, 163, 184, 0.25)' }  // Silver
];

export default function SparkleOrbs() {
  const [particles, setParticles] = useState([]);
  const orbsRef = useRef([]);
  const animationRef = useRef();

  // Create 10 unique drifting orbs
  const orbs = useRef(
    Array.from({ length: 10 }, (_, i) => {
      const size = Math.floor(Math.random() * 35) + 40; // 40px to 75px
      const color = COLOR_PRESETS[i % COLOR_PRESETS.length];
      return {
        id: i,
        size,
        color,
        anchorX: Math.random() * 70 + 15, // 15% to 85%
        anchorY: Math.random() * 70 + 15,
        radiusX: Math.random() * 6 + 6,    // 6% to 12% drift range
        radiusY: Math.random() * 6 + 6,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.005 + 0.003) * (Math.random() > 0.5 ? 1 : -1), // speed of rotation
        phase: Math.random() * Math.PI,
        isRespawning: false
      };
    })
  );

  // Smooth Water-flow Animation Loop
  useEffect(() => {
    const updatePositions = () => {
      // 1. Move Orbs (direct DOM style manipulation for 0% React overhead)
      orbs.current.forEach((orb, idx) => {
        if (orb.isRespawning) return;

        orb.angle += orb.speed;
        const x = orb.anchorX + Math.cos(orb.angle) * orb.radiusX;
        const y = orb.anchorY + Math.sin(orb.angle * 0.8 + orb.phase) * orb.radiusY;

        const el = orbsRef.current[idx];
        if (el) {
          el.style.left = `${x}%`;
          el.style.top = `${y}%`;
        }
      });

      // 2. Move Active Sparkles (if any exist)
      setParticles(prev => {
        if (prev.length === 0) return prev;
        return prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.04, // subtle gravity pull
            opacity: p.opacity - 0.02,
            scale: p.scale * 0.96
          }))
          .filter(p => p.opacity > 0);
      });

      animationRef.current = requestAnimationFrame(updatePositions);
    };

    animationRef.current = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const handleOrbHover = (idx, event) => {
    const orb = orbs.current[idx];
    if (orb.isRespawning) return;

    const el = orbsRef.current[idx];
    if (!el) return;

    // Get exact center of the hovered orb in pixels
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Generate 15 localized sparkles
    const newSparkles = Array.from({ length: 15 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1; // slow dispersion speed
      return {
        id: `${orb.id}-${Date.now()}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        scale: Math.random() * 0.5 + 0.8,
        opacity: 1,
        color: orb.color.primary
      };
    });

    setParticles(prev => [...prev, ...newSparkles]);

    // Respawn sequence: hide this orb instantly and relocate its path anchors
    orb.isRespawning = true;
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';

    // Move its center anchor point randomly for the next appearance
    orb.anchorX = Math.random() * 70 + 15;
    orb.anchorY = Math.random() * 70 + 15;
    orb.angle = Math.random() * Math.PI * 2;

    // Re-enable and fade-in the orb after 4 seconds
    setTimeout(() => {
      orb.isRespawning = false;
      if (el) {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      }
    }, 4000);
  };

  return (
    <>
      {/* Dynamic Sparkles (Rendered globally on contact) */}
      {particles.map(p => (
        <div
          key={p.id}
          className="fixed rounded-full pointer-events-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: '6px',
            height: '6px',
            opacity: p.opacity,
            transform: `translate(-50%, -50%) scale(${p.scale})`,
            background: `radial-gradient(circle, #ffffff 0%, ${p.color} 70%, transparent 100%)`,
            boxShadow: `0 0 8px ${p.color}`,
            zIndex: 100
          }}
        />
      ))}

      {/* Drifting Floating Background Orbs */}
      {orbs.current.map((orb, idx) => (
        <div
          key={orb.id}
          ref={el => (orbsRef.current[idx] = el)}
          className="fixed rounded-full border pointer-events-none transition-opacity duration-500 ease-in-out"
          style={{
            zIndex: 1, // Sits behind the relative z-10 main content wrapper
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            transform: 'translate(-50%, -50%)',
            borderColor: orb.color.shadow, // Soft semi-transparent border color
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            boxShadow: `inset 0 0 10px ${orb.color.shadow}, 0 0 15px ${orb.color.shadow}`,
            // Smoothen initial positioning transitions
            left: `${orb.anchorX}%`,
            top: `${orb.anchorY}%`
          }}
        />
      ))}
    </>
  );
}
