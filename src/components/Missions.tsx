import { useEffect, useState } from 'react';

// Define the structure for a mission
interface Mission {
    _id: string;
    title: string;
    description: string;
    reward: number;
    difficulty: string;
}

// Function to determine the color based on difficulty
const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
        case 'easy':
            return 'text-green-400'; // Green for Easy
        case 'medium':
            return 'text-orange-500'; // Orange for Medium
        case 'hard':
            return 'text-red-500'; // Red for Hard
        default:
            return 'text-gray-400'; // Default color if difficulty is unknown
    }
};

const Missions: React.FC = () => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentMissionIndex, setCurrentMissionIndex] = useState<number>(0);

    const fetchMissions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_MISSIONS_API_URL}`);
            if (!response.ok) throw new Error('Failed to fetch missions');
            const data = await response.json();
            console.log('Missions data:', data);
            setMissions(data);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load missions. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMissions();
    }, []);

    const nextMission = () => {
        if (currentMissionIndex < missions.length - 1) {
            setCurrentMissionIndex(currentMissionIndex + 1);
        }
    };

    const previousMission = () => {
        if (currentMissionIndex > 0) {
            setCurrentMissionIndex(currentMissionIndex - 1);
        }
    };

    return (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
            <h2 className="text-3xl mb-4 text-yellow-400 font-bold text-center">Missions</h2>

            {loading ? (
                <p className="text-yellow-300 text-center">Loading...</p>
            ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
            ) : (
                <>
                    {missions.length === 0 ? (
                        <p className="text-yellow-300 text-center">No missions available.</p>
                    ) : (
                        <div className="bg-gray-800 p-5 rounded-lg shadow-md">
                            <h3 className="text-2xl font-semibold text-yellow-300 mb-2">{missions[currentMissionIndex].title}</h3>
                            <p className="text-sm text-gray-300 mb-2">{missions[currentMissionIndex].description}</p>
                            <div className="flex justify-between items-center">
                                <p className="text-yellow-400 font-semibold">Reward: {missions[currentMissionIndex].reward}</p>
                                <p className={`${getDifficultyColor(missions[currentMissionIndex].difficulty)} italic`}>
                                    Difficulty: {missions[currentMissionIndex].difficulty}
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="flex justify-between mt-4">
                <button
                    onClick={previousMission}
                    className={`bg-yellow-400 text-gray-900 p-2 rounded ${currentMissionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={currentMissionIndex === 0}
                >
                    Previous
                </button>
                <button
                    onClick={nextMission}
                    className={`bg-yellow-400 text-gray-900 p-2 rounded ${currentMissionIndex === missions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={currentMissionIndex === missions.length - 1}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Missions;
