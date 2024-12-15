import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

interface JailProps {
    walletAddress: string;
}

interface Inmate {
    username: string;
    rank: string;
    family: string;
    jail: {
        isInJail: boolean;
        jailReleaseTime: string;
    };
    walletAddress: string;
}

const Jail: React.FC<JailProps> = ({ walletAddress }) => {
    const socket = useSocket().socket;  // Get socket from context
    const [familyInmates, setFamilyInmates] = useState<Inmate[]>([]);
    const [allInmates, setAllInmates] = useState<Inmate[]>([]);
    const [inJail, setInJail] = useState<boolean>(false);
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const [playerRank, setPlayerRank] = useState<string | null>(null);
    const JAIL_API_URL = import.meta.env.VITE_JAIL_API_URL;

    const calculateBailoutCost = (inmate: Inmate): number => {
        const baseCost = 200;
        const rankMultiplier: { [key: string]: number } = {
            Rookie: 1,
            Soldier: 1.5,
            Capo: 2,
            Boss: 3,
        };

        const timeMultiplier = inmate.jail.jailReleaseTime
            ? Math.max(1, (new Date(inmate.jail.jailReleaseTime).getTime() - Date.now()) / (60 * 60 * 1000))
            : 1;

        const rankCost = rankMultiplier[inmate.rank as keyof typeof rankMultiplier] || 1;

        // Extra logic to modify the bailout cost based on player's rank
        if (playerRank === 'Boss') {
            return Math.ceil(baseCost * rankCost * timeMultiplier * 0.8); // 20% discount for 'Boss'
        }

        return Math.ceil(baseCost * rankCost * timeMultiplier);
    };

    useEffect(() => {
        if (!walletAddress) return;

        // Fetch inmates and jail status only if necessary
        fetchInmates();
        checkJailStatus();
    }, [walletAddress]);

    useEffect(() => {
        if (inJail && remainingTime !== null && remainingTime > 0) {
            const timer = setInterval(() => {
                setRemainingTime((prevTime) => {
                    if (prevTime && prevTime <= 1000) {
                        clearInterval(timer);
                        setInJail(false);
                        releasePlayerFromJail();
                        return 0;
                    }
                    return prevTime !== null ? prevTime - 1000 : null;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [inJail, remainingTime]);

    const fetchInmates = async () => {
        try {
            const response = await fetch(`${JAIL_API_URL}/jail-list`);
            if (!response.ok) throw new Error('Failed to fetch inmates');
            const data = await response.json();
    
            // Filter in-game inmates
            const currentInmates = data.filter((inmate: Inmate) => inmate.jail?.isInJail && new Date(inmate.jail.jailReleaseTime).getTime() > Date.now());
    
            const playerData = data.find((inmate: Inmate) => inmate.walletAddress === walletAddress);
            setPlayerRank(playerData?.rank || null);
    
            const playerFamilyId = playerData?.family || null;
    
            // Filter the family members (those who belong to the same family)
            const familyInmates = currentInmates.filter((inmate: Inmate) => {
                return inmate.family && inmate.family === playerFamilyId && inmate.walletAddress !== walletAddress;
            });
    
            // Filter the allInmates (players without family or with different family)
            const allInmates = currentInmates.filter((inmate: Inmate) => {
                return !inmate.family || inmate.family !== playerFamilyId;
            });
    
            setFamilyInmates(familyInmates);
            setAllInmates(allInmates);
    
        } catch (error) {
            console.error('Error fetching inmates:', error);
        }
    };
    

    const checkJailStatus = async () => {
        if (!walletAddress) return;

        try {
            const response = await fetch(`${JAIL_API_URL}/jail-status/${walletAddress}`);
            if (!response.ok) throw new Error('Failed to check jail status');
            const data = await response.json();

            const jailReleaseTime = data.jailReleaseTime ? new Date(data.jailReleaseTime).getTime() : null;
            setInJail(data.isInJail && !!jailReleaseTime);
            setRemainingTime(jailReleaseTime ? jailReleaseTime - Date.now() : null);
        } catch (error) {
            console.error('Error checking jail status:', error);
        }
    };

    const releasePlayerFromJail = async () => {
        if (!walletAddress) return;

        try {
            const response = await fetch(`${JAIL_API_URL}/release-jail/${walletAddress}`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to release player from jail');
            console.log('Player successfully released from jail');
        } catch (error) {
            console.error('Error releasing player from jail:', error);
        }
    };

    const bailOutFamilyMember = async (familyMemberAddress: string) => {
        if (!walletAddress) return;

        try {
            const response = await fetch(`${JAIL_API_URL}/bailout/${walletAddress}/${familyMemberAddress}`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                fetchInmates();
            } else {
                alert(data.message || 'Failed to bail out family member');
            }
        } catch (error) {
            console.error('Error bailing out family member:', error);
        }
    };

    const bailOutInmate = async (inmateAddress: string) => {
        if (!walletAddress) return;

        try {
            const response = await fetch(`${JAIL_API_URL}/bailout/${walletAddress}/${inmateAddress}`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                fetchInmates();
            } else {
                alert(data.message || 'Failed to bail out inmate');
            }
        } catch (error) {
            console.error('Error bailing out inmate:', error);
        }
    };

    const formatRemainingTime = (milliseconds: number | null) => {
        if (milliseconds === null) return 'unknown time';
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const handleSocket = () => {
        if (socket) {
            socket.on('jail-status-update', (data) => {
                // Handle jail status updates from the server
                if (data.walletAddress === walletAddress) {
                    setInJail(data.isInJail);
                    setRemainingTime(data.jailReleaseTime ? data.jailReleaseTime - Date.now() : null);
                }
            });

            socket.on('inmate-updated', () => {
                // Re-fetch inmates when there is an update
                fetchInmates();
            });
        }
    };

    useEffect(() => {
        handleSocket(); // Listen to socket events when the component mounts
        return () => {
            if (socket) {
                socket.off('jail-status-update');
                socket.off('inmate-updated');
            }
        };
    }, [socket, walletAddress]);

    return (
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md mx-auto text-white">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Jail Status</h2>
            {inJail && remainingTime !== null ? (
                <div className="text-center">
                    <p className="text-xl font-semibold text-red-500">Time remaining:</p>
                    <p className="text-2xl font-bold text-yellow-300 mt-2">{formatRemainingTime(remainingTime)}</p>
                </div>
            ) : (
                <p className="text-xl text-green-400 text-center">You are not in jail.</p>
            )}

            <div className="mt-6">
                <h3 className="text-2xl text-yellow-300 mb-4">Family Inmates</h3>
                {familyInmates.length > 0 ? (
                    familyInmates.map((inmate) => (
                        <div key={inmate.walletAddress} className="bg-gray-800 p-4 rounded-lg mb-2 text-center">
                            <p className="text-yellow-300 font-bold">{inmate.username} ({inmate.rank})</p>
                            <p className="text-gray-400">Release: {new Date(inmate.jail.jailReleaseTime).toLocaleTimeString()}</p>
                            <p className="text-gray-400">Bailout Cost: {calculateBailoutCost(inmate)}</p>
                            <button
                                onClick={() => bailOutFamilyMember(inmate.walletAddress)}
                                disabled={inJail} // Disable if player is in jail
                                className={`${
                                    inJail ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400'
                                } text-gray-900 px-4 py-2 mt-2 rounded`}
                            >
                                {inJail ? 'In Jail' : 'Bail Out'}
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-center">No family inmates are currently in jail.</p>
                )}
            </div>

            <div className="mt-6">
                <h3 className="text-2xl text-yellow-300 mb-4">All Inmates</h3>
                {allInmates.length > 0 ? (
                    allInmates.map((inmate) => (
                        <div key={inmate.walletAddress} className="bg-gray-800 p-4 rounded-lg mb-2 text-center">
                            <p className="text-yellow-300 font-bold">{inmate.username} ({inmate.rank})</p>
                            <p className="text-gray-400">Release: {new Date(inmate.jail.jailReleaseTime).toLocaleTimeString()}</p>
                            <p className="text-gray-400">Bailout Cost: {calculateBailoutCost(inmate)}</p>
                            <button
                              onClick={() => bailOutInmate(inmate.walletAddress)}
                              disabled={inJail} // Disable if player is in jail
                              className={`${
                              inJail ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400'
                              } text-gray-900 px-4 py-2 mt-2 rounded`}
                            >
                              {inJail ? 'In Jail' : 'Bail Out'}
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-center">No inmates are currently in jail.</p>
                )}
            </div>
        </div>
    );
};

export default Jail;
