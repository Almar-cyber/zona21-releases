import { useEffect, useState } from 'react';
import logoFull from '../assets/logotipo-white.png';
import './LoadingScreen.css';

type Props = {
  onComplete: () => void;
  minDuration?: number;
};

export default function LoadingScreen({ onComplete, minDuration = 2500 }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  
  // 0 -> ZONA, 1 -> 21
  const animationDuration = 600;
  const pauseBetween = 800;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev === 0 ? 1 : 0));
    }, animationDuration + pauseBetween);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <div className={`loading-screen ${isExiting ? 'loading-screen-exit' : ''}`}>
      <div className="loading-content">
        <div className={`logo-animation-container ${currentIndex === 0 ? 'focus-zona' : 'focus-21'}`}>
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
