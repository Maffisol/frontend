import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import './utils/polyfills'; // Import the polyfills before any other logic
import axios from 'axios'; // Import axios voor API-verzoeken
import WalletConnect from './components/WalletConnect';
import Clicker from './components/Clicker';
import MiniGame from './components/MiniGames';
import Shop from './components/Shop';
import Families from './components/Families';
import Missions from './components/Missions';
import BaseUpgrades from './components/BaseUpgrades';
import ProfileCard from './components/ProfileCard';
import Business from './components/Business';
import UsernameForm from './components/UsernameForm';
import Home from './components/Home';
import Smuggling from './components/Smuggling';
import StealCar from './components/StealCar';
import Kill from './components/kill';
import Crimes from './components/Crimes';
import Jail from './components/Jail';
import Lockpicking from './components/minigames/Lockpicking';
import Shootout from './components/minigames/Shootout';
import CarChase from './components/minigames/CarChase';
import DiceGame from './components/minigames/DiceGame';
import logo from './assets/logo.png';
import Inbox from './components/Inbox';
import JailTimer from './components/JailTimer'; // Import JailTimer component
import FamilyDashboard from './components/FamilyDashboard'; // Family Dashboard Page
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faEnvelopeOpen, faUser } from '@fortawesome/free-regular-svg-icons'; 
import { SocketProvider } from './context/SocketContext'; // Pad naar je contextbestand


const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;



    const App: React.FC = () => {
    const { publicKey } = useWallet();
    const walletAddress = publicKey ? publicKey.toString() : null;
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error] = useState<string | null>(null);
    const [showProfileCard, setShowProfileCard] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [currentChatId, ] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    

    const handleRegister = async (username: string) => {
        if (!walletAddress) {
            console.error("Wallet address is not available.");
            return;
        }
    
        try {
            const response = await fetch(`${PLAYER_API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress, username }),
            });
    
            if (response.ok) {
                const data = await response.json();
                setIsRegistered(true);
                setCurrentUser(data);
                console.log('Registration successful', data);
            } else {
                console.error('Registration failed', response.statusText);
            }
        } catch (error) {
            console.error('Error during registration:', error);
        }
    };





    useEffect(() => {
        if (walletAddress) {
            const checkIfPlayerExists = async () => {
                try {
                    const response = await fetch(`${PLAYER_API_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ walletAddress }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.username) {
                            setIsRegistered(true);
                            setCurrentUser(data);
                        } else {
                            setIsRegistered(false);
                        }
                    } else if (response.status === 404) {
                        setIsRegistered(false);
                    } else {
                        console.error('Error checking player status:', response.statusText);
                    }
                } catch (error) {
                    console.error('Network error while checking player status:', error);
                } finally {
                    setLoading(false);
                }
            };

            setLoading(true);
            checkIfPlayerExists();
        }
    }, [walletAddress]);


    useEffect(() => {
        const fetchUnreadMessages = async () => {
            try {
                const response = await axios.get(`/api/messages/unread/${currentUser._id}`);
                console.log('API response unreadCount:', response.data.unreadCount); // Debug log
                setUnreadCount(response.data.unreadCount || 0);
                console.log('Updated unreadCount state:', response.data.unreadCount || 0); // Debug log
            } catch (error) {
                console.error('Error fetching unread messages:', error);
            }
        };
    
        if (currentUser?._id) {
            fetchUnreadMessages();
        }
    }, [currentUser?._id]);

    // Berichten markeren als gelezen
    const markMessagesAsRead = async () => {
        try {
            console.log('Marking messages as read for user:', currentUser._id, 'chatId:', currentChatId); // Debug log
            await axios.post('/api/messages/mark-read', {
                userId: currentUser._id,
                /*chatId: currentChatId, // Of laat dit weg als je alle berichten wilt markeren*/
            });
            setUnreadCount(0); // Reset de badge
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    // Markeer berichten als gelezen bij openen van inbox
    useEffect(() => {
        if (showInbox && currentUser?._id) {
            markMessagesAsRead();
        }
    }, [showInbox, currentUser?._id]);

return (
    <SocketProvider>
    <WalletModalProvider>
       <Router>
            <div className="flex items-start justify-center min-h-screen bg-gray-900 text-white">
                <div className="w-full max-w-3xl mx-auto p-4">
                    <header>
                        <div className="flex justify-between items-center">
                            {/* Logo */}
                            <Link to="/" className="flex-shrink-0">
                                <img src={logo} alt="Maffisol Logo" style={{ height: '70px', width: '74px' }} />
                            </Link>

                            {/* Buttons */}
                            <div className="flex items-center space-x-4">
    {walletAddress && currentUser && currentUser._id && (
        <>
<button
    onClick={() => setShowInbox(!showInbox)}
    className="bg-gray-700 p-2 rounded hover:bg-gray-600 transition relative"
>
    <FontAwesomeIcon
        icon={unreadCount > 0 ? faEnvelope : faEnvelopeOpen}
        className="text-xl text-white"
    />
    {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {unreadCount}
        </span>
    )}
</button>


            <button
                onClick={() => setShowProfileCard(!showProfileCard)}
                className="bg-gray-700 p-2 rounded hover:bg-gray-600 transition flex items-center justify-center"
            >
                <FontAwesomeIcon icon={faUser} className="text-xl text-white" />
            </button>
        </>
    )}
</div>

                        </div>

                    {/* Jail Timer */}
                    {walletAddress && <JailTimer walletAddress={walletAddress} />}</header>

                    <main>
                        {!walletAddress ? (
                            <WalletConnect />
                        ) : loading ? (
                            <p className="text-yellow-300 text-center">Loading...</p>
                        ) : error ? (
                            <p className="text-red-500 text-center">{error}</p>
                        ) : !isRegistered ? (
                            <UsernameForm publicKey={walletAddress} onRegister={handleRegister} />
                        ) : (
                            <Routes>
                                <Route path="/" element={<Home walletAddress={walletAddress} />} />
                                <Route path="/business" element={<Business walletAddress={walletAddress} />} />
                                <Route path="/clicker" element={<Clicker />} />
                                <Route path="/minigame" element={<MiniGame />} />
                                <Route path="/shop" element={<Shop />} />
                                <Route path="/missions" element={<Missions />} />
                                <Route path="/baseupgrades" element={<BaseUpgrades walletAddress={walletAddress} />} />
                                <Route path="/families" element={<Families />} />
                                <Route path="/FamilyDashboard" element={<FamilyDashboard walletAddress={walletAddress} />} />
                                <Route path="/smuggling" element={<Smuggling walletAddress={walletAddress} />} />
                                <Route path="/steal-car" element={<StealCar walletAddress={walletAddress} />} />
                                <Route path="/crimes" element={<Crimes walletAddress={walletAddress} />} />
                                <Route path="/jail" element={<Jail walletAddress={walletAddress} />} />
                                <Route
                                    path="/kill"
                                    element={
                                        currentUser && (
                                            <Kill
                                                currentUserId={currentUser._id}
                                                currentUserRank={currentUser.rank}
                                                currentUserFamily={currentUser.family}
                                                walletAddress={currentUser.walletAddress}
                                            />
                                        )
                                    }
                                />
                                <Route path="/minigame/lockpicking" element={<Lockpicking walletAddress={walletAddress} />} />
                                <Route path="/minigame/shootout" element={<Shootout walletAddress={walletAddress} />} />
                                <Route path="/minigame/car-chase" element={<CarChase walletAddress={walletAddress} />} />
                                <Route path="/minigame/dice-game" element={<DiceGame walletAddress={walletAddress} />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        )}
                    </main>
                </div>

                {showInbox && (
                    <div className="fixed inset-0 flex justify-center items-end bg-black bg-opacity-50">
                        <div className="bg-gray-800 p-4 rounded-t-lg shadow-lg w-full max-w-md">
                            <button onClick={() => setShowInbox(false)} className="text-white float-right mb-2">
                                ✖
                            </button>
                            <Inbox userId={currentUser._id} />
                        </div>
                    </div>
                )}

                {showProfileCard && walletAddress && (
                    <div className="fixed inset-0 flex justify-center items-end bg-black bg-opacity-50">
                        <div className="bg-gray-800 p-4 rounded-t-lg shadow-lg w-full max-w-md">
                            <button onClick={() => setShowProfileCard(false)} className="text-white float-right mb-2">
                                ✖
                            </button>
                            <ProfileCard walletAddress={walletAddress} />
                        </div>
                    </div>
                )}
            </div>
        </Router>
        </WalletModalProvider>
        </SocketProvider>
    
);
};

export default App;
