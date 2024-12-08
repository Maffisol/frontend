import React, { useEffect, useState } from 'react';

const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;


interface ProfileData {
    username: string;
    points: number;
    rank: string;
    family: string | { name: string } | null; // Adjusted to handle either string or object
    isPro: boolean;
    money: number;
    baseUpgradesCount: number;
    inventoryItemsCount: number;
}

interface ProfileCardProps {
    walletAddress: string;
}

const rankThresholds = [
    { rank: 'Godfather', points: 100000 },
    { rank: 'Don', points: 50000 },
    { rank: 'Underboss', points: 25000 },
    { rank: 'Capo', points: 10000 },
    { rank: 'Soldier', points: 5000 },
    { rank: 'Associate', points: 1000 },
    { rank: 'Rookie', points: 0 },
];

const calculateRankProgress = (points: number) => {
    const currentRankIndex = rankThresholds.findIndex((threshold) => points >= threshold.points);
    const currentRank = rankThresholds[currentRankIndex];
    const nextRank = rankThresholds[currentRankIndex - 1] || currentRank;

    const pointsForCurrentRank = currentRank.points;
    const pointsForNextRank = nextRank.points;
    const progressToNextRank = ((points - pointsForCurrentRank) / (pointsForNextRank - pointsForCurrentRank)) * 100;

    return {
        currentRank: currentRank.rank,
        nextRank: nextRank.rank,
        progressToNextRank: Math.min(progressToNextRank, 100),
    };
};

const ProfileCard: React.FC<ProfileCardProps> = ({ walletAddress }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await fetch(`${PLAYER_API_URL}/profile/${walletAddress}`);
                const playerData = await response.json();
    
                console.log("Fetched player data:", playerData); // Log the data received
    
                if (response.ok) {
                    setProfile({
                        username: playerData.username || walletAddress,
                        points: playerData.points || 0,
                        rank: playerData.rank || 'Rookie',
                        family: playerData.family || null, // Store family directly and handle rendering in JSX
                        isPro: playerData.isPro || false,
                        money: playerData.money || 0,
                        baseUpgradesCount: playerData.baseUpgradesCount || 0,
                        inventoryItemsCount: playerData.inventoryItemsCount || 0,
                    });
                }
            } catch (err) {
                if (err instanceof Error) {
                    setError(`Error: ${err.message}`);
                    console.error(`Error fetching player data for ${walletAddress}:`, err.message);
                } else {
                    setError('An unknown error occurred');
                }
            }
        };
    
        if (walletAddress) {
            fetchProfileData();
        }
    }, [walletAddress]);
    
    if (error) return <div className="text-red-500">{error}</div>;

    const { currentRank, nextRank, progressToNextRank } = profile
        ? calculateRankProgress(profile.points)
        : { currentRank: 'Rookie', nextRank: 'Associate', progressToNextRank: 0 };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-5 text-white max-w-sm mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-yellow-400">
                    {profile?.username}
                    {profile?.isPro && <span className="ml-2 text-yellow-500" title="Pro Member">★</span>}
                </h2>
                <div className="text-right">
                    <p className="text-sm text-gray-300">Rank</p>
                    <p className="text-lg font-semibold text-yellow-300">{currentRank}</p>
                </div>
            </div>

            <div className="flex justify-between mt-4 space-x-4">
            <div className="flex justify-between mt-4 space-x-4">
    <div className="text-center">
        <p className="text-sm text-gray-400">Family</p>
        <p className="font-semibold text-yellow-300">
    {profile?.family && typeof profile.family === 'object' 
        ? (profile.family as { name: string }).name
        : (typeof profile?.family === 'string' ? profile.family : 'No Family')}
</p>
    </div>
</div>
                <div className="text-center">
                    <p className="text-sm text-gray-400">Points</p>
                    <p className="font-semibold text-yellow-300">{profile?.points}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-400">Money</p>
                    <p className="font-semibold text-yellow-300">${profile?.money.toFixed(2)}</p>
                </div>
            </div>

            {/* Additional Info: Base Upgrades & Inventory Items */}
            <div className="flex justify-between mt-4 space-x-4">
                <div className="text-center">
                    <p className="text-sm text-gray-400">Base Upgrades</p>
                    <p className="font-semibold text-yellow-300">{profile?.baseUpgradesCount}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-400">Inventory Items</p>
                    <p className="font-semibold text-yellow-300">{profile?.inventoryItemsCount}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5">
                <div className="bg-gray-600 h-3 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full"
                        style={{ width: `${progressToNextRank}%`, backgroundColor: '#FFD700' }}
                    />
                </div>
                <p className="text-sm text-yellow-300 mt-2 text-center">
                    {progressToNextRank.toFixed(1)}% to {nextRank}
                </p>
            </div>
        </div>
    );
};

export default ProfileCard;
