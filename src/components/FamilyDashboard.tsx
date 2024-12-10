import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';  // Zorg ervoor dat je het pad naar je SocketContext correct instelt
import Picker from '@emoji-mart/react';

// Socket.io client

const FAMILY_DASHBOARD_API_URL = import.meta.env.VITE_FAMILY_DASHBOARD_API_URL;
const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;



interface Cooldown {
  active: boolean;
  remaining: number;
}

interface Cooldowns {
  claim: Cooldown;
  sabotage: Cooldown;
  collect: Cooldown;
}



interface Player {
  username: string;
  walletAddress: string;
}

interface Territory {
  _id: string;
  name: string;
  bonus: string;
  controlledBy?: string;
  status: string;
  dominancePoints?: number;
  resourceIncome: number;
}

interface Family {
  _id: string;
  name: string;
  resources: { [key: string]: number };  // Of de specifieke structuur van je resources
  money: number;
  dominancePoints: number;
  upgrades: { armory: number; defense: number; income: number };
  members: string[];
}

interface FamilyDashboardProps {
  walletAddress: string;
}

interface Message {
  sender: string; 
  senderId: string; // Correct name
  content: string;
  timestamp: number;
}


const FamilyDashboard: React.FC<FamilyDashboardProps> = ({ walletAddress }) => {
  const socket = useSocket().socket;  // Haal de socket op uit de context
  const [userId, setUserId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyData, setFamilyData] = useState<Family | null>(null);
  const [donationSuccess, setDonationSuccess] = useState<string | null>(null);
  const [buttonError, ] = useState<string | null>(null);
  const [claimError, ] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]); // Forceer een lege array
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [, setResources] = useState<{ [key: string]: number }>({});
  const [realTimeMoney, setRealTimeMoney] = useState<number>(0);
  const [dominancePoints, setDominancePoints] = useState<number>(0);
  const [realTimeUpgrades, setRealTimeUpgrades] = useState({
    armory: 0,
    defense: 0,
    income: 0,
  });
  const [realTimeResources, setRealTimeResources] = useState<{ [key: string]: number }>({});
  const [realTimeTerritories, setRealTimeTerritories] = useState<Territory[]>([]);
  const [cooldowns, setCooldowns] = useState<Cooldowns>({
    claim: { active: false, remaining: 0 },
    sabotage: { active: false, remaining: 0 },
    collect: { active: false, remaining: 0 },
  });
  const [upgradeCosts, setUpgradeCosts] = useState({
    armory: 0,
    defense: 0,
    income: 0,
  });
  const [, setError] = useState<string | null>(null);
  const [, setLoading] = useState<boolean>(true);
  const [donationAmount, setDonationAmount] = useState<number | ''>('');

  const formatCooldown = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };


  useEffect(() => {
    console.log("Starting interval for cooldown updates");
  
    const interval = setInterval(() => {
      console.log("Interval tick"); // Log voor debugging
  
      setCooldowns((prev) => {
        const updated = { ...prev };
        Object.keys(prev).forEach((key) => {
            // Typeguard om te controleren of de key een geldige key is
          if (key === "claim" || key === "sabotage" || key === "collect") {
          const cooldown = prev[key as keyof typeof prev];
          if (cooldown.active && cooldown.remaining > 0) {
            // Aftellen met een beveiliging tegen negatieve waarden
            updated[key] = {
              ...cooldown,
              remaining: Math.max(0, cooldown.remaining - 1000),
            };
  
            if (updated[key].remaining === 0) {
              updated[key].active = false; // Zet active op false als de timer afloopt
            }
          }
        }
        });
        console.log("Updated cooldowns:", updated); // Debug output van cooldowns
        return updated;
      });
    }, 1000);
  
    return () => {
      console.log("Clearing interval for cooldown updates"); // Log wanneer interval wordt opgeruimd
      clearInterval(interval); // Ruim interval netjes op bij unmount
    };
  }, []);
  



  

  // Scroll naar de onderkant van de chatgeschiedenis wanneer berichten veranderen
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);


  useEffect(() => {
    const handleScroll = () => {
      const chatBox = document.querySelector('.chat-box');
      if (chatBox && chatBox.scrollTop === 0 && hasMoreMessages) {
        loadMoreMessages(); // Laad meer berichten als de bovenkant is bereikt
      }
    };
  
    const chatBox = document.querySelector('.chat-box');
    if (chatBox) {
      chatBox.addEventListener('scroll', handleScroll);
    }
  
    return () => {
      if (chatBox) {
        chatBox.removeEventListener('scroll', handleScroll);
      }
    };
  }, [messages, hasMoreMessages]);

  // Fetch chatgeschiedenis bij het laden
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`/${FAMILY_DASHBOARD_API_URL}/${familyId}/chat`, {
          params: { limit: 100, offset: 0 },
        });
        const history = response.data.chatHistory || [];
        setMessages((prev) => [...history, ...prev]); // Voeg de geschiedenis toe aan bestaande berichten
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };
  
    if (familyId) {
      fetchChatHistory();
    }
  }, [familyId]);
  


  const loadMoreMessages = async () => {
    if (!familyId || loadingMore || !hasMoreMessages) return;
  
    setLoadingMore(true);
    try {
      const offset = messages.length;
      const response = await axios.get(`/${FAMILY_DASHBOARD_API_URL}/${familyId}/chat`, {
        params: { limit: 100, offset },
      });
  
      const newMessages = response.data.chatHistory || [];
      setMessages((prev) => [...newMessages, ...prev]); // Combineer nieuwe en bestaande berichten
      setHasMoreMessages(newMessages.length === 100); // Controleer of er meer berichten zijn
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };
  

 // Voeg een emoji toe aan het invoerveld
 const handleEmojiClick = (emoji: any) => {
  setNewMessage((prev) => prev + emoji.native); // Correct gebruik van emoji.native
  setShowEmojiPicker(false); // Sluit de picker na selectie
};


// Initialisatie useEffect
useEffect(() => {
  const initialize = async () => {
    try {
      console.log("Initializing player data and family details...");
      const username = await fetchPlayerData(); // Haal spelerdata op met walletAddress
      if (username) {
        console.log("Fetched username:", username);
        await Promise.all([
          fetchFamilyDetails(username), // Haal familiedetails op
          fetchTerritories(), // Haal territoria op
        ]);
      }
    } catch (error) {
      console.error("Initialization error:", error);
    } finally {
      setLoading(false); // Zet de loading status naar false, ongeacht het resultaat
    }
  };

  initialize();
}, [walletAddress]); // Blijft afhankelijk van walletAddress

// FamilyId-afhankelijke data useEffect
useEffect(() => {
  if (!familyId) {
    console.warn("Family ID is not set. Skipping family-specific data fetch.");
    return;
  }

  const fetchFamilyData = async () => {
    try {
      console.log("Fetching family-specific data for familyId:", familyId);
      const { data } = await axios.get(`${FAMILY_DASHBOARD_API_URL}/request-cooldown/${familyId}`);
      console.log("Fetched cooldown data:", data.cooldowns);
      setCooldowns(data.cooldowns);
    } catch (error) {
      console.error("Error fetching family data:", error);
    }
  };

  fetchFamilyData();
}, [familyId]);



  // ** Fetch player data **
  const fetchPlayerData = async (): Promise<string | null> => {
    try {
      console.log('Fetching player data for walletAddress:', walletAddress);
  
      const { data: player }: { data: Player } = await axios.get(`${PLAYER_API_URL}/profile/${walletAddress}`);
      console.log('Player data fetched:', player);
  
      if (player?.username) {
        setUserId(player.username); // Stel userId in op de username
        console.log('Player ID (username) set:', player.username);
        return player.username;
      } else {
        throw new Error('Player username not found in response.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error fetching player data:', errorMessage);
  
      // Reset de userId bij een fout
      setUserId(null);
      return null;
    }
  };
  
  
  
    


    // ** Fetch upgrade costs **
    const fetchUpgradeCosts = async () => {
      if (!familyId) return;
    
      try {
        const types = ['armory', 'defense', 'income'];
        const costs = await Promise.all(
          types.map(async (type) => {
            const response = await axios.get(
              `${FAMILY_DASHBOARD_API_URL}/upgrade-cost?familyId=${familyId}&upgradeType=${type}`
            );
            return { type, cost: response.data.cost };
          })
        );
    
        // Map costs to state
        const costsMap = costs.reduce((acc, { type, cost }) => {
          acc[type as keyof typeof upgradeCosts] = cost;
          return acc;
        }, {} as typeof upgradeCosts);
    
        setUpgradeCosts(costsMap);
      } catch (error) {
        console.error('Error fetching upgrade costs:', error);
      }
    };
  
    // Call fetchUpgradeCosts when familyId is available
useEffect(() => {
  if (familyId) fetchUpgradeCosts();
}, [familyId]);

  // ** Fetch family details **
// ** Fetch family details **
const fetchFamilyDetails = async (username: string) => {
  console.log('Fetching family details for username:', username); // Debugging

  try {
    const response = await axios.get('/api/family');
    const families: Family[] = response.data;

    console.log('Fetched families:', families); // Controleer de opgehaalde families

    const userFamily = families.find((family) =>
      family.members.includes(username)
    );

    console.log('User family:', userFamily); // Controleer de gevonden familie

    if (userFamily && userFamily.resources) {
      setFamilyId(userFamily._id);
      console.log('Family ID set:', userFamily._id); // Log de familyId die is ingesteld
      setFamilyData(userFamily);
      setResources(userFamily.resources); // Stel alle resources in (als een object)
      setRealTimeMoney(userFamily.money);
      setDominancePoints(userFamily.dominancePoints);
      setRealTimeUpgrades(userFamily.upgrades);

      // Stel de specifieke resource in
      setRealTimeResources(userFamily.resources); // Gebruik de specifieke resource als een getal
    } else {
      console.error('No family found for username:', username);
      setError('No family found.');
    }
  } catch (error) {
    console.error('Error fetching family details:', error);
    setError('Unable to fetch family details.');
  }
};



  

useEffect(() => {
  if (!familyId || !socket) return;

  // Join family room
  socket.emit("joinFamilyRoom", familyId);
  console.log(`User joined family room: family-${familyId}`);

  // Listener for cooldown updates
  const handleCooldownUpdates = (data: { [key: string]: number }) => {
    const updatedCooldowns: Cooldowns = {
      claim: { active: data.claim > 0, remaining: data.claim || 0 },
      sabotage: { active: data.sabotage > 0, remaining: data.sabotage || 0 },
      collect: { active: data.collect > 0, remaining: data.collect || 0 },
    };
  
    console.log("Cooldowns updated:", updatedCooldowns);
    setCooldowns(updatedCooldowns);
  };
  

  // Listener for resource updates
  const handleResourceUpdates = ({
    resources,
    dominancePoints,
  }: {
    resources: Family["resources"];
    dominancePoints: Family["dominancePoints"];
  }) => {
    console.log("Resources updated:", resources, dominancePoints);
    setRealTimeResources(resources);
    setDominancePoints(dominancePoints);
  };

  // Listener for family updates
  const handleFamilyUpdates = (data: Partial<Family>) => {
    console.log("Family update received:", data);
    if (data.resources) setRealTimeResources(data.resources);
    if (data.money !== undefined) setRealTimeMoney(data.money);
    if (data.upgrades) setRealTimeUpgrades(data.upgrades);
  };

  // Listener for territory updates
  const handleTerritoryUpdates = (territoryUpdate: Partial<Territory> & { territoryId: string }) => {
    if (!territoryUpdate.territoryId) {
      console.error("Invalid territory update:", territoryUpdate);
      return;
    }
    console.log("Territory updated:", territoryUpdate);
    setRealTimeTerritories((prev) =>
      prev.map((territory) =>
        territory._id === territoryUpdate.territoryId
          ? { ...territory, ...territoryUpdate }
          : territory
      )
    );
  };

  // Listener for new chat messages
  const handleNewFamilyMessage = (message: Message) => {
    console.log("New family message received:", message);
    setMessages((prev) => [...prev, message]);
  };

  // Register listeners
  socket.on("update-cooldowns", handleCooldownUpdates);
  socket.on("update-resources", handleResourceUpdates);
  socket.on("family-update", handleFamilyUpdates);
  socket.on("territory-update", handleTerritoryUpdates);
  socket.on("newFamilyMessage", handleNewFamilyMessage);

  // Cleanup on unmount
  return () => {
    if (socket) {
      socket.off("update-cooldowns", handleCooldownUpdates);
      socket.off("update-resources", handleResourceUpdates);
      socket.off("family-update", handleFamilyUpdates);
      socket.off("territory-update", handleTerritoryUpdates);
      socket.off("newFamilyMessage", handleNewFamilyMessage);
      console.log(`Cleaned up listeners for family-${familyId}`);
    }
  };
}, [familyId, socket]);




useEffect(() => {
  if (!familyId || !socket) return; // Controleer of familyId en socket bestaan

  // Join the family room
  socket.emit("joinFamilyRoom", familyId);
  console.log(`User joined family room: family-${familyId}`);

  // Define a listener for new messages
  const handleNewMessage = (message: Message) => {
    console.log("New family message received:", message);

    setMessages((prev) => {
      // Check if the message already exists (based on timestamp and sender)
      const isDuplicate = prev.some(
        (msg) =>
          msg.timestamp === message.timestamp && msg.sender === message.sender
      );
      if (isDuplicate) {
        console.warn("Duplicate message ignored:", message);
        return prev;
      }
      return [...prev, message];
    });
  };

  // Attach the listener
  socket.on("newFamilyMessage", handleNewMessage);

  // Cleanup function to remove the listener when `familyId` changes
  return () => {
    if (socket) {
      socket.off("newFamilyMessage", handleNewMessage);
      console.log(`Removed listener for family-${familyId}`);
    }
  };
}, [familyId, socket]); // Voeg socket toe aan de dependency array





const sendMessage = async () => {
  if (!newMessage.trim()) return; // Stop als het bericht leeg is

  if (!userId || !familyId) {
    console.error("User ID or Family ID is missing");
    return;
  }

  const messageData = {
    familyId,
    sender: userId,
    message: newMessage.trim(),
    timestamp: new Date().toISOString(),
  };

  try {
    // Controleer of socket is geïnitialiseerd voordat je een bericht verstuurt
    if (socket) {
      socket.emit("familyMessage", messageData); // Verzend het bericht naar de server
      setNewMessage(""); // Wis het invoerveld
    } else {
      console.error("Socket is not initialized");
    }
  } catch (error) {
    console.error("Failed to send message:", error);
  }
};





  // ** Fetch territories **
  const fetchTerritories = async () => {
    try {
      const response = await axios.get(`${FAMILY_DASHBOARD_API_URL}/territories`);
      setRealTimeTerritories(response.data || []);
    } catch (error) {
      console.error('Error fetching territories:', error);
    }
  };

  // ** Fetch cooldowns **
  const fetchCooldowns = async () => {
    if (!familyId) return;

    try {
        const response = await axios.get(`${FAMILY_DASHBOARD_API_URL}/request-cooldown/${familyId}`);
        console.log("Cooldowns from server:", response.data.cooldowns); // Voeg logging toe
        setCooldowns(response.data.cooldowns || {}); // Fallback naar een leeg object
    } catch (error) {
        console.error("Error fetching cooldowns:", error);
    }
};


  // ** Event handlers **
  const handleClaimTerritory = async (territoryId: string) => {
    if (!familyId) {
      console.error("Family ID is missing. Cannot claim territory.");
      return;
    }
  
    try {
      console.log(`Attempting to claim territory: territoryId=${territoryId}, familyId=${familyId}`);
  
      const response = await axios.post(`${FAMILY_DASHBOARD_API_URL}/territory/claim`, {
        familyId,
        territoryId,
      });
  
      console.log("Claim success:", response.data);
  
      // Update cooldowns and territories
      await fetchCooldowns();
      await fetchTerritories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      console.error("Error claiming territory:", errorMessage);
    }
  };
  
  
  

  const handleSabotage = async (territoryId: string, targetFamilyId: string | null) => {
    if (!familyId) {
      console.error("Attacker family ID is missing. Cannot perform sabotage.");
      return;
    }
  
    try {
      console.log(
        `Attempting sabotage: attackerId=${familyId}, targetFamilyId=${targetFamilyId}, territoryId=${territoryId}`
      );
  
      const response = await axios.post(`${FAMILY_DASHBOARD_API_URL}/territory/sabotage`, {
        attackerId: familyId,
        targetFamilyId,
        territoryId,
      });
  
      console.log("Sabotage success:", response.data);
  
      // Update cooldowns and territories
      await fetchCooldowns();
      await fetchTerritories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      console.error("Error sabotaging territory:", errorMessage);
    }
  };
  

  const handleUpgrade = async (type: keyof typeof realTimeUpgrades) => {
    if (!familyId) {
      console.error("Family ID is missing. Cannot perform upgrade.");
      return;
    }
  
    try {
      console.log(`Attempting upgrade: type=${type}, familyId=${familyId}`);
  
      const response = await axios.post(`${FAMILY_DASHBOARD_API_URL}/upgrade`, {
        familyId,
        upgradeType: type,
      });
  
      console.log("Upgrade success:", response.data);
  
      // Update family data
      const username = await fetchPlayerData();
      if (username) {
        await fetchFamilyDetails(username);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      console.error("Error upgrading:", errorMessage);
    }
  };
  

  const handleCollectResources = async () => {
    if (!familyId) {
      console.error("Family ID is null. Cannot collect resources.");
      return;
    }
  
    try {
      console.log(`Attempting to collect resources: familyId=${familyId}`);
  
      const { data } = await axios.post(`${FAMILY_DASHBOARD_API_URL}/collect-resources/${familyId}`);
      console.log("Collected resources data:", data);
  
      // Update cooldowns and family data
      await fetchCooldowns();
      const username = await fetchPlayerData();
      if (username) {
        await fetchFamilyDetails(username);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      console.error("Error collecting resources:", errorMessage);
    }
  };
  



const handleDonation = async () => {
  console.log('Family ID:', familyId);
  console.log('User ID (username):', userId);

  if (!familyId || !userId) {
    console.error('Family ID or User ID (username) is null. Cannot proceed with donation.');
    return;
  }

  if (!donationAmount || donationAmount <= 0) {
    console.error('Invalid donation amount.');
    return;
  }

  try {
    const response = await axios.post(`${FAMILY_DASHBOARD_API_URL}/family/donate`, {
      familyId,
      playerId: userId, // Use userId, which is now the username
      amount: donationAmount,
    });

    console.log('Donation successful:', response.data);

    // Show success message in the button
    setDonationSuccess('Donation Successful!');
    setTimeout(() => setDonationSuccess(null), 3000); // Reset success message after 3 seconds

    const username = await fetchPlayerData();
    if (username) fetchFamilyDetails(username);

    setDonationAmount(''); // Reset the donation amount after success
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Failed to donate money';
    console.error('Error donating money:', errorMessage);

    // Optionally, show error in the button as well
    setDonationSuccess('Donation Failed');
    setTimeout(() => setDonationSuccess(null), 3000); // Reset after 3 seconds
  }
};





  

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-lg shadow-lg">
    {/* If the player is not in a family */}
    {!familyId || !familyData ? (
      <div className="text-center bg-red-700 text-white p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-extrabold mb-4">You are not in a family!</h2>
        <p className="text-lg">
          Join a family to access the dashboard and participate in activities.
        </p>
        <p className="text-sm mt-2 text-gray-300">
          Families offer upgrades, resource sharing, and access to territories.
        </p>
      </div>
    ) : (
      <>
        <h2 className="text-yellow-400 text-3xl font-extrabold mb-6 text-center tracking-wide">
          {familyData?.name || 'Family Dashboard'} Dashboard
        </h2>

      {/* Overview Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-center bg-gray-800 p-4 rounded-lg shadow-xl">
        {[
    { title: 'Resources', value: typeof realTimeResources === 'object' ? realTimeResources['someResource'] : realTimeResources, icon: '💰' },
    { title: 'Dominance Points', value: dominancePoints, icon: '🛡️' },
          { title: 'Money', value: realTimeMoney, icon: '💵' },
          {
            title: 'Territories Controlled',
            value: realTimeTerritories.filter((territory) => territory.controlledBy === familyId)
              .length,
            icon: '📍',
          },
        ].map(({ title, value, icon }) => (
          <div key={title}>
            <div className="flex justify-center text-4xl">{icon}</div>
            <h3 className="text-yellow-400 font-semibold mt-2">{title}</h3>
            <p className="text-gray-300 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>


{/* Upgrades Section */}
<div className="mb-8 bg-gray-800 p-4 rounded-lg shadow-xl">
  <h3 className="text-yellow-400 font-bold mb-4 text-lg tracking-wide">Upgrades</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {['armory', 'defense', 'income'].map((type) => {
      const currentLevel = realTimeUpgrades[type as keyof typeof realTimeUpgrades] || 0;

      // Berekening van kosten
      const resourceCost = Math.ceil(100 * Math.pow(1.5, currentLevel));
      const moneyCost = Math.ceil(200 * Math.pow(1.3, currentLevel));

      // Haal de huidige hoeveelheid resources op
      const currentResource = realTimeResources[type as keyof typeof realTimeResources] || 0;

      return (
        <div key={type} className="bg-gray-700 p-4 rounded shadow-lg text-center">
          <h4 className="text-yellow-300 font-semibold text-lg">{type.toUpperCase()}</h4>
          {/* Toon het level */}
          <p className="text-gray-400 mb-1">
            Level: <span className="text-white font-bold">{currentLevel}</span>
          </p>
          {/* Toon de kosten */}
          <p className="text-gray-400 mb-1">
            Resource Cost: <span className="text-yellow-300 font-bold">{resourceCost}</span>
          </p>
          <p className="text-gray-400 mb-3">
            Money Cost: <span className="text-yellow-300 font-bold">{moneyCost}</span>
          </p>
          {/* De knop */}
          <button
            onClick={() => handleUpgrade(type as 'armory' | 'defense' | 'income')}
            disabled={currentResource < resourceCost || realTimeMoney < moneyCost}
            className={`px-4 py-2 rounded ${
              currentResource < resourceCost || realTimeMoney < moneyCost
                ? 'bg-gray-500 cursor-not-allowed text-gray-400'
                : 'bg-green-500 hover:bg-green-400 text-white'
            }`}
          >
            Upgrade
          </button>
        </div>
      );
    })}
  </div>
</div>


{/* Grid layout voor Collect en Donate secties */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  {/* Collect Resources */}
  <div className="bg-gray-800 p-4 rounded-lg shadow-xl text-center">
    <h3 className="text-yellow-400 font-bold mb-4 text-lg tracking-wide">
      Collect Resources
    </h3>
    <button
    onClick={handleCollectResources}
    disabled={cooldowns?.collect?.active || buttonError !== null}
    className={`px-6 py-3 rounded-lg font-semibold ${
        buttonError
            ? "bg-red-500 text-white cursor-not-allowed"
            : cooldowns?.collect?.active
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
    }`}
>
    {buttonError
        ? buttonError
        : cooldowns?.collect?.active
        ? `Collect (Cooldown: ${formatCooldown(cooldowns?.collect?.remaining || 0)})`
        : "Collect Now"}
</button>
  </div>

  {/* Donate Section */}
  <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
    <h3 className="text-yellow-400 font-bold text-lg mb-4">Donate Money</h3>
    <div className="flex items-center gap-4 justify-center">
      <input
        type="text"
        inputMode="numeric"
        value={donationAmount}
        onChange={(e) => setDonationAmount(Number(e.target.value))}
        placeholder="Amount"
        className="px-4 py-2 rounded bg-gray-700 text-gray-300 w-1/3 appearance-none"
      />
      <button
        onClick={handleDonation}
        disabled={!donationAmount || donationAmount <= 0}
        className={`px-6 py-3 rounded-lg font-semibold ${
          !donationAmount || donationAmount <= 0
            ? "bg-gray-500 cursor-not-allowed"
            : donationSuccess
            ? "bg-green-500 text-white" // Green button for success
            : "bg-blue-500 hover:bg-blue-400 text-white"
        }`}
      >
        {donationSuccess || "Donate"} {/* Show success message or 'Donate' */}
      </button>
    </div>
  </div>
</div>

    {/* Territories Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Controlled Territories */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-xl">
        <h4 className="text-yellow-400 font-bold mb-4 text-lg tracking-wide">
          Controlled Territories
        </h4>
        <div className="max-h-64 overflow-y-auto space-y-4">
          {realTimeTerritories
            ?.filter((territory) => territory.controlledBy === familyId)
            .map((territory) => (
              <div key={territory._id} className="bg-gray-700 p-3 rounded shadow">
                <p className="text-yellow-300 font-bold">{territory.name}</p>
                <p className="text-gray-400">Resources: {territory.resourceIncome}</p>
                <p className="text-gray-400">Dominance Points: {territory.dominancePoints}</p>
              </div>
            ))}
          {realTimeTerritories.filter((territory) => territory.controlledBy === familyId)
            .length === 0 && (
            <p className="text-gray-400 text-center">No controlled territories.</p>
          )}
        </div>
      </div>
{/* Available Territories */}
<div className="bg-gray-800 p-4 rounded-lg shadow-xl">
  <h4 className="text-yellow-400 font-bold mb-4 text-lg tracking-wide">
    Available Territories
  </h4>
  <div className="max-h-64 overflow-y-auto space-y-4">
    {realTimeTerritories
      ?.filter((territory) => territory.controlledBy !== familyId) // Exclude territories controlled by this family
      .map((territory) => (
        <div key={territory._id} className="bg-gray-700 p-3 rounded shadow">
          <p className="text-yellow-300 font-bold">{territory.name}</p>
          <p className="text-gray-400">Bonus: {territory.bonus}</p>
          <p className="text-gray-400">Resources: {territory.resourceIncome}</p>
          <p className="text-gray-400">Dominance Points: {territory.dominancePoints}</p>
          <div className="flex gap-2 mt-3">
            {/* If the territory is free, show the Claim button */}
            {territory.status === 'free' && (
              <button
  onClick={() => handleClaimTerritory(territory._id)}
  disabled={cooldowns?.claim?.active || claimError !== null}
  className={`px-3 py-2 rounded ${
    claimError
      ? 'bg-red-500 text-white cursor-not-allowed'
      : cooldowns?.claim?.active
      ? 'bg-gray-500 cursor-not-allowed'
      : 'bg-blue-500 hover:bg-blue-400 text-white'
  }`}
>
  {claimError || (cooldowns?.claim?.active
    ? `Claim (${formatCooldown(cooldowns.claim.remaining)})`
    : 'Claim')}
</button>
            )}

            {/* If the territory is controlled, show the Sabotage button */}
            {territory.status === 'controlled' && territory.controlledBy !== familyId && (
<button
  onClick={() => handleSabotage(territory._id, territory.controlledBy as string)}
  disabled={cooldowns?.sabotage?.active || buttonError !== null}
  className={`px-3 py-2 rounded ${
    buttonError
      ? 'bg-red-500 text-white cursor-not-allowed'
      : cooldowns?.sabotage?.active
      ? 'bg-gray-500 cursor-not-allowed'
      : 'bg-red-500 hover:bg-red-400 text-white'
  }`}
>
  {buttonError ||
    (cooldowns?.sabotage?.active
      ? `Sabotage (${cooldowns.sabotage?.remaining ? formatCooldown(cooldowns.sabotage.remaining) : '0s'})`
      : 'Sabotage')}
</button>
            )}
          </div>
        </div>
      ))}

    {/* Message when no available territories */}
    {realTimeTerritories.filter((territory) => territory.controlledBy !== familyId).length ===
      0 && (
      <p className="text-gray-400 text-center">No available territories.</p>
    )}
  </div>
</div>
</div>

  {/* Live Chat */}
  <div className="chat-container bg-gray-900 text-white rounded-lg p-4 shadow-lg relative">
  {/* Indicator voor het laden van meer berichten */}
  {loadingMore && <p className="text-sm text-gray-400 text-center">Loading more messages...</p>}

  {/* Chatgeschiedenis */}
  <div
    ref={chatBoxRef}
    className="chat-box h-64 overflow-y-auto border border-gray-700 p-4 rounded"
  >
    {messages.map((msg, index) => (
      <div key={index} className="chat-message mb-2">
        <strong className="text-yellow-400">
          {msg.sender === 'You' ? 'You' : msg.sender}
        </strong>
        : {msg.message}
        <span className="timestamp text-sm text-gray-400 ml-2">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </span>
      </div>
    ))}
  </div>


  {/* Invoerveld */}
  <div className="chat-input mt-4 flex items-center relative">
    <input
      type="text"
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Type a message..."
      className="flex-grow p-2 border border-gray-700 bg-gray-800 text-white rounded-l"
    />
    <button
      onClick={() => setShowEmojiPicker((prev) => !prev)}
      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-yellow-400"
    >
      😊
    </button>
    {showEmojiPicker && (
      <div className="absolute bottom-14 right-12 z-10">
        <Picker onEmojiSelect={handleEmojiClick} theme="dark" />
      </div>
    )}
    <button
      onClick={sendMessage}
      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-r"
    >
      Send
    </button>
  </div>
</div>    


    </>
    )}
  </div>


    );
};


export default FamilyDashboard;
