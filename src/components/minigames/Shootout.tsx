import React, { useState, useEffect } from 'react';

const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;


interface ShootoutProps {
    walletAddress: string;
}

const Shootout: React.FC<ShootoutProps> = ({ walletAddress }) => {
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [targetPosition, setTargetPosition] = useState({ x: Math.random() * 80, y: Math.random() * 80 });
    const [showTarget, setShowTarget] = useState(false);
    const [timeLeft, setTimeLeft] = useState(5); // Time in seconds to shoot the target

    useEffect(() => {
        if (round <= 5 && !gameOver) {
            spawnTarget();
        } else if (round > 5) {
            setGameOver(true);
            logScoreToBackend();
        }
    }, [round, gameOver]);

    useEffect(() => {
        if (showTarget) {
            const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
            const movementInterval = setInterval(moveTarget, 200); // Move the target every 200ms
            if (timeLeft === 0) {
                missTarget();
            }

            return () => {
                clearInterval(timer);
                clearInterval(movementInterval);
            };
        }
    }, [showTarget, timeLeft]);

    const spawnTarget = () => {
        setTargetPosition({
            x: Math.random() * 80,
            y: Math.random() * 80,
        });
        setShowTarget(true);
        setTimeLeft(5); // Reset timer for each round
    };

    const moveTarget = () => {
        setTargetPosition((prevPosition) => {
            const moveX = (Math.random() - 0.5) * 2; // Random small movement in X direction
            const moveY = (Math.random() - 0.5) * 2; // Random small movement in Y direction
            return {
                x: Math.min(90, Math.max(0, prevPosition.x + moveX)),
                y: Math.min(90, Math.max(0, prevPosition.y + moveY)),
            };
        });
    };

    const hitTarget = () => {
        if (showTarget) {
            setScore((prev) => prev + 1);
            setShowTarget(false);
            setRound((prev) => prev + 1);
        }
    };

    const missTarget = () => {
        setShowTarget(false);
        setRound((prev) => prev + 1);
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
                    gameType: 'Shootout',
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
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center relative" style={{ height: '500px' }}>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Shootout</h2>

            {/* Scoreboard */}
            <div className="flex justify-center mb-4">
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center">
                    <h3 className="text-lg font-semibold text-yellow-400">Score</h3>
                    <p className="text-3xl font-bold text-green-400">{score}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center">
                    <h3 className="text-lg font-semibold text-yellow-400">Round</h3>
                    <p className="text-3xl font-bold text-red-400">{round} / 5</p>
                </div>
            </div>

            {gameOver ? (
                <p className="text-red-500 font-bold">Game Over! Final Score: {score}</p>
            ) : (
                <div className="relative w-full h-full bg-gray-800 border border-yellow-400 rounded-lg" style={{ position: 'relative', height: '400px' }}>
                    {/* Target */}
                    {showTarget && (
                        <div
                            onClick={hitTarget}
                            style={{
                                position: 'absolute',
                                top: `${targetPosition.y}%`,
                                left: `${targetPosition.x}%`,
                                width: '30px',
                                height: '30px',
                                backgroundColor: 'red',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'top 0.2s linear, left 0.2s linear',
                            }}
                        ></div>
                    )}

                    <div className="text-yellow-400 font-bold mt-4">
                        {showTarget ? `Time Left: ${timeLeft}s` : 'Get Ready...'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shootout;
