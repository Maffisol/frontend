import { useState, useEffect } from 'react';

interface JailProps {
    walletAddress: string | undefined;
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
    const [familyInmates, setFamilyInmates] = useState<Inmate[]>([]);
    const [allInmates, setAllInmates] = useState<Inmate[]>([]);
    const [inJail, setInJail] = useState<boolean>(false);
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const JAIL_API_URL = import.meta.env.VITE_JAIL_API_URL;
    const BAILOUT_COST = 200;

    useEffect(() => {
        if (!walletAddress) {
            console.error('walletAddress is undefined');
            return;
        }

        fetchInmates();
        checkJailStatus();
    }, [walletAddress]);

    // Timer to decrease jail time
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
            if (!response.ok) {
                throw new Error('Failed to fetch inmates');
            }
    
            const data = await response.json();
    
            // Filter en controleer validiteit van velden
            const currentInmates = data.filter((inmate: Inmate) => {
                const jailReleaseTime = inmate.jail?.jailReleaseTime
                    ? new Date(inmate.jail.jailReleaseTime).getTime()
                    : null;
    
                return inmate.jail?.isInJail && jailReleaseTime && jailReleaseTime > Date.now();
            });
    
            const playerData = data.find((inmate: Inmate) => inmate.walletAddress === walletAddress);
            const playerFamilyId = playerData?.family || null;
    
            setFamilyInmates(currentInmates.filter((inmate: Inmate) => inmate.family === playerFamilyId));
            setAllInmates(currentInmates.filter((inmate: Inmate) => inmate.family !== playerFamilyId));
        } catch (error) {
            console.error('Error fetching inmates:', error);
        }
    };
    
    const checkJailStatus = async () => {
        if (!walletAddress) return;
    
        try {
            const response = await fetch(`${JAIL_API_URL}/jail-status/${walletAddress}`);
            if (!response.ok) {
                throw new Error('Failed to check jail status');
            }
    
            const data = await response.json();
            const jailReleaseTime = data.jailReleaseTime
                ? new Date(data.jailReleaseTime).getTime()
                : null;
    
            setInJail(data.isInJail && !!jailReleaseTime);
            setRemainingTime(jailReleaseTime ? jailReleaseTime - Date.now() : null);
        } catch (error) {
            console.error('Error checking jail status:', error);
        }
    };
    

    const releasePlayerFromJail = async () => {
        if (!walletAddress) return;

        try {
            const response = await fetch(`${JAIL_API_URL}/release-jail/${walletAddress}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to release player from jail');
            }

            console.log('Player successfully released from jail');
        } catch (error) {
            console.error('Error releasing player from jail:', error);
        }
    };

    const bailOutFamilyMember = async (familyMemberAddress: string) => {
        if (!walletAddress) return;

        try {
            const response = await fetch(`${JAIL_API_URL}/bailout/${walletAddress}/${familyMemberAddress}`, {
                method: 'POST',
            });

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

    const formatRemainingTime = (milliseconds: number | null) => {
        if (milliseconds === null) return 'unknown time';
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

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
                            <p className="text-gray-400">Bailout Cost: {BAILOUT_COST}</p>
                            <button
                                onClick={() => bailOutFamilyMember(inmate.walletAddress)}
                                className="bg-yellow-400 text-gray-900 px-4 py-2 mt-2 rounded"
                            >
                                Bail Out
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
                            <p className="text-gray-400">Bailout Cost: {BAILOUT_COST}</p>
                            <button
                                onClick={() => bailOutFamilyMember(inmate.walletAddress)}
                                className="bg-yellow-400 text-gray-900 px-4 py-2 mt-2 rounded"
                            >
                                Bail Out
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
