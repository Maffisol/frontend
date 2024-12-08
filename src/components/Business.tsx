import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';  // Zorg ervoor dat je het pad naar je SocketContext correct instelt

const JAIL_API_URL = import.meta.env.VITE_JAIL_API_URL;
const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;
const BUSINESS_API_URL = import.meta.env.VITE_BUSINESS_API_URL;

interface PlayerProfile {
    money: number;
    bags: number;
    ounces: number;
    halfKilos: number;
    kilos: number;
}

interface BusinessProps {
    walletAddress: string;
}

const Business: React.FC<BusinessProps> = ({ walletAddress }) => {
    const socket = useSocket().socket;  // Haal de socket op uit de context
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [inJail, setInJail] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!walletAddress || !socket) return; // Ensure socket is available
    
        socket.emit('register', walletAddress);
    
        const handleJailStatusUpdate = (data: { walletAddress: string; isInJail: boolean; jailReleaseTime: string | null }) => {
            console.log('[StealCar] Received jailStatusUpdated event:', data);
            if (data.walletAddress === walletAddress) {
                const jailReleaseTime = data.jailReleaseTime ? new Date(data.jailReleaseTime).getTime() : null;
    
                // Ensure isCurrentlyInJail is always a boolean value
                const isCurrentlyInJail = Boolean(data.isInJail && jailReleaseTime && jailReleaseTime > Date.now());
                setInJail(isCurrentlyInJail); // Set jail status
            }
        };
    
        socket.on('jailStatusUpdated', handleJailStatusUpdate);
    
        // Cleanup on component unmount
        return () => {
            socket.off('jailStatusUpdated', handleJailStatusUpdate);
        };
    }, [walletAddress, socket]); // Add socket as a dependency
    

    const fetchProfileData = async () => {
        try {
            const response = await fetch(`${PLAYER_API_URL}/profile/${walletAddress}`);
            if (!response.ok) throw new Error('Failed to fetch player profile');
            const data: PlayerProfile = await response.json();
            setProfile(data);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const fetchJailStatus = async () => {
        try {
            const response = await fetch(`${JAIL_API_URL}/jail-status/${walletAddress}`);
            if (response.ok) {
                const data = await response.json();
                setInJail(!!data.jailReleaseTime && data.isInJail);
            } else {
                console.error('Failed to fetch jail status');
                setInJail(false);
            }
        } catch (error) {
            console.error('Error fetching jail status:', error);
            setInJail(false);
        }
    };

    // Fetch profile and jail status on component mount
    useEffect(() => {
        if (walletAddress) {
            fetchProfileData();
            fetchJailStatus();
        }
    }, [walletAddress]);

    const handleAction = async (endpoint: string, successMessage: string) => {
        if (inJail) {
            alert('You cannot perform this action while in jail.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${BUSINESS_API_URL}/${endpoint}/${walletAddress}`, {
                method: 'PUT',
            });
            if (!response.ok) throw new Error('Action failed');

            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            alert(successMessage);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return <div className="text-yellow-300 text-center">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    return (
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <div className="col-span-2 bg-yellow-300 p-6 rounded-lg flex flex-wrap gap-4 justify-center lg:justify-between items-center">
                <span className="text-gray-900 font-bold">Money: ${profile.money}</span>
                <span className="text-gray-900 font-bold">Bags: {profile.bags}</span>
                <span className="text-gray-900 font-bold">Ounces: {profile.ounces}</span>
                <span className="text-gray-900 font-bold">Half Kilos: {profile.halfKilos}</span>
                <span className="text-gray-900 font-bold">Kilos: {profile.kilos}</span>
            </div>

            {/* Purchases Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
                <h2 className="text-3xl text-yellow-400 font-bold text-center mb-6">Purchases</h2>
                <button
                    onClick={() => handleAction('buyOunce', 'Successfully bought an ounce!')}
                    className={`${
                        inJail ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-300'
                    } text-gray-900 transition duration-300 py-3 rounded-lg font-semibold shadow-lg w-full`}
                    disabled={inJail || loading}
                >
                    {loading ? 'Processing...' : 'Buy an Ounce ($600)'}
                </button>
                <button
                    onClick={() => handleAction('buyHalfKilo', 'Successfully bought a half kilo!')}
                    className={`${
                        inJail ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-300'
                    } text-gray-900 transition duration-300 py-3 rounded-lg font-semibold shadow-lg w-full`}
                    disabled={inJail || loading}
                >
                    {loading ? 'Processing...' : 'Buy a Half Kilo ($2200)'}
                </button>
            </div>

            {/* Sales Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
                <h2 className="text-3xl text-yellow-400 font-bold text-center mb-6">Sales</h2>
                <button
                    onClick={() => handleAction('sellBags', 'Successfully sold a bag!')}
                    className={`${
                        inJail ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-300'
                    } text-gray-900 transition duration-300 py-3 rounded-lg font-semibold shadow-lg w-full`}
                    disabled={inJail || loading}
                >
                    {loading ? 'Processing...' : 'Sell a Bag ($10)'}
                </button>
                <button
                    onClick={() => handleAction('sellOunce', 'Successfully sold an ounce!')}
                    className={`${
                        inJail ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-300'
                    } text-gray-900 transition duration-300 py-3 rounded-lg font-semibold shadow-lg w-full`}
                    disabled={inJail || loading}
                >
                    {loading ? 'Processing...' : 'Sell an Ounce ($650)'}
                </button>
            </div>
        </div>
    );
};

export default Business;
