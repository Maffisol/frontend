import { useState, useEffect } from 'react';

const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;


interface CarChaseProps {
    walletAddress: string;
}

const CarChase: React.FC<CarChaseProps> = ({ walletAddress }) => {
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(3); // Reverted to standard 3 attempts
    const [gameOver, setGameOver] = useState(false);
    const [playerPosition, setPlayerPosition] = useState(50); // Player starts at 50% width
    const [obstacles, setObstacles] = useState(
        Array.from({ length: 3 }, () => ({ x: Math.random() * 100, y: 0, speed: Math.random() * 1.5 + 0.5 }))
    );

    const playerCarWidth = 40; // Player car width
    const playerCarHeight = 40; // Player car height

    useEffect(() => {
        if (gameOver) {
            logScoreToBackend();
            return;
        }

        const obstacleInterval = setInterval(() => {
            setObstacles((prevObstacles) =>
                prevObstacles.map((obstacle) => ({
                    ...obstacle,
                    y: obstacle.y + obstacle.speed,
                }))
            );
            checkCollisions();
        }, 50);

        return () => clearInterval(obstacleInterval);
    }, [obstacles, gameOver]);

    useEffect(() => {
        if (score > 0 && score % 5 === 0) {
            addNewObstacle(); // Add a new obstacle every 5 points
        }
    }, [score]);

    const addNewObstacle = () => {
        setObstacles((prevObstacles) => [
            ...prevObstacles,
            { x: Math.random() * 100, y: 0, speed: Math.random() * 1.5 + 0.5 },
        ]);
    };

    const checkCollisions = () => {
        let collisionOccurred = false;

        setObstacles((prevObstacles) => {
            const updatedObstacles = prevObstacles.map((obstacle) => {
                const obstacleBottomY = obstacle.y + 5; // Adjust for obstacle height
                const playerLeftEdge = playerPosition - playerCarWidth / 2;
                const playerRightEdge = playerPosition + playerCarWidth / 2;

                if (obstacleBottomY >= 90) { // Near the bottom of the screen
                    if (
                        playerLeftEdge < obstacle.x && // Obstacle is within player car's width
                        obstacle.x < playerRightEdge &&
                        obstacleBottomY >= 90 - playerCarHeight / 2
                    ) {
                        collisionOccurred = true;
                    } else if (obstacleBottomY > 100) {
                        setScore((prevScore) => prevScore + 1); // Increment score if the player dodges it
                    }
                    return { ...obstacle, y: 0, x: Math.random() * 100 }; // Reset obstacle position
                }
                return obstacle;
            });
            return updatedObstacles;
        });

        if (collisionOccurred) {
            setAttempts((prev) => prev - 1);
            if (attempts <= 1) {
                setGameOver(true);
            }
        }
    };

    const moveLeft = () => {
        if (playerPosition > 0) {
            setPlayerPosition((prev) => prev - 10);
        }
    };

    const moveRight = () => {
        if (playerPosition < 90) {
            setPlayerPosition((prev) => prev + 10);
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
                    gameType: 'CarChase',
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
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center relative" style={{ height: '400px' }}>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Car Chase</h2>

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
            </div>

            {gameOver ? (
                <p className="text-red-500 font-bold">Game Over! Better luck next time!</p>
            ) : (
                <div className="relative w-full h-full">
                    {/* Obstacles */}
                    {obstacles.map((obstacle, index) => (
                        <div
                            key={index}
                            style={{
                                position: 'absolute',
                                top: `${obstacle.y}%`,
                                left: `${obstacle.x}%`,
                                width: '20px',
                                height: '20px',
                                backgroundColor: 'red',
                                borderRadius: '50%',
                                transition: 'top 0.1s linear',
                            }}
                        ></div>
                    ))}

                    {/* Player Car */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: `${playerPosition}%`,
                            width: `${playerCarWidth}px`,
                            height: `${playerCarHeight}px`,
                            backgroundColor: 'blue',
                            borderRadius: '20%',
                            transform: 'translateX(-50%)',
                        }}
                    ></div>
                </div>
            )}

            {/* Controls */}
            <div className="flex justify-center mt-4">
                <button onClick={moveLeft} className="bg-yellow-400 text-gray-900 px-4 py-2 rounded m-2">
                    Move Left
                </button>
                <button onClick={moveRight} className="bg-yellow-400 text-gray-900 px-4 py-2 rounded m-2">
                    Move Right
                </button>
            </div>
        </div>
    );
};

export default CarChase;
