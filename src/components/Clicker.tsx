import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';

interface PlayerData {
    clickCount: string; // Ensuring the click count is a string from the database
}

const Clicker: React.FC = () => {
    const { publicKey } = useWallet(); // Get the connected wallet address
    const [clickCount, setClickCount] = useState<string>('0'); // Initialize click count as string
    const [loading, setLoading] = useState<boolean>(true); // State to manage loading status
    const [error, setError] = useState<string | null>(null); // State for error handling

    // Fetch player data when the component mounts or when the user logs in/out
    useEffect(() => {
        const fetchPlayerData = async () => {
            if (publicKey) { // Check if the user is logged in
                setLoading(true); // Set loading to true while fetching
                try {
                    const response = await fetch(`${import.meta.env.VITE_PLAYER_API_URL}/profile/${publicKey.toString()}`); // Fetch player data
                    if (!response.ok) throw new Error('Failed to fetch player data');
                    
                    const data: PlayerData = await response.json();
                    setClickCount(data.clickCount || '0'); // Update click count
                    setError(null); // Clear previous errors
                } catch (error) {
                    console.error('Error fetching player data:', error);
                    setError('Error fetching player data. Please try again later.');
                } finally {
                    setLoading(false); // Stop loading after fetch is complete
                }
            } else {
                // Reset state if user is not logged in
                setClickCount('0'); 
                setLoading(false); // Stop loading if no user
            }
        };

        fetchPlayerData(); // Fetch player data
    }, [publicKey]); // Dependency on publicKey to refetch when user logs in or out

    const handleClick = async () => {
        const newCount = (parseInt(clickCount) + 1).toString(); // Increment and convert to string
        setClickCount(newCount); // Update local state
      
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_HITTER_API_URL}/hitter`, 
            { 
              walletAddress: publicKey?.toString(), // Use wallet address
              clickCount: newCount, // Send updated click count
            },
            {
              headers: {
                'Content-Type': 'application/json', // Ensure proper content type
              },
            }
          );
      
          // Check if the request was successful
          if (response.status !== 200) {
            throw new Error(`Failed to save click: ${response.data.message || 'Unknown error'}`);
          }
      
          console.log('Click data saved'); // Log saved click data
        } catch (error) {
          console.error('Error saving click count:', error); // Log error if saving fails
        }
      };
      

    return (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
            <h2 className="text-3xl mb-4 text-yellow-400 font-bold text-center">
                {loading ? 'Loading...' : `Hits: ${clickCount}`} {/* Show loading or click count */}
            </h2>
            <button
                onClick={handleClick} // Call handleClick on button click
                className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition duration-300 ease-in-out px-6 py-3 rounded shadow-md text-xl font-semibold mx-auto block">
                Click Me!
            </button>
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>} {/* Display any errors */}
        </div>
    );
};

export default Clicker;
