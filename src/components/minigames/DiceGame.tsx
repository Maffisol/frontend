import { useState, useEffect } from 'react';

const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;

interface DiceGameProps {
    walletAddress: string;
}

const DiceGame: React.FC<DiceGameProps> = ({ walletAddress }) => {
    const [playerScore, setPlayerScore] = useState<number[]>([]);
    const [aiScore, setAiScore] = useState<number[]>([]);
    const [round, setRound] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [result, setResult] = useState<string | null>(null);
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
        } else {
            setRound((prev) => prev + 1);
        }
    };

    const determineWinner = () => {
        const playerTotal = playerScore.reduce((acc, score) => acc + score, 0);
        const aiTotal = aiScore.reduce((acc, score) => acc + score, 0);

        if (playerTotal > aiTotal) {
            setResult("You Win!");
        } else if (playerTotal < aiTotal) {
            setResult("You Lose!");
        } else {
            setResult("It's a Tie!");
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
                    gameType: 'DiceGame',
                    score: playerScore.reduce((acc, score) => acc + score, 0),
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
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Dice Game</h2>

            {/* Scoreboard */}
            <div className="flex justify-center mb-4">
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center">
                    <h3 className="text-lg font-semibold text-yellow-400">Player Total</h3>
                    <p className="text-3xl font-bold text-green-400">
                        {playerScore.reduce((acc, score) => acc + score, 0)}
                    </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mx-2 w-40 text-center">
                    <h3 className="text-lg font-semibold text-yellow-400">AI Total</h3>
                    <p className="text-3xl font-bold text-red-400">
                        {aiScore.reduce((acc, score) => acc + score, 0)}
                    </p>
                </div>
            </div>

            {gameOver ? (
                <p className="text-xl font-bold text-yellow-400 mb-4">{result}</p>
            ) : (
                <div>
                    <p className="text-yellow-400 mb-4">Round {round} of 5</p>
                    <button onClick={rollDice} className="bg-yellow-400 px-4 py-2 rounded text-gray-900" disabled={rolling}>
                        {rolling ? "Rolling..." : "Roll Dice"}
                    </button>
                </div>
            )}

            {/* Dice Display */}
            <div className="flex justify-center mt-6">
                <div className="text-center mx-4">
                    <h3 className="text-lg font-semibold text-yellow-400">Your Roll</h3>
                    <p className="text-5xl font-bold text-green-400">{currentRoll.player}</p>
                </div>
                <div className="text-center mx-4">
                    <h3 className="text-lg font-semibold text-yellow-400">AI Roll</h3>
                    <p className="text-5xl font-bold text-red-400">{currentRoll.ai}</p>
                </div>
            </div>

            {/* Display Rolls History */}
            <div className="flex justify-center mt-6">
                <div className="text-center mx-4">
                    <h3 className="text-lg font-semibold text-yellow-400">Your Rolls</h3>
                    <p className="text-green-400">{playerScore.join(' - ')}</p>
                </div>
                <div className="text-center mx-4">
                    <h3 className="text-lg font-semibold text-yellow-400">AI Rolls</h3>
                    <p className="text-red-400">{aiScore.join(' - ')}</p>
                </div>
            </div>
        </div>
    );
};

export default DiceGame;
