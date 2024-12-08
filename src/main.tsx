import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

// Setting up the Solana wallet connection
const network = 'devnet'; // Change to 'mainnet-beta' for production
const endpoint = clusterApiUrl(network);

// Wallets to be used
const wallets = [new PhantomWalletAdapter()];

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <App />
            </WalletProvider>
        </ConnectionProvider>
    </React.StrictMode>
);
