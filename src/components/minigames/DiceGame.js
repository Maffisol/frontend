import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const DiceGame = ({ walletAddress }) => {
    const [playerScore, setPlayerScore] = useState([]);
    const [aiScore, setAiScore] = useState([]);
    const [round, setRound] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [result, setResult] = useState(null);
    const [rolling, setRolling] = useState(false);
    const [currentRoll, setCurrentRoll] = useState({ player: 1, ai: 1 });
    useEffect(() => {
        if (gameOver) {
            logScoreToBackend();
        }
    }, [gameOver]);
    const rollDice = () => {
        if (round <= 5 && !rolling) {
            setRolling(true);
            const rollDuration = 1000; // total rolling time in ms
            const intervalDuration = 100; // interval for each random display
            const interval = setInterval(() => {
                setCurrentRoll({
                    player: Math.floor(Math.random() * 6) + 1,
                    ai: Math.floor(Math.random() * 6) + 1,
                });
            }, intervalDuration);
            setTimeout(() => {
                clearInterval(interval);
                finalizeRoll();
                setRolling(false);
            }, rollDuration);
        }
    };
    const finalizeRoll = () => {
        const playerRoll = Math.floor(Math.random() * 6) + 1;
        const aiRoll = Math.floor(Math.random() * 6) + 1;
        setPlayerScore((prev) => [...prev, playerRoll]);
        setAiScore((prev) => [...prev, aiRoll]);
        if (round === 5) {
            determineWinner();
            setGameOver(true);
        }
        else {
            setRound((prev) => prev + 1);
        }
    };
    const determineWinner = () => {
        const playerTotal = playerScore.reduce((acc, score) => acc + score, 0);
        const aiTotal = aiScore.reduce((acc, score) => acc + score, 0);
        if (playerTotal > aiTotal) {
            setResult("You Win!");
        }
        else if (playerTotal < aiTotal) {
            setResult("You Lose!");
        }
        else {
            setResult("It's a Tie!");
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
                    gameType: 'DiceGame',
                    score: playerScore.reduce((acc, score) => acc + score, 0),
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
    return (_jsxs("div", { className: "bg-gray-900 p-6 rounded-lg shadow-lg text-center relative", style: { height: '400px' }, children: [_jsx("h2", { className: "text-2xl font-bold text-yellow-400 mb-4", children: "Dice Game" }), _jsxs("div", { className: "flex justify-center mb-4", children: [_jsxs("div", { className: "bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-400", children: "Player Total" }), _jsx("p", { className: "text-3xl font-bold text-green-400", children: playerScore.reduce((acc, score) => acc + score, 0) })] }), _jsxs("div", { className: "bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-400", children: "AI Total" }), _jsx("p", { className: "text-3xl font-bold text-red-400", children: aiScore.reduce((acc, score) => acc + score, 0) })] })] }), gameOver ? (_jsx("p", { className: "text-xl font-bold text-yellow-400 mb-4", children: result })) : (_jsxs("div", { children: [_jsxs("p", { className: "text-yellow-400 mb-4", children: ["Round ", round, " of 5"] }), _jsx("button", { onClick: rollDice, className: "bg-yellow-400 px-4 py-2 rounded text-gray-900", disabled: rolling, children: rolling ? "Rolling..." : "Roll Dice" })] })), _jsxs("div", { className: "flex justify-center mt-6", children: [_jsxs("div", { className: "text-center mx-4", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-400", children: "Your Roll" }), _jsx("p", { className: "text-5xl font-bold text-green-400", children: currentRoll.player })] }), _jsxs("div", { className: "text-center mx-4", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-400", children: "AI Roll" }), _jsx("p", { className: "text-5xl font-bold text-red-400", children: currentRoll.ai })] })] }), _jsxs("div", { className: "flex justify-center mt-6", children: [_jsxs("div", { className: "text-center mx-4", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-400", children: "Your Rolls" }), _jsx("p", { className: "text-green-400", children: playerScore.join(' - ') })] }), _jsxs("div", { className: "text-center mx-4", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-400", children: "AI Rolls" }), _jsx("p", { className: "text-red-400", children: aiScore.join(' - ') })] })] })] }));
};
export default DiceGame;
