import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';  // Zorg ervoor dat je het pad naar je SocketContext correct instelt


interface CrimesProps {
    walletAddress: string | undefined;
}

interface JailStatusData {
    walletAddress: string;
    isInJail: boolean;
    jailReleaseTime: string | null; // Als het een datum is, kan dit een string zijn of null
}

const Crimes: React.FC<CrimesProps> = ({ walletAddress }) => {
    const socket = useSocket().socket;  // Haal de socket op uit de context
    const [result, setResult] = useState<string | null>(null);
    const [inJail, setInJail] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const JAIL_API_URL = import.meta.env.VITE_JAIL_API_URL;
    const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;

    const crimeOptions = [
        { crime: 'Rob a Bank', successChance: 0.3, image: '/assets/bank.png' },
        { crime: 'Drug Deal', successChance: 0.5, image: '/assets/drug-deal.png' },
        { crime: 'Blackmail', successChance: 0.6, image: '/assets/blackmail.png' },
    ];

    const items = [
        { name: 'Luxury Watch', value: 200, xp: 20 },
        { name: 'Diamond Ring', value: 150, xp: 15 },
        { name: 'Stolen Cash', value: 100, xp: 10 },
    ];

    // Fetch jail status on component load
 // Fetch jail status on component load
useEffect(() => {
    if (!walletAddress) return;

    const fetchJailStatus = async () => {
        try {
            const response = await fetch(`${JAIL_API_URL}/jail-status/${walletAddress}`);
            if (response.ok) {
                const data = await response.json();
                setInJail(data.isInJail && !!data.jailReleaseTime); // Correct status
            } else {
                console.error('Failed to fetch jail status');
            }
        } catch (error) {
            console.error('Error fetching jail status:', error);
        }
    };

    fetchJailStatus();

    // No cleanup needed here, return nothing
}, [walletAddress]); // Only rerun if walletAddress changes

    
// Real-time socket updates
const handleJailStatusUpdate = (data: JailStatusData) => {
    if (data.walletAddress === walletAddress) {
        // Ensure jailReleaseTime is a valid value before checking the status
        const isCurrentlyInJail = data.isInJail && data.jailReleaseTime != null;
        setInJail(isCurrentlyInJail);
    }
};

useEffect(() => {
    if (!socket) return; // Ensure socket is available
    socket.on('jailStatusUpdated', handleJailStatusUpdate);

    return () => {
        socket.off('jailStatusUpdated', handleJailStatusUpdate);
    };
}, [walletAddress, socket]);  // Include socket in the dependency array to ensure proper updates

    

    const attemptCrime = async (option: { crime: string; successChance: number }) => {
        if (!walletAddress || inJail || loading) {
            setResult("You can't attempt a crime while in jail!");
            return;
        }

        setLoading(true);
        try {
            const success = Math.random() < option.successChance;

            if (success) {
                const rewardItem = items[Math.floor(Math.random() * items.length)];
                setResult(`Success! You earned ${rewardItem.name}`);
                await updatePlayerInventory(rewardItem);
            } else {
                setResult("Crime failed! Sending you to jail.");
                await sendToJail();
            }
        } catch (error) {
            console.error("Error attempting crime:", error);
        } finally {
            setLoading(false);
        }
    };

    const updatePlayerInventory = async (item: { name: string; value: number; xp: number }) => {
        if (!walletAddress) return;

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
            const response = await fetch(`${PLAYER_API_URL}/jail/${walletAddress}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jailTime: 5 }), // Jail tijd in minuten
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
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-full mx-auto text-white">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Crimes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {crimeOptions.map((option, index) => (
                    <div
                        key={index}
                        className={`flex flex-col items-center bg-gray-800 p-6 rounded-lg shadow-lg w-full transition transform hover:scale-105 ${
                            loading || inJail ? 'opacity-50' : ''
                        }`}
                    >
                        <img src={option.image} alt={option.crime} className="w-16 h-16 mb-4" />
                        <button
                            onClick={() => attemptCrime(option)}
                            className={`py-2 px-4 rounded-lg font-semibold text-lg w-full transition duration-300 ${
                                loading || inJail ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
                            }`}
                            disabled={loading || inJail}
                        >
                            {loading ? 'Processing...' : inJail ? 'In Jail' : `Try ${option.crime}`}
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

export default Crimes;
