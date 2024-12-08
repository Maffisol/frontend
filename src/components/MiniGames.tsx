import React from 'react';
import { Link } from 'react-router-dom';

const MiniGames: React.FC = () => {
    return (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Mini Games</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link to="/minigame/lockpicking" className="bg-gray-800 p-4 rounded-lg shadow-md text-center">
                    <h3 className="text-xl font-semibold text-yellow-300 mb-2">Lockpicking</h3>
                    <p className="text-gray-400 mb-4">Crack the lock and earn rewards!</p>
                    <button className="bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300 transition">
                        Play Lockpicking
                    </button>
                </Link>
                <Link to="/minigame/shootout" className="bg-gray-800 p-4 rounded-lg shadow-md text-center">
                    <h3 className="text-xl font-semibold text-yellow-300 mb-2">Shootout</h3>
                    <p className="text-gray-400 mb-4">Outgun your opponent and escape!</p>
                    <button className="bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300 transition">
                        Play Shootout
                    </button>
                </Link>
                <Link to="/minigame/car-chase" className="bg-gray-800 p-4 rounded-lg shadow-md text-center">
                    <h3 className="text-xl font-semibold text-yellow-300 mb-2">Car Chase</h3>
                    <p className="text-gray-400 mb-4">Dodge obstacles and escape the cops!</p>
                    <button className="bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300 transition">
                        Play Car Chase
                    </button>
                </Link>
                <Link to="/minigame/dice-game" className="bg-gray-800 p-4 rounded-lg shadow-md text-center">
                    <h3 className="text-xl font-semibold text-yellow-300 mb-2">Dice Game</h3>
                    <p className="text-gray-400 mb-4">Roll the dice and test your luck!</p>
                    <button className="bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300 transition">
                        Play Dice Game
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default MiniGames;
