import { useEffect, useState } from 'react';
import logoFullDark from '../assets/logotipo-white.png';
import logoFullLight from '../assets/logotipo.png';
import { useTheme } from '../contexts/ThemeContext';
import './LoadingScreen.css';

type Props = {
  onComplete: () => void;
  minDuration?: number;
};

export default function LoadingScreen({ onComplete, minDuration = 3500 }: Props) {
  const { resolvedTheme } = useTheme();
  const logoFull = resolvedTheme === 'light' ? logoFullLight : logoFullDark;
  // 0 -> ZONA, 1 -> 21, 2 -> full logo
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Sequence: ZONA -> 21 -> full logo -> exit
    // Timing: 0ms=ZONA, 1000ms=21, 2000ms=full
    const t1 = setTimeout(() => setCurrentIndex(1), 1000);  // 21
    const t2 = setTimeout(() => setCurrentIndex(2), 2000);  // full logo

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 600);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <div className={`loading-screen ${isExiting ? 'loading-screen-exit' : ''}`}>
      <div className="loading-content">
        <div className={`logo-animation-container ${currentIndex === 0 ? 'focus-zona' : currentIndex === 1 ? 'focus-21' : 'focus-full'}`}>
          {/* Layer 1: Blurred background logo - decorative */}
          <img 
            src={logoFull} 
            alt="" 
            className="logo-layer logo-blur"
          />
          
          {/* Layer 2: Sharp foreground logo with masking */}
          <img 
            src={logoFull} 
            alt="Zona21" 
            className="logo-layer logo-sharp"
          />

          {/* Focus Frame */}
          <div className="focus-frame">
            <span className="corner top-left" />
            <span className="corner top-right" />
            <span className="corner bottom-left" />
            <span className="corner bottom-right" />
          </div>
        </div>
      </div>
    </div>
  );
}
