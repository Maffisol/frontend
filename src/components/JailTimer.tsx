import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext'; // Zorg ervoor dat het pad klopt

const JAIL_API_URL = import.meta.env.VITE_JAIL_API_URL;

interface JailTimerProps {
  walletAddress: string;
}

const JailTimer = ({ walletAddress }: JailTimerProps) => {
  const { socket, registerWallet } = useSocket();
  const [isInJail, setIsInJail] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (milliseconds: number | null): string => {
    if (!milliseconds || milliseconds <= 0) return '0m 0s';
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Haal initiële status van gevangenis op
  useEffect(() => {
    if (!walletAddress) return;

    const fetchInitialJailStatus = async () => {
      try {
        const response = await fetch(`${JAIL_API_URL}/jail-status/${walletAddress}`);
        if (response.ok) {
          const data = await response.json();
          const validJailStatus = data.isInJail && data.jailReleaseTime !== null;
          setIsInJail(validJailStatus);

          if (validJailStatus && data.jailReleaseTime) {
            const jailReleaseTime = new Date(data.jailReleaseTime).getTime();
            setRemainingTime(jailReleaseTime - Date.now());
          } else {
            setRemainingTime(null);
          }
        } else {
          console.error('Fout bij ophalen van gevangenisstatus:', response.statusText);
          setError('Er is een fout opgetreden bij het ophalen van je gevangenisstatus.');
        }
      } catch (error) {
        console.error('Fout bij ophalen van gevangenisstatus:', error);
        setError('Er is een fout opgetreden bij het ophalen van je gevangenisstatus.');
      }
    };

    fetchInitialJailStatus();

    // Registreer de wallet zodra het walletAddress verandert
    if (walletAddress) {
      registerWallet(walletAddress); // Registreer wallet voor updates
    }

    const handleJailStatusUpdate = (data: { walletAddress: string; isInJail: boolean; jailReleaseTime: string | null }) => {
      if (data.walletAddress === walletAddress) {
        const validJailStatus = data.isInJail && data.jailReleaseTime !== null;
        setIsInJail(validJailStatus);

        if (validJailStatus && data.jailReleaseTime) {
          const jailReleaseTime = new Date(data.jailReleaseTime).getTime();
          setRemainingTime(jailReleaseTime - Date.now());
        } else {
          setRemainingTime(null);
        }
      }
    };

    socket?.on('jailStatusUpdated', handleJailStatusUpdate);

    return () => {
      socket?.off('jailStatusUpdated', handleJailStatusUpdate);
    };
  }, [walletAddress, socket, registerWallet]);

  // Update de timer
  useEffect(() => {
    if (isInJail && remainingTime !== null) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev && prev > 1000) {
            return prev - 1000;
          } else {
            clearInterval(timer);
            setIsInJail(false); // Stop de timer als de tijd om is
            return null;
          }
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isInJail, remainingTime]);

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!isInJail) return null; // Render niets als de speler niet in de gevangenis zit

  return (
    <div className="bg-yellow-400 text-black font-bold text-center p-2 w-full z-50 mt-2">
      Jail Time Remaining: {formatTime(remainingTime)}
    </div>
  );
};

export default JailTimer;
