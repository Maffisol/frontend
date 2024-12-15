import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';  // Zorg ervoor dat je het pad naar je SocketContext correct instelt

const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;
const JAIL_API_URL = import.meta.env.VITE_JAIL_API_URL;

interface StealCarProps {
    walletAddress: string | undefined;
}

const StealCar: React.FC<StealCarProps> = ({ walletAddress }) => {
    const [result, setResult] = useState<string | null>(null);
    const [inJail, setInJail] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const socket = useSocket().socket;

    const carOptions = [
        { car: 'Luxury Sedan', successChance: 0.3, iconPath: '/assets/sedan-icon.png' },
        { car: 'Sport Coupe', successChance: 0.5, iconPath: '/assets/coupe-icon.png' },
        { car: 'SUV', successChance: 0.6, iconPath: '/assets/suv-icon.png' },
    ];

    const items = [
        { name: 'Luxury Car Stereo', value: 250, xp: 25 },
        { name: 'Stolen License Plate', value: 100, xp: 10 },
        { name: 'Bag of Cash', value: 200, xp: 20 },
    ];

    // Functie om jailstatus op te halen
    const fetchJailStatus = async () => {
        if (!walletAddress) return;

        try {
            const response = await fetch(`${JAIL_API_URL}/jail-status/${walletAddress}`);
            if (response.ok) {
                const data = await response.json();
                console.log('[StealCar] Initial jail status fetched:', data);
                setInJail(data.isInJail && !!data.jailReleaseTime);
            } else {
                console.error('[StealCar] Failed to fetch jail status:', response.statusText);
                setInJail(false);
            }
        } catch (error) {
            console.error('[StealCar] Error fetching jail status:', error);
            setInJail(false);
        }
    };

    useEffect(() => {
        if (!socket || !walletAddress) return;
    
        socket.emit('register', walletAddress);
    
        const handleJailStatusUpdate = (data: { walletAddress: string; isInJail: boolean; jailReleaseTime: string | null }) => {
            console.log('[StealCar] Received jailStatusUpdated event:', data);
            if (data.walletAddress === walletAddress) {
                const jailReleaseTime = data.jailReleaseTime ? new Date(data.jailReleaseTime).getTime() : null;
                const isCurrentlyInJail = data.isInJail && jailReleaseTime && jailReleaseTime > Date.now();
                setInJail(!!isCurrentlyInJail);
            }
        };
    
        socket.on('jailStatusUpdated', handleJailStatusUpdate);
    
        return () => {
            socket.off('jailStatusUpdated', handleJailStatusUpdate);
        };
    }, [socket, walletAddress]);

    useEffect(() => {
        if (walletAddress) {
            fetchJailStatus();
        }
    }, [walletAddress]);

    const attemptCarTheft = async (option: { car: string; successChance: number }) => {
        if (!walletAddress || inJail || loading) {
            setResult("You can't steal a car while in jail!");
            return;
        }

        setLoading(true);
        try {
            const success = Math.random() < option.successChance;

            if (success) {
                const rewardItem = items[Math.floor(Math.random() * items.length)];
                setResult(`Success! You stole a ${option.car} and earned ${rewardItem.name}`);
                await updatePlayerInventory(walletAddress, rewardItem);
            } else {
                setResult(`Failed to steal ${option.car}. You're going to jail!`);
                await sendToJail();
            }

            // Clear the result message after 2 seconds
            setTimeout(() => setResult(null), 2000);  // Clear message after 2 seconds
        } catch (error) {
            console.error('Error attempting car theft:', error);
        } finally {
            setLoading(false);
        }
    };

    const updatePlayerInventory = async (walletAddress: string, item: { name: string; value: number; xp: number }) => {
        try {
            const response = await fetch(`${PLAYER_API_URL}/add-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, item }),
            });

            if (!response.ok) {
                console.error('Failed to update player inventory');
            }
        } catch (error) {
            console.error('Error updating player inventory:', error);
        }
    };

    const sendToJail = async () => {
        if (!walletAddress) return;

        try {
            const response = await fetch(`${JAIL_API_URL}/jail/${walletAddress}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jailTime: 5 }), // Jail time in minutes
            });

            if (response.ok) {
                setInJail(true);
            } else {
                console.error('Failed to send player to jail');
            }
        } catch (error) {
            console.error('Error sending player to jail:', error);
        }
    };

    return (
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg text-white max-w-full mx-auto">
            <h2 className="text-3xl text-yellow-400 font-bold text-center mb-6">Steal a Car</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {carOptions.map((option, index) => (
                    <div
                        key={index}
                        className={`flex flex-col items-center bg-gray-800 p-6 rounded-lg shadow-lg transition transform hover:scale-105 w-full ${
                            loading || inJail ? 'opacity-50' : ''
                        }`}
                    >
                        <img src={option.iconPath} alt={option.car} className="w-16 h-16 mb-4" />
                        <button
                            onClick={() => attemptCarTheft(option)}
                            className={`py-2 px-4 rounded-lg font-semibold text-lg w-full transition duration-300 ${
                                loading || inJail ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500'
                            }`}
                            disabled={loading || inJail}
                        >
                            {loading ? 'Processing...' : inJail ? 'In Jail' : `Steal a ${option.car}`}
                        </button>
                    </div>
                ))}
            </div>
            {result && (
                <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                    <p className="text-yellow-300 font-semibold text-lg">{result}</p>
                </div>
            )}
        </div>
    );
};

export default StealCar;
