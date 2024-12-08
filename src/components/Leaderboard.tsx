import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';  // Zorg ervoor dat je het pad naar je SocketContext correct instelt

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
    dominancePoints: number; // Dominance points toegevoegd
}

interface LeaderboardProps {
    type: 'players' | 'families';
}

const Leaderboard: React.FC<LeaderboardProps> = ({ type }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [families, setFamilies] = useState<FamilyEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const socket = useSocket().socket;  // Haal de socket op uit de context

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/leaderboard/${type}`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard data');
            const data = await response.json();
            console.log("Fetched leaderboard data:", data); // Log de ontvangen data
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

    // Listen for updates to leaderboard data
    useEffect(() => {
        if (!socket) return;

        socket.on("leaderboardUpdate", (updatedData: any) => {
            if (type === 'players') {
                setLeaderboard(updatedData);
            } else if (type === 'families') {
                setFamilies(updatedData);
            }
        });

        // Clean up the socket connection when the component is unmounted
        return () => {
            socket.off("leaderboardUpdate");
        };
    }, [socket, type]);

    return (
        <div className="overflow-x-auto">
            {loading ? (
                <p className="text-yellow-300 text-center">Loading...</p>
            ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
            ) : type === 'players' ? (
                <table className="min-w-full table-fixed text-gray-300">
                    <thead>
                        <tr className="bg-gray-700">
                            <th className="py-3 px-2 text-left w-1/4">Username</th>
                            <th className="py-3 px-2 text-left w-1/4">Family</th>
                            <th className="py-3 px-2 text-left w-1/5">Rank</th>
                            <th className="py-3 px-2 text-left w-1/5">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-4 text-center">No players yet.</td>
                            </tr>
                        ) : (
                            leaderboard.map(player => (
                                <tr key={player.walletAddress} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                                    <td className="py-2 px-2 text-left">
                                        {player.username}
                                        {player.isPro && <span className="ml-2 text-yellow-500">★</span>}
                                    </td>
                                    <td className="py-2 px-2 text-left">{player.family}</td>
                                    <td className="py-2 px-2 text-left">{player.rank}</td>
                                    <td className="py-2 px-2 text-left">{player.points}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            ) : (
                <table className="min-w-full table-fixed text-gray-300">
                    <thead>
                        <tr className="bg-gray-700">
                            <th className="py-3 px-2 text-left w-1/4">Family</th>
                            <th className="py-3 px-2 text-left w-1/4">Members</th>
                            <th className="py-3 px-2 text-left w-1/4">Total Points</th>
                            <th className="py-3 px-2 text-left w-1/4">Dominance Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {families.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-4 text-center">No families yet.</td>
                            </tr>
                        ) : (
                            families.map(family => (
                                <tr key={family.familyName} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                                    <td className="py-2 px-2 text-left">{family.familyName}</td>
                                    <td className="py-2 px-2 text-left">{family.memberCount}</td>
                                    <td className="py-2 px-2 text-left">{family.totalPoints}</td>
                                    <td className="py-2 px-2 text-left">{family.dominancePoints || 0}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Leaderboard;
