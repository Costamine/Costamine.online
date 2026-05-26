import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const { language } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        onExpire?.();
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (isExpired || !timeLeft) {
    return null;
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
      <Clock className="w-3 h-3" />
      <span>{language === 'ar' ? 'ينتهي الخصم بعد' : 'Ends in'}</span>
      <div className="flex items-center gap-0.5 font-mono font-medium">
        {timeLeft.days > 0 && (
          <>
            <span>{timeLeft.days}</span>
            <span className="text-destructive/60">{language === 'ar' ? 'ي' : 'd'}</span>
            <span className="mx-0.5">:</span>
          </>
        )}
        <span>{formatNumber(timeLeft.hours)}</span>
        <span className="text-destructive/60">{language === 'ar' ? 'س' : 'h'}</span>
        <span className="mx-0.5">:</span>
        <span>{formatNumber(timeLeft.minutes)}</span>
        <span className="text-destructive/60">{language === 'ar' ? 'د' : 'm'}</span>
        <span className="mx-0.5">:</span>
        <span>{formatNumber(timeLeft.seconds)}</span>
        <span className="text-destructive/60">{language === 'ar' ? 'ث' : 's'}</span>
      </div>
    </div>
  );
}
