import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';  // Zorg ervoor dat je het pad naar je SocketContext correct instelt

interface KillProps {
    currentUserId: string;         // Bijvoorbeeld als string
    currentUserRank: string;       // Bijvoorbeeld als string
    currentUserFamily: { name: string, id: string } | null; // Kan een object zijn of null
    walletAddress: string;         // Bijvoorbeeld als string
  }

  interface Family {
    name: string;
    // Voeg andere velden toe als nodig
  }

  interface Player {
    _id: string;
    username: string;
    name: string;
    rank: string;
    family?: Family;
    jail?: Jail;
    points: string; 
  }

  interface Jail {
    isInJail: boolean;
    jailReleaseTime?: string; // Optioneel, afhankelijk van je structuur
  }
const Kill: React.FC<KillProps> = ({ currentUserId, currentUserRank, currentUserFamily, walletAddress }) => {
    const socket = useSocket().socket;  // Haal de socket op uit de context
    const [players, setPlayers] = useState<Player[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
    const [isInJail, setIsInJail] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('username');
    const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;
    const KILL_API_URL = import.meta.env.VITE_KILL_API_URL;
    const JAIL_API_URL = import.meta.env.VITE_JAIL_API_URL;


    useEffect(() => {
        if (socket) {
            socket.on("attackResult", (data) => {
                if (data.attackerId === currentUserId) {
                    alert(data.message);
                    if (data.success) {
                        // Optionally: Update local state on successful attack
                        setPlayers((prev) => prev.filter((player) => player._id !== data.targetId));
                    }
                }
            });
    
            return () => {
                socket.off("attackResult"); // Clean up listener on unmount
            };
        }
    }, [currentUserId, socket]);
    



    // Fetch eligible players and jail status
    useEffect(() => {
        const fetchPlayersAndStatus = async () => {
            if (!currentUserId || !walletAddress) {
                console.error('Current user ID or wallet address is missing');
                return;
            }

            try {
                // Fetch all players
                const playerResponse = await fetch(`${PLAYER_API_URL}/players`);
                if (!playerResponse.ok) throw new Error('Failed to fetch players');
                const playerData = await playerResponse.json();

                // Filter out "Rookie" players and players in jail
                const eligiblePlayers = playerData.filter((player: Player) => {
                    const isCurrentUser = String(player._id) === String(currentUserId);
                    const isNotRookie = player.rank !== 'Rookie';
                    const isNotInJail = !player.jail?.isInJail;
                    return !isCurrentUser && isNotRookie && isNotInJail;
                });

                setPlayers(eligiblePlayers);
                setFilteredPlayers(eligiblePlayers);

                // Fetch current user's jail status from Jail API
                const jailResponse = await fetch(`${JAIL_API_URL}/jail-status/${walletAddress}`);
                if (!jailResponse.ok) throw new Error('Failed to fetch jail status');
                const jailData = await jailResponse.json();

                setIsInJail(jailData.isInJail);
            } catch (error) {
                console.error('Error fetching players or jail status:', error);
            }
        };

        fetchPlayersAndStatus();
    }, [currentUserId, walletAddress, currentUserFamily]);

    const handleSearch = () => {
        const searchResults = players.filter((player) => {
            if (searchType === 'username') {
                return player.username.toLowerCase().includes(searchTerm.toLowerCase());
            } else if (searchType === 'family' && player.family) {
                return player.family.name.toLowerCase().includes(searchTerm.toLowerCase());
            }
            return false;
        });
        setFilteredPlayers(searchResults);
    };

    type Rank = 'Rookie' | 'Soldier' | 'Leader'; // Specific rank values

const handleAttack = async (targetId: string, targetRank: string) => {  // targetRank is string but will be cast to Rank
    if (currentUserRank === 'Rookie') {
        alert('Rookie players cannot attack.');
        return;
    }
    if (isInJail) {
        alert('You are in jail and cannot attack.');
        return;
    }

    // Cast targetRank to Rank type
    const targetRankTyped = targetRank as Rank;

    try {
        const response = await fetch(`${KILL_API_URL}/kill`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: currentUserId,
                targetId,
                successChance: calculateSuccessChance(currentUserRank as Rank, targetRankTyped), // Cast currentUserRank as Rank
            }),
        });

        if (!response.ok) throw new Error('Attack request failed');

        const result = await response.json();
        alert(result.message || 'Attack completed!');
    } catch (error) {
        console.error('Error attacking player:', error);
        alert('An error occurred during the attack. Please try again later.');
    }
};

// Calculate success chance with Rank types
const calculateSuccessChance = (attackerRank: Rank, targetRank: Rank): number => {
    const rankValues: { [key in Rank]: number } = {
        'Rookie': 1,
        'Soldier': 2,
        'Leader': 3,
    };

    const attackerRankValue = rankValues[attackerRank];
    const targetRankValue = rankValues[targetRank];

    const rankDifference = targetRankValue - attackerRankValue;
    if (rankDifference >= 2) return 20;
    if (rankDifference === 1) return 50;
    return 70;
};

    

    return (
        <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Attack Rules</h2>

            <div className="mb-4 grid grid-cols-2 gap-8 text-sm">
                <div>
                    <h3 className="text-lg font-bold text-green-300">Success Rewards</h3>
                    <ul className="list-disc list-inside">
                        <li className="text-green-200">Steal 11% of target's money</li>
                        <li className="text-green-200">Gain a special item</li>
                        <li className="text-green-200">Extra XP for rank gap</li>
                        <li className="text-green-200">1-hour cooldown</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-red-300">Failure Risks</h3>
                    <ul className="list-disc list-inside">
                        <li className="text-red-200">Lose 10% of your money</li>
                        <li className="text-red-200">Lose your highest-value item</li>
                        <li className="text-red-200">2 hours in jail</li>
                        <li className="text-red-200">2-hour cooldown</li>
                    </ul>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 text-center">Available Players</h2>

            <div className="mb-4 flex items-center space-x-4">
                <input
                    type="text"
                    placeholder="Search by username or family"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 flex-grow rounded bg-gray-800 text-white"
                />
                <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="p-2 rounded bg-gray-800 text-white"
                >
                    <option value="username">Username</option>
                    <option value="family">Family</option>
                </select>
                <button
                    onClick={handleSearch}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded font-semibold"
                >
                    Search
                </button>
            </div>

            {filteredPlayers.length === 0 ? (
                <p className="text-center text-gray-400">No players available to attack.</p>
            ) : (
                <ul className="space-y-3">
{filteredPlayers.map((player: Player) => (
    <li
        key={player._id}
        className="flex items-center justify-between bg-gray-800 p-3 rounded-lg shadow"
    >
        <div>
            <p className="font-semibold">{player.username}</p>
            <p className="text-sm text-gray-400">
            Points: {player.points} | Rank: {player.rank} | Family: {player.family ? player.family.name : 'No Family'}
            </p>
        </div>
        <button
            onClick={() => handleAttack(player._id, player.rank)}
            className={`ml-4 px-3 py-1 rounded ${
                isInJail ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-700'
            } text-white`}
            disabled={isInJail}
        >
            {isInJail ? 'In Jail' : 'Attack'}
        </button>
    </li>
))}

                </ul>
            )}
        </div>
    );
};

export default Kill;
