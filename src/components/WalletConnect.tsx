import { FC, useMemo, useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import {
    SolflareWalletAdapter,
    TorusWalletAdapter,
    PhantomWalletAdapter,
    LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import UsernameForm from './UsernameForm'; // Import UsernameForm component

// Your custom RPC URL
const QUICKNODE_URL = 'https://lingering-distinguished-choice.solana-mainnet.quiknode.pro/d4fe9c0b68107c974b8264238e41cc6b99cc09ac/';
const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;

const WalletConnect: FC = () => {
    const endpoint = useMemo(() => QUICKNODE_URL, []); // Use custom RPC URL
    const wallets = useMemo(
        () => [
            new SolflareWalletAdapter(),
            new TorusWalletAdapter(),
            new PhantomWalletAdapter(),
            new LedgerWalletAdapter(),
        ],
        []
    );

    const { publicKey } = useWallet(); // Access wallet public key
    const [isPlayerRegistered, setIsPlayerRegistered] = useState<boolean | null>(null); // Track registration status
    const [loading, setLoading] = useState<boolean>(false); // Track loading state
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // Handle errors

    // Check if player is registered
    useEffect(() => {
        const checkIfPlayerExists = async () => {
            if (publicKey) {
                setLoading(true);
                try {
                    const walletAddress = publicKey.toString();
                    const response = await fetch(`${PLAYER_API_URL}/player/${walletAddress}`);

                    if (response.ok) {
                        setIsPlayerRegistered(true);
                    } else if (response.status === 404) {
                        setIsPlayerRegistered(false);
                    } else {
                        throw new Error(`Unexpected response: ${response.statusText}`);
                    }
                } catch (error) {
                    setErrorMessage('Failed to verify player registration. Please try again.');
                } finally {
                    setLoading(false);
                }
            } else {
                setIsPlayerRegistered(null); // Reset state if wallet is not connected
            }
        };

        checkIfPlayerExists();
    }, [publicKey]);

    // Handle successful registration
    const handleRegistrationSuccess = () => {
        setIsPlayerRegistered(true);
    };

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <div className="flex flex-col items-center justify-center mt-6">
                    <WalletMultiButton className="bg-yellow-500 text-black hover:bg-yellow-400 transition duration-300 ease-in-out p-4 rounded-lg shadow-lg text-xl font-bold border border-yellow-500" />

                    <div className="mt-4 text-center">
                        {loading && <p className="text-gray-500">Checking registration status...</p>}
                        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                        {isPlayerRegistered === true && (
                            <p className="text-green-500">Player is already registered!</p>
                        )}
                        {isPlayerRegistered === false && (
                            <p className="text-yellow-500">Player not registered. Please register below.</p>
                        )}
                    </div>

                    {isPlayerRegistered === false && publicKey && (
                        <UsernameForm publicKey={publicKey.toString()} onRegister={handleRegistrationSuccess} />
                    )}
                </div>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default WalletConnect;
