import React, { useState, useEffect } from "react";
import { Connection, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// QuickNode endpoint en doeladres
const QUICKNODE_URL = "https://lingering-distinguished-choice.solana-mainnet.quiknode.pro/d4fe9c0b68107c974b8264238e41cc6b99cc09ac/";
const TO_ADDRESS = "ELRAtseMVuHu4w6Qw7gBJw5v8c3w9mpvYm42nmMgtbCk";

try {
  new PublicKey(TO_ADDRESS); // Valideer TO_ADDRESS
} catch (error) {
  console.error("Invalid TO_ADDRESS:", error);
}

interface ShopItem {
  name: string;
  price: number;
  currency: string;
}

const Shop: React.FC = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});

  // Shop items
  const items: ShopItem[] = [
    { name: "Get Pro", price: 0.0001, currency: "SOL" },
    { name: "Buy Points", price: 1, currency: "SOL" },
    { name: "Buy Money", price: 1, currency: "SOL" },
  ];

  // Foutmelding instellen
  const setError = (key: string, message: string) => {
    setErrorMessages((prev) => ({ ...prev, [key]: message }));
  };

  // Wallet saldo ophalen
  const fetchWalletBalance = async () => {
    if (!publicKey) {
      setWalletBalance(null);
      return;
    }

    try {
      const solConnection = new Connection(QUICKNODE_URL, "confirmed");
      const lamports = await solConnection.getBalance(publicKey);
      setWalletBalance(lamports / 1e9); // Lamports naar SOL
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
      setError("global", "Failed to fetch wallet balance. Please try again.");
    }
  };

  // Transactie uitvoeren
  const handlePurchase = async (item: ShopItem) => {
    if (!connected) {
      setError(item.name, "Please connect your wallet.");
      return;
    }
  
    if (!publicKey) {
      setError(item.name, "Wallet public key not found.");
      return;
    }
  
    const totalCost = item.price + 0.000005; // Item price + estimated fees
    if (walletBalance !== null && walletBalance < totalCost) {
      setError(item.name, `You need at least ${totalCost.toFixed(6)} SOL.`);
      return;
    }
  
    try {
      console.log(`Initiating purchase for ${item.name} (${item.price} SOL).`);
      setLoading(true);
      setSelectedItem(item.name);
  
      // Create transaction
      const transaction = new Transaction();
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
  
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
  
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(TO_ADDRESS),
          lamports: Math.floor(item.price * 1e9), // Convert SOL to lamports
        })
      );
  
      console.log("Transaction Details:");
      console.log("Fee Payer:", publicKey.toString());
      console.log("Blockhash:", blockhash);
  
      // Send transaction
      const signature = await sendTransaction(transaction, connection, { preflightCommitment: "processed" });
      console.log("Transaction sent. Signature:", signature);
  
      // Confirm transaction
      const confirmation = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );
  
      if (confirmation.value.err) {
        throw new Error("Transaction confirmation failed.");
      }
  
      alert(`Successfully purchased ${item.name}!`);
      await fetchWalletBalance();
    } catch (error: any) {
      console.error("Transaction error:", error);
  
      if (error.name === "WalletSendTransactionError") {
        setError(item.name, "Transaction rejected by the wallet. Please ensure you approve the transaction.");
      } else if (error.message.includes("confirmation")) {
        setError(item.name, "Transaction failed during confirmation. Please try again.");
      } else {
        setError(item.name, "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
      setSelectedItem(null);
    }
  };
  
  

  useEffect(() => {
    fetchWalletBalance();
  }, [publicKey]);


  return (
    <div className="mt-6 p-6 bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Shop</h1>

      {walletBalance !== null && (
        <p className="text-gray-300 text-center mb-4">
          Wallet Balance: <span className="text-yellow-300">{walletBalance.toFixed(6)} SOL</span>
        </p>
      )}

      {errorMessages.global && <p className="text-red-500 text-center mb-6">{errorMessages.global}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.name}
            className="bg-gray-800 p-6 rounded-lg shadow-md text-center hover:scale-105 transition-transform"
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-2">{item.name}</h2>
            <p className="text-gray-300">Price: {item.price} {item.currency}</p>
            {walletBalance !== null && walletBalance < item.price && (
              <p className="text-red-400 mt-2 text-sm">
                You need <strong>{(item.price - walletBalance).toFixed(6)}</strong> more SOL.
              </p>
            )}

            <button
              onClick={() => handlePurchase(item)}
              disabled={loading || (walletBalance !== null && walletBalance < item.price)}
              className={`w-full px-4 py-2 mt-4 rounded-lg font-semibold ${
                walletBalance !== null && walletBalance < item.price
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-400 text-white"
              }`}
            >
              {loading && item.name === selectedItem ? "Processing..." : "Buy"}
            </button>

            {errorMessages[item.name] && (
              <p className="text-red-400 text-sm mt-2">{errorMessages[item.name]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
