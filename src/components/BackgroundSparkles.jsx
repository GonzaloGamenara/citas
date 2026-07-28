import React, { useMemo } from 'react';

const BackgroundSparkles = () => {
  // Íconos temáticos para Julieta: Teatro, Música, Arte, Pilates y Brillos ✨
  const hearts = useMemo(() => {
    const items = [];
    const emojis = ['🎭', '✨', '🎶', '💖', '🎨', '🌟', '🎼', '🧘‍♀️', '💕', '🎀'];
    for (let i = 0; i < 22; i++) {
      items.push({
        id: i,
        emoji: emojis[i % emojis.length],
        left: `${Math.random() * 95}%`,
        duration: `${6 + Math.random() * 6}s`,
        delay: `${Math.random() * 5}s`,
        size: `${1.1 + Math.random() * 1.1}rem`
      });
    }
    return items;
  }, []);

  return (
    <div className="sparkle-bg">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="floating-heart"
          style={{
            left: h.left,
            animationDuration: h.duration,
            animationDelay: h.delay,
            fontSize: h.size
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
};

export default BackgroundSparkles;
