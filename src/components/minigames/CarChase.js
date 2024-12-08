import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const CarChase = ({ walletAddress }) => {
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(3); // Reverted to standard 3 attempts
    const [gameOver, setGameOver] = useState(false);
    const [playerPosition, setPlayerPosition] = useState(50); // Player starts at 50% width
    const [obstacles, setObstacles] = useState(Array.from({ length: 3 }, () => ({ x: Math.random() * 100, y: 0, speed: Math.random() * 1.5 + 0.5 })));
    const playerCarWidth = 40; // Player car width
    const playerCarHeight = 40; // Player car height
    useEffect(() => {
        if (gameOver) {
            logScoreToBackend();
            return;
        }
        const obstacleInterval = setInterval(() => {
            setObstacles((prevObstacles) => prevObstacles.map((obstacle) => ({
                ...obstacle,
                y: obstacle.y + obstacle.speed,
            })));
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
                    if (playerLeftEdge < obstacle.x && // Obstacle is within player car's width
                        obstacle.x < playerRightEdge &&
                        obstacleBottomY >= 90 - playerCarHeight / 2) {
                        collisionOccurred = true;
                    }
                    else if (obstacleBottomY > 100) {
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
            const response = await fetch('http://localhost:5000/api/player/minigame/log', {
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
            }
            else {
                console.error('Error logging score:', data.message);
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
    };
    return (_jsxs("div", { className: "bg-gray-900 p-6 rounded-lg shadow-lg text-center relative", style: { height: '400px' }, children: [_jsx("h2", { className: "text-2xl font-bold text-yellow-400 mb-4", children: "Car Chase" }), _jsxs("div", { className: "flex justify-center mb-4", children: [_jsxs("div", { className: "bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-400", children: "Score" }), _jsx("p", { className: "text-3xl font-bold text-green-400", children: score })] }), _jsxs("div", { className: "bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-400", children: "Attempts Left" }), _jsx("p", { className: "text-3xl font-bold text-red-400", children: attempts })] })] }), gameOver ? (_jsx("p", { className: "text-red-500 font-bold", children: "Game Over! Better luck next time!" })) : (_jsxs("div", { className: "relative w-full h-full", children: [obstacles.map((obstacle, index) => (_jsx("div", { style: {
                            position: 'absolute',
                            top: `${obstacle.y}%`,
                            left: `${obstacle.x}%`,
                            width: '20px',
                            height: '20px',
                            backgroundColor: 'red',
                            borderRadius: '50%',
                            transition: 'top 0.1s linear',
                        } }, index))), _jsx("div", { style: {
                            position: 'absolute',
                            bottom: '10px',
                            left: `${playerPosition}%`,
                            width: `${playerCarWidth}px`,
                            height: `${playerCarHeight}px`,
                            backgroundColor: 'blue',
                            borderRadius: '20%',
                            transform: 'translateX(-50%)',
                        } })] })), _jsxs("div", { className: "flex justify-center mt-4", children: [_jsx("button", { onClick: moveLeft, className: "bg-yellow-400 text-gray-900 px-4 py-2 rounded m-2", children: "Move Left" }), _jsx("button", { onClick: moveRight, className: "bg-yellow-400 text-gray-900 px-4 py-2 rounded m-2", children: "Move Right" })] })] }));
};
export default CarChase;
