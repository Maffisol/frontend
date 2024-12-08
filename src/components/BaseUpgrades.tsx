import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';  // Zorg ervoor dat je het pad naar je SocketContext correct instelt

const UPGRADE_API_URL = import.meta.env.VITE_UPGRADE_API_URL;
const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;
const JAIL_API_URL = import.meta.env.VITE_JAIL_API_URL;

interface BaseUpgrade {
    _id: string;
    name: string;
    type: string;
    cost: number;
    description: string;
}

interface PlayerProfile {
    _id: string;
    money: number;
    upgrades: { upgradeId: { _id: string } }[];
}

interface BaseUpgradesProps {
    walletAddress?: string;
}

const BaseUpgrades: React.FC<BaseUpgradesProps> = ({ walletAddress }) => {
    const socket = useSocket().socket;  // Haal de socket op uit de context
    const [upgrades, setUpgrades] = useState<BaseUpgrade[]>([]);
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [inJail, setInJail] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [processingUpgradeId, setProcessingUpgradeId] = useState<string | null>(null);

    const fetchBaseUpgrades = useCallback(async () => {
        try {
            const response = await fetch(`${UPGRADE_API_URL}/all`);
            if (!response.ok) throw new Error('Failed to fetch base upgrades data');
            const data: BaseUpgrade[] = await response.json();
            setUpgrades(data);
        } catch (err) {
            console.error('Error fetching base upgrades:', err);
            setError('Error fetching base upgrades data. Please try again later.');
        }
    }, []);

    const fetchProfileData = useCallback(async () => {
        if (!walletAddress) {
            setError('No wallet address provided. Please connect your wallet.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${PLAYER_API_URL}/profile/${walletAddress}`);
            if (!response.ok) throw new Error('Failed to fetch player profile data');
            const data: PlayerProfile = await response.json();
            setProfile(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching player profile:', err);
            setError('Error fetching player profile data. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    const fetchJailStatus = useCallback(async () => {
        if (!walletAddress) return;

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
    }, [walletAddress]);

    useEffect(() => {
        if (walletAddress) {
            setLoading(true);
    
            // Fetch data concurrently and handle the loading state properly
            Promise.all([fetchBaseUpgrades(), fetchProfileData(), fetchJailStatus()])
                .finally(() => setLoading(false));  // Set loading to false once all promises settle
    
            if (socket) {
                socket.emit('register', walletAddress);  // Ensure socket is available
            }
        }
    }, [walletAddress, fetchBaseUpgrades, fetchProfileData, fetchJailStatus, socket]); // Add socket as a dependency
    
    useEffect(() => {
        if (!socket) return; // Ensure socket is available before proceeding
    
        const handleJailStatusUpdate = (data: { walletAddress: string; isInJail: boolean; jailReleaseTime: string | null }) => {
            if (data.walletAddress === walletAddress) {
                setInJail(!!data.jailReleaseTime && data.isInJail);
            }
        };
    
        const handlePlayerUpdated = (data: { walletAddress: string; updatedPlayer: PlayerProfile }) => {
            if (data.walletAddress === walletAddress) {
                setProfile(data.updatedPlayer);
            }
        };
    
        socket.on('jailStatusUpdated', handleJailStatusUpdate);
        socket.on('playerUpdated', handlePlayerUpdated);
    
        return () => {
            socket.off('jailStatusUpdated', handleJailStatusUpdate);
            socket.off('playerUpdated', handlePlayerUpdated);
        };
    }, [walletAddress, socket]); // Ensure proper dependencies for this effect
    

    const handlePurchaseUpgrade = async (upgradeId: string, upgradeCost: number) => {
        try {
            // Controleer of profiel of wallet niet geladen zijn
            if (!profile || !walletAddress) {
                alert('Player profile not loaded or wallet not connected.');
                return;
            }
    
            // Controleer of de speler in de gevangenis zit
            if (inJail) {
                alert('You cannot purchase upgrades while in jail.');
                return;
            }
    
            // Controleer of de speler voldoende geld heeft
            if (profile.money < upgradeCost) {
                alert('Not enough money to purchase this upgrade.');
                return;
            }
    
            // Controleer of de upgrade al gekocht is
            const hasUpgrade = profile.upgrades?.some(
                (upgrade) =>
                    // Als 'upgradeId' een object is, vergelijken we de '_id' van dat object
                    upgrade.upgradeId?._id === upgradeId ||
                    upgrade.upgradeId._id === upgradeId
            );
    
            if (hasUpgrade) {
                alert('Upgrade already purchased.');
                return;
            }
    
            // Zet de upgrade in verwerking
            setProcessingUpgradeId(upgradeId);
    
            // Verstuur het verzoek om de upgrade te kopen
            const response = await fetch(`${UPGRADE_API_URL}/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, upgradeId }),
            });
    
            // Controleer of de response succesvol is
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Backend Error:', errorData);
                throw new Error(errorData.message || 'Failed to purchase upgrade');
            }
    
            // Verkrijg de response data
            const responseData = await response.json();
            alert('Upgrade purchased successfully!');
            setProfile(responseData.player); // Update profiel
    
        } catch (err) {
            // Foutafhandelingslogica
            console.error('Error purchasing upgrade:', err);
    
            // Controleer of 'err' een Error object is en toon de message
            if (err instanceof Error) {
                alert(err.message || 'Error purchasing upgrade. Please try again later.');
            } else {
                alert('Error purchasing upgrade. Please try again later.');
            }
    
        } finally {
            // Zet de verwerking van de upgrade terug naar null
            setProcessingUpgradeId(null);
        }
    };
    

    const checkIfPurchased = (upgradeId: string) => {
        return profile?.upgrades?.some(
            (purchasedUpgrade) => purchasedUpgrade.upgradeId.toString() === upgradeId
        );
    };
    
    const categoryNames: Record<string, string> = {
        luxury: 'Luxuries',
        car: 'Cars',
        house: 'Houses',
        weapon: 'Weapons',
    };

    const groupedUpgrades = upgrades.reduce((acc, upgrade) => {
        const categoryKey = upgrade.type.trim().toLowerCase();
        const displayName = categoryNames[categoryKey] || upgrade.type;
        (acc[displayName] = acc[displayName] || []).push(upgrade);
        return acc;
    }, {} as Record<string, BaseUpgrade[]>);

    return (
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-[1500px] mx-auto">
            <h2 className="text-3xl mb-6 text-yellow-400 font-bold text-center">Base Upgrades</h2>
            {loading ? (
                <p className="text-yellow-300 text-center">Loading...</p>
            ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
            ) : (
                Object.keys(groupedUpgrades).map((category) => (
                    <div key={category} className="mb-8">
                        <h3 className="text-2xl mb-4 text-yellow-500 font-semibold text-center capitalize">
                            {category}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedUpgrades[category].map((upgrade) => {
                                const isPurchased = checkIfPurchased(upgrade._id);
                                return (
                                    <div
                                        key={upgrade._id}
                                        className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col justify-between text-sm"
                                    >
                                        <div>
                                            <h4 className="text-lg mb-2 text-yellow-300 font-semibold">
                                                {upgrade.name}
                                            </h4>
                                            <p className="text-gray-300 mb-2">{upgrade.description}</p>
                                            <p className="text-yellow-400 font-medium">Cost: ${upgrade.cost}</p>
                                        </div>
                                        <button
    onClick={() => handlePurchaseUpgrade(upgrade._id, upgrade.cost)}
    className={`mt-4 ${
        isPurchased || inJail || processingUpgradeId === upgrade._id.toString()
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-yellow-400 hover:bg-yellow-300'
    } text-gray-900 transition duration-300 ease-in-out py-2 rounded font-semibold shadow-md text-sm`}
    disabled={isPurchased || inJail || processingUpgradeId === upgrade._id.toString() || loading}
>
    {isPurchased
        ? 'Purchased'
        : inJail
        ? 'In Jail'
        : processingUpgradeId === upgrade._id.toString()
        ? 'Processing...'
        : 'Purchase'}
</button>


                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default BaseUpgrades;
