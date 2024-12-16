import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_LEADERBOARD_API_URL,
    timeout: 10000,
});

interface LeaderboardEntry {
    walletAddress: string;
    username: string;
    points: number;
    family: string;
    rank: string;
    isPro: boolean;
}

interface FamilyEntry {
    familyName: string;
    memberCount: number;
    totalPoints: number;
    dominancePoints: number;
}

interface LeaderboardProps {
    type: 'players' | 'families';
}

const Leaderboard: React.FC<LeaderboardProps> = ({ type }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [families, setFamilies] = useState<FamilyEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const socket = useSocket().socket;

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/${type}`);
            const data = response.data;
            console.log('Fetched leaderboard data:', data);
            type === 'players' ? setLeaderboard(data) : setFamilies(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [type]);

    useEffect(() => {
        if (!socket) return;

        socket.on('leaderboardUpdate', (updatedData: any) => {
            if (type === 'players') {
                setLeaderboard(updatedData);
            } else if (type === 'families') {
                setFamilies(updatedData);
            }
        });

        return () => {
            socket.off('leaderboardUpdate');
        };
    }, [socket, type]);

    return (
        <div className="w-full overflow-x-auto border-none">
            {loading ? (
                <p className="text-yellow-300 text-center">Loading...</p>
            ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
            ) : type === 'players' ? (
                <div className="w-full text-gray-300">
                    {/* Header */}
                    <div className="flex justify-between py-3 px-0 rounded-t-lg">
                    <span className="w-2/6 font-bold text-left ml-2">Player</span>
                    <span className="w-2/6 font-bold">Family</span>
                    <span className="w-1/6 font-bold">Rank</span>
                    <span className="w-1/6 font-bold">Points</span>
                    </div>
                    {/* Content */}
                    {leaderboard.length === 0 ? (
                        <div className="py-4 text-center">No players yet.</div>
                    ) : (
                        leaderboard.map((player, index) => (
                            <div
                                key={player.walletAddress}
                                className={`flex justify-between items-center py-3 px-0 mb-2 rounded-lg ${
                                    index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'
                                }`}
                            >
                                <div className="w-2/6 text-left ml-2">
                                    {player.username}
                                    {player.isPro && <span className="ml-2 text-yellow-500">★</span>}
                                </div>
                                <div className="w-2/6">{player.family}</div>
                                <div className="w-1/6">{player.rank}</div>
                                <div className="w-1/6">{player.points}</div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="w-full text-gray-300">
                    {/* Header */}
                    <div className="flex justify-between py-3 px-0 rounded-t-lg">
                    <span className="w-1/4 font-bold text-left ml-2">Family</span>
                    <span className="w-1/4 font-bold">Members</span>
                    <span className="w-1/4 font-bold">Total Points</span>
                    <span className="w-1/4 font-bold">Dominance Points</span>
                    </div>
                    {/* Content */}
                    {families.length === 0 ? (
                        <div className="py-4 text-center">No families yet.</div>
                    ) : (
                        families.map((family, index) => (
                            <div
                                key={family.familyName}
                                className={`flex justify-between items-center py-3 px-0 mb-2 rounded-lg ${
                                    index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'
                                }`}
                            >
                                <div className="w-1/4 text-left ml-2">{family.familyName}</div>
                                <div className="w-1/4">{family.memberCount}</div>
                                <div className="w-1/4">{family.totalPoints}</div>
                                <div className="w-1/4">{family.dominancePoints || 0}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
    
    
};

export default Leaderboard;
