import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;

interface UsernameFormProps {
    publicKey: string; // Wallet address as prop
    onRegister: (username: string) => void; // Callback on successful registration
}

const UsernameForm: FC<UsernameFormProps> = ({ publicKey, onRegister }) => {
    const [username, setUsername] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showUsernameForm, setShowUsernameForm] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkWallet = async () => {
            try {
                const response = await fetch(`${PLAYER_API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress: publicKey }),
                });

                if (!response.ok) {
                    setShowUsernameForm(true);
                    return;
                }

                const data = await response.json();

                if (data.username) {
                    onRegister(data.username);
                    navigate('/'); // Redirect to home
                    return;
                }

                setShowUsernameForm(true); // Show form if username not set
            } catch (error) {
                setErrorMessage('Unable to verify wallet address. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        checkWallet();
    }, [publicKey, onRegister, navigate]);

    const handleUsernameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!username.trim()) {
            setErrorMessage('Please enter a valid username.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${PLAYER_API_URL}/createPlayer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), walletAddress: publicKey }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to register username.');
            }

            const newPlayer = await response.json();
            onRegister(newPlayer.username);
            navigate('/'); // Redirect to home
        } catch (error: any) {
            setErrorMessage(error.message || 'Unable to register username. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p className="text-yellow-300 text-center">Loading...</p>;
    }

    if (!showUsernameForm) {
        return null; // No UI to render once the user is registered or logged in
    }

    return (
        <div className="mt-6 bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
            <h2 className="text-2xl text-yellow-400 font-bold text-center mb-4">Register Your Username</h2>
            <form onSubmit={handleUsernameSubmit} className="flex flex-col space-y-4">
                <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="p-3 rounded-md border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                />
                <button
                    type="submit"
                    className={`bg-yellow-400 text-gray-900 p-3 rounded-md hover:bg-yellow-500 transition duration-300 shadow-md ${
                        loading ? 'opacity-50' : ''
                    }`}
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </form>
            {errorMessage && <div className="text-red-500 mt-2 text-center">{errorMessage}</div>}
        </div>
    );
};

export default UsernameForm;
