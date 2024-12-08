import { useState, useEffect } from 'react';

const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;


interface LockpickingProps {
    walletAddress: string;
}

const Lockpicking: React.FC<LockpickingProps> = ({ walletAddress }) => {
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(5);
    const [hits, setHits] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [targetPosition, setTargetPosition] = useState({ x: 100, y: 100 });

    useEffect(() => {
        if (attempts === 0 || hits >= 3) {
            setGameOver(true);
            logScoreToBackend();
            return;
        }

        const interval = setInterval(() => {
            moveTarget();
        }, 500); 

        return () => clearInterval(interval);
    }, [attempts, hits]);

    const moveTarget = () => {
        const angle = Math.random() * 2 * Math.PI;
        const radius = 80;
        const newX = 100 + radius * Math.cos(angle);
        const newY = 100 + radius * Math.sin(angle);
        setTargetPosition({ x: newX, y: newY });
    };

    const handleLockClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const distance = Math.sqrt(
            (clickX - targetPosition.x) ** 2 + (clickY - targetPosition.y) ** 2
        );

        if (distance < 20) {
            setHits((prev) => prev + 1);
            setScore((prevScore) => prevScore + 50);
        } else {
            setAttempts((prev) => prev - 1);
        }
    };

    const logScoreToBackend = async () => {
        try {
            const response = await fetch(`${PLAYER_API_URL}/player/minigame/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletAddress,
                    gameType: 'Lockpicking',
                    score,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Game over! XP: ${data.reward.xp}, Money: ${data.reward.money}, Item: ${data.reward.item || 'None'}`);
            } else {
                console.error('Error logging score:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Lockpicking</h2>
            
            {/* Scoreboard */}
            <div className="flex justify-center mb-4">
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center">
                    <h3 className="text-lg font-semibold text-yellow-400">Score</h3>
                    <p className="text-3xl font-bold text-green-400">{score}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center">
                    <h3 className="text-lg font-semibold text-yellow-400">Attempts Left</h3>
                    <p className="text-3xl font-bold text-red-400">{attempts}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center">
                    <h3 className="text-lg font-semibold text-yellow-400">Hits</h3>
                    <p className="text-3xl font-bold text-blue-400">{hits}</p>
                </div>
            </div>
            
            {gameOver ? (
                <p className={`text-${hits >= 3 ? 'green' : 'red'}-500`}>
                    {hits >= 3 ? 'Congratulations! You cracked the lock!' : 'Game over! Better luck next time.'}
                </p>
            ) : (
                <div className="relative w-60 h-60 bg-gray-700 rounded-full mx-auto mb-6" onClick={handleLockClick}>
                    <div
                        style={{
                            position: 'absolute',
                            top: targetPosition.y,
                            left: targetPosition.x,
                            width: '10px',
                            height: '10px',
                            backgroundColor: 'red',
                            borderRadius: '50%',
                            transition: 'top 0.5s, left 0.5s', 
                        }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default Lockpicking;
