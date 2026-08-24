import React, { useState, useEffect } from 'react';

interface PrompterCountdownProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const PrompterCountdown: React.FC<PrompterCountdownProps> = ({ onComplete, onCancel }) => {
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount((prev) => prev - 1);
    }, 900);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="prompter-countdown-overlay" onClick={onComplete}>
      <div className="prompter-countdown-content">
        <div className="prompter-countdown-number" key={count}>
          {count > 0 ? count : 'GO!'}
        </div>
        <div className="prompter-countdown-hint">
          Toque para iniciar imediatamente ou <button type="button" className="prompter-countdown-cancel" onClick={(e) => { e.stopPropagation(); onCancel(); }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};
