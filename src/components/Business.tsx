import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const JAIL_API_URL = import.meta.env.VITE_JAIL_API_URL;
const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;
const BUSINESS_API_URL = import.meta.env.VITE_BUSINESS_API_URL;

interface PlayerProfile {
    money: number;
    bags: number;
    ounces: number;
    halfKilos: number;
    kilos: number;
    lastouncepurchase?: string; // Optional field for the last ounce purchase timestamp
}

interface BusinessProps {
    walletAddress: string;
}

const Business: React.FC<BusinessProps> = ({ walletAddress }) => {
    const socket = useSocket().socket;
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [inJail, setInJail] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasBoughtOunce, setHasBoughtOunce] = useState<boolean>(false);

    const [buttonStates, setButtonStates] = useState<any>({
        buyOunce: { success: false, message: '' },
        buyHalfKilo: { success: false, message: '' },
        sellBags: { success: false, message: '' },
        sellOunce: { success: false, message: '' }
    });

    useEffect(() => {
        if (!walletAddress || !socket) return;

        socket.emit('register', walletAddress);

        const handleJailStatusUpdate = (data: { walletAddress: string; isInJail: boolean; jailReleaseTime: string | null }) => {
            console.log('[StealCar] Received jailStatusUpdated event:', data);
            if (data.walletAddress === walletAddress) {
                const jailReleaseTime = data.jailReleaseTime ? new Date(data.jailReleaseTime).getTime() : null;
                const isCurrentlyInJail = Boolean(data.isInJail && jailReleaseTime && jailReleaseTime > Date.now());
                setInJail(isCurrentlyInJail);
            }
        };

        socket.on('jailStatusUpdated', handleJailStatusUpdate);

        return () => {
            socket.off('jailStatusUpdated', handleJailStatusUpdate);
        };
    }, [walletAddress, socket]);

    const fetchProfileData = async () => {
        try {
            const response = await fetch(`${PLAYER_API_URL}/profile/${walletAddress}`);
            if (!response.ok) throw new Error('Failed to fetch player profile');
            const data: PlayerProfile = await response.json();
            setProfile(data);
            if (data.ounces > 0 || data.lastouncepurchase) {
                setHasBoughtOunce(true); // Mark the player as having bought an ounce or having a last purchase timestamp
            }
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const fetchJailStatus = async () => {
        try {
            const response = await fetch(`${JAIL_API_URL}/jail-status/${walletAddress}`);
            if (response.ok) {
                const data = await response.json();
                setInJail(!!data.jailReleaseTime && data.isInJail);
            } else {
                console.error('Failed to fetch jail status');
                setInJail(false);
            }
        } catch (error) {
            console.error('Error fetching jail status:', error);
            setInJail(false);
        }
    };

    useEffect(() => {
        if (walletAddress) {
            fetchProfileData();
            fetchJailStatus();
        }
    }, [walletAddress]);

    const handleAction = async (endpoint: string, successMessage: string, cost: number, buttonKey: string) => {
        if (inJail) {
            alert('You cannot perform this action while in jail.');
            return;
        }

        if (profile && profile.money < cost) {
            alert('You do not have enough money for this action.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${BUSINESS_API_URL}/${endpoint}/${walletAddress}`, {
                method: 'PUT',
            });
            if (!response.ok) throw new Error('Action failed');

            const updatedProfile = await response.json();
            setProfile(updatedProfile);

            // Update the button state to show success
            setButtonStates((prevState: any) => ({
                ...prevState,
                [buttonKey]: { success: true, message: successMessage },
            }));

            // Reset button state after a short delay
            setTimeout(() => {
                setButtonStates((prevState: any) => ({
                    ...prevState,
                    [buttonKey]: { success: false, message: '' },
                }));
            }, 1000); // Reset after 1 second

            if (endpoint === 'buyOunce') {
                setHasBoughtOunce(true);
                await updateLastOuncePurchase(); // Update lastouncepurchase timestamp in the database
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const updateLastOuncePurchase = async () => {
        try {
            const response = await fetch(`${PLAYER_API_URL}/update-lastouncepurchase/${walletAddress}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lastouncepurchase: new Date().toISOString(),
                }),
            });

            if (!response.ok) throw new Error('Failed to update lastouncepurchase');
        } catch (err) {
            console.error('Error updating lastouncepurchase:', err);
        }
    };

    if (!profile) return <div className="text-yellow-300 text-center">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    return (
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-4xl mx-auto flex flex-col gap-6 overflow-visible z-10">
            {/* Profile Information */}
            <div className="col-span-2 bg-yellow-300 p-6 rounded-lg flex flex-wrap gap-4 justify-center lg:justify-between items-center">
                <span className="text-gray-900 font-bold">Money: ${profile.money}</span>
                <span className="text-gray-900 font-bold">Bags: {profile.bags}</span>
                <span className="text-gray-900 font-bold">Ounces: {profile.ounces}</span>
                <span className="text-gray-900 font-bold">Half Kilos: {profile.halfKilos}</span>
                <span className="text-gray-900 font-bold">Kilos: {profile.kilos}</span>
            </div>

            {/* Purchases Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
                <h2 className="text-3xl text-yellow-400 font-bold text-center mb-6">Purchases</h2>
                <button
                    onClick={() => handleAction('buyOunce', 'Successfully bought an ounce!', 600, 'buyOunce')}
                    className={`${
                        inJail || profile.money < 600
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-yellow-400 hover:bg-yellow-300'
                    } text-gray-900 transition duration-300 py-3 rounded-lg font-semibold shadow-lg w-full`}
                    disabled={inJail || loading || profile.money < 600}
                >
                    {buttonStates.buyOunce.success
                        ? buttonStates.buyOunce.message
                        : loading
                        ? 'Processing...'
                        : profile.money < 600
                        ? 'Not enough money'
                        : 'Buy an Ounce ($600)'}
                </button>
                {hasBoughtOunce && (
                    <button
                        onClick={() => handleAction('buyHalfKilo', 'Successfully bought a half kilo!', 2200, 'buyHalfKilo')}
                        className={`${
                            inJail || profile.money < 2200
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-yellow-400 hover:bg-yellow-300'
                        } text-gray-900 transition duration-300 py-3 rounded-lg font-semibold shadow-lg w-full`}
                        disabled={inJail || loading || profile.money < 2200}
                    >
                        {buttonStates.buyHalfKilo.success
                            ? buttonStates.buyHalfKilo.message
                            : loading
                            ? 'Processing...'
                            : profile.money < 2200
                            ? 'Not enough money'
                            : 'Buy a Half Kilo ($2200)'}
                    </button>
                )}
            </div>

            {/* Sales Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
                <h2 className="text-3xl text-yellow-400 font-bold text-center mb-6">Sales</h2>
                <button
                    onClick={() => handleAction('sellBags', 'Successfully sold a bag!', 10, 'sellBags')}
                    className={`${
                        inJail || profile.bags < 1
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-yellow-400 hover:bg-yellow-300'
                    } text-gray-900 transition duration-300 py-3 rounded-lg font-semibold shadow-lg w-full`}
                    disabled={inJail || loading || profile.bags < 1}
                >
                    {buttonStates.sellBags.success
                        ? buttonStates.sellBags.message
                        : loading
                        ? 'Processing...'
                        : profile.bags < 1
                        ? 'No bags to sell'
                        : 'Sell a Bag ($10)'}
                </button>
                <button
                    onClick={() => handleAction('sellOunce', 'Successfully sold an ounce!', 600, 'sellOunce')}
                    className={`${
                        inJail || profile.ounces < 1
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-yellow-400 hover:bg-yellow-300'
                    } text-gray-900 transition duration-300 py-3 rounded-lg font-semibold shadow-lg w-full`}
                    disabled={inJail || loading || profile.ounces < 1}
                >
                    {buttonStates.sellOunce.success
                        ? buttonStates.sellOunce.message
                        : loading
                        ? 'Processing...'
                        : profile.ounces < 1
                        ? 'No ounces to sell'
                        : 'Sell an Ounce ($600)'}
                </button>
            </div>
        </div>
    );
};

export default Business;
