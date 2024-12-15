import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext'; // Zorg ervoor dat het pad klopt
import Picker from '@emoji-mart/react';

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

interface InboxProps {
    userId: string; // Voeg hier het juiste type toe
  }

interface Notification {
    _id: string;
    message: string;
  }
  
  interface Participant {
    _id: string; // De unieke ID van een gebruiker
    username: string; // De gebruikersnaam van een deelnemer
  }
  
  interface Message {
    _id: string; // Unieke ID van het bericht
    senderId: {
      _id: string;
      username: string;
    } | null;
    content: string;
    chatId: string; // Zorg ervoor dat 'chatId' aanwezig is in het bericht voor vergelijking
  }
  
  
  
  interface Chat {
    _id: string;
    inviterUsername: string;
    status: string;
    participants: Participant[];
    lastMessage: {
      senderId: string;
      content: string;
    } | null; // Kan null zijn als er nog geen berichten zijn
    familyName?: string;  // Optional familyName property

  }

const Inbox: React.FC<InboxProps> = ({ userId }) => {
    const socket = useSocket().socket;  // Haal de socket op uit de context
    const [activeTab, setActiveTab] = useState('notifications');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [chatInviteUsername, setChatInviteUsername] = useState('');
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false); // Track emoji picker visibility
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showInviteInput, setShowInviteInput] = useState(false);
    const [invites, setInvites] = useState<{ chat: Chat[]; family: Chat[] }>({
        chat: [],
        family: [],
      });

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]); // Trigger scroll when messages change

    // Fetch data for inbox
    const fetchData = async () => {
        try {
            if (!userId) throw new Error('User ID is missing');
    
            const [
                chatInvitesResponse,
                familyInvitesResponse,
                notificationsResponse,
                chatsResponse,
                messagesResponse,
            ] = await Promise.all([
                axios.get(`${BASE_API_URL}/chat-invites/${userId}`),
                axios.get(`${BASE_API_URL}/family-invites/${userId}`),
                axios.get(`${BASE_API_URL}/notifications/${userId}`),
                axios.get(`${BASE_API_URL}/chats/${userId}`),
                axios.get(`${BASE_API_URL}/messages/${userId}`),
            ]);
    
            console.log("Family invites response:", familyInvitesResponse.data); // Log de data van family invites
    
            setInvites({
                chat: chatInvitesResponse.data || [],
                family: familyInvitesResponse.data || [],
            });
            setNotifications(notificationsResponse.data || []);
            setChats(chatsResponse.data || []);
            setMessages(messagesResponse.data || []);
        } catch (error) {
            setError('Failed to fetch data');
            console.error('Error fetching data:', error);
        }
    };
    

    useEffect(() => {
        // Check if socket and userId are available
        if (!socket || !userId) return;
    
        socket.emit('register', userId); // Register the user with the socket server
    
        if (selectedChat) {
            socket.emit('joinChat', selectedChat._id); // Join a specific chatroom
        }
    
// Listen for jail status updates and create notifications
const handleJailStatusUpdate = (data: { walletAddress: string; isInJail: boolean; jailReleaseTime: string | null }) => {
    if (data.walletAddress === userId) {
        console.log(`Updated jail status for ${userId}: ${data.isInJail ? 'In Jail' : 'Released'}`);

        const newNotification = {
            _id: `jail-${Date.now()}`, // Unique ID for the notification
            message: data.isInJail
                ? `You have been sent to jail. Release time: ${data.jailReleaseTime ? new Date(data.jailReleaseTime).toLocaleTimeString() : 'N/A'}`
                : 'You have been released from jail.',
        };

        // Avoid duplicate notifications
        setNotifications((prevNotifications) => {
            const exists = prevNotifications.some((notification) => notification.message === newNotification.message);
            if (!exists) {
                return [...prevNotifications, newNotification];
            }
            return prevNotifications;
        });
    }
};

    
        // Listen for new messages
        const handleNewMessage = (message: any) => {
            if (selectedChat && message.chatId === selectedChat._id) {
                setMessages((prevMessages) => {
                    const messageExists = prevMessages.some((msg) => msg._id === message._id);
                    if (!messageExists) {
                        return [...prevMessages, message];
                    }
                    return prevMessages; // Prevent duplicates
                });
            }
        };
    
        // Listen for message updates to refresh data
        const handleMessageUpdate = (data: { userId: string }) => {
            if (data.userId === userId) {
                fetchData(); // Call function to refresh data
            }
        };
    
        // Listen for new chat invites
        const handleNewChatInvite = () => {
            fetchData(); // Refresh data on new invite
        };
    
        // Set up event listeners
        socket.on('jailStatusUpdated', handleJailStatusUpdate);
        socket.on('newMessage', handleNewMessage);
        socket.on('messageUpdate', handleMessageUpdate);
        socket.on('newChatInvite', handleNewChatInvite);
    
        // Cleanup event listeners
        return () => {
            socket.off('jailStatusUpdated', handleJailStatusUpdate);
            socket.off('newMessage', handleNewMessage);
            socket.off('messageUpdate', handleMessageUpdate);
            socket.off('newChatInvite', handleNewChatInvite);
        };
    }, [socket, userId, selectedChat]); // Ensure effect runs when socket, userId, or selectedChat changes
    

    useEffect(() => {
        if (userId) fetchData(); // Fetch data on user ID change
    }, [userId]);

    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setError(null);
            }, 5000); // Clear success/error message after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [successMessage, error]);

const acceptInvite = async (inviteId: string, type: 'chat' | 'family') => {
        try {
            const response = await axios.post(`${BASE_API_URL}/${type}-invites/respond`, { inviteId, response: 'accepted' });
            if (response.status === 200) {
                setInvites((prevInvites) => ({
                    ...prevInvites,
                    [type]: prevInvites[type].filter((invite) => invite._id !== inviteId),
                }));
    
                if (type === 'chat' && response.data.newChat) {
                    setChats((prevChats) => [...prevChats, response.data.newChat]);
                }
    
                setSuccessMessage(`${type} invite accepted`);
            }
        } catch (error) {
            setError('Failed to accept invite');
            console.error('Error accepting invite:', error);
        }
    };
    
    const declineInvite = async (inviteId: string, type: 'chat' | 'family') => {
        try {
            const response = await axios.post(`${BASE_API_URL}/${type}-invites/respond`, { inviteId, response: 'declined' });
            if (response.status === 200) {
                setInvites((prevInvites) => ({
                    ...prevInvites,
                    [type]: prevInvites[type].filter((invite) => invite._id !== inviteId),
                }));
    
                setSuccessMessage(`${type} invite declined`);
            }
        } catch (error) {
            setError('Failed to decline invite');
            console.error('Error declining invite:', error);
        }
    };

    const sendChatInvite = async () => {
        if (!chatInviteUsername) {
            setError('Please enter a valid username');
            return;
        }

        try {
            const receiver = await axios.get(`${BASE_API_URL}/player/by-username/${chatInviteUsername}`);
            if (receiver.data) {
                await axios.post(`${BASE_API_URL}/chat-invites/send`, {
                    inviterId: userId,
                    inviteeId: receiver.data._id,
                });
                setSuccessMessage(`Invite sent to ${chatInviteUsername}`);
                setChatInviteUsername('');
                fetchData();
            } else {
                setError('Receiver not found');
            }
        } catch (error) {
            setError('Failed to send chat invite');
            console.error('Error sending chat invite:', error);
        }
    };

    const openChat = (chat: Chat) => {
        setSelectedChat(chat);
        fetchMessages(chat._id);
    };

    const fetchMessages = async (chatId: string) => {
        try {
            const response = await axios.get(`${BASE_API_URL}/messages/chat/${chatId}`);
            setMessages(response.data);
        } catch (error) {
            setError('Failed to fetch messages');
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage || !selectedChat) return;
        try {
            const response = await axios.post(`${BASE_API_URL}/messages/send`, {
                chatId: selectedChat._id,
                senderId: userId,
                content: newMessage,
            });
            if (response.status === 200) {
                setNewMessage('');
            }
        } catch (error) {
            setError('Message failed to send');
            console.error('Error sending message:', error);
        }
    };

    const addEmoji = (emoji: any) => {
        setNewMessage((prev) => prev + emoji.native); // Add emoji to message input
        setShowEmojiPicker(false); // Close emoji picker
    };

    const deleteChat = async (chatId: string) => {
        try {
            await axios.delete(`${BASE_API_URL}/chats/${chatId}`);
            setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));
            if (selectedChat?._id === chatId) {
                setSelectedChat(null);
                setMessages([]);
            }
        } catch (error) {
            setError('Failed to delete chat');
            console.error('Error deleting chat:', error);
        }
    };
      

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
            <h1 className="text-3xl font-semibold text-white text-center mb-6">Inbox</h1>
            <div className="flex justify-center gap-6 mb-6">
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-5 py-3 rounded-lg ${activeTab === 'notifications' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                >
                    Notifications
                </button>
                <button
                    onClick={() => setActiveTab('invites')}
                    className={`px-5 py-3 rounded-lg ${activeTab === 'invites' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                >
                    Invites
                </button>
                <button
                    onClick={() => setActiveTab('chats')}
                    className={`px-5 py-3 rounded-lg ${activeTab === 'chats' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                >
                    Chats
                </button>
            </div>

            {activeTab === 'notifications' && (
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Notifications</h2>
                    <div className="max-h-64 overflow-y-auto">
                        <ul className="space-y-4">
                            {notifications.map((notification) => (
                                <li
                                    key={notification._id}
                                    className="bg-gray-700 p-4 rounded-lg shadow-md text-white"
                                >
                                    {notification.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

{activeTab === 'invites' && (
  <div>
    <h2 className="text-2xl font-semibold text-white mb-4">Pending Invites</h2>
    <div>
      {/* Chat Invites */}
      <h3 className="text-xl font-semibold text-white mb-2 mt-6">Chat Invites</h3>
      <ul className="space-y-4">
        {invites.chat.length > 0 ? (
          invites.chat
            .filter((invite) => invite.status === 'pending') // Alleen de pending uitnodigingen
            .map((invite) => (
              <li
                key={invite._id}
                className="bg-gray-700 p-4 rounded-lg shadow-md text-white flex justify-between items-center"
              >
                <span>{invite.inviterUsername || 'Unknown User'} has invited you to a private chat.</span>  {/* Chat-specific message */}
                <div>
                  <button
                    onClick={() => acceptInvite(invite._id, 'chat')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md mr-3"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineInvite(invite._id, 'chat')}
                    className="bg-red-600 text-white px-4 py-2 rounded-md"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))
        ) : (
          <li className="bg-gray-700 p-4 rounded-lg shadow-md text-center text-white">No pending chat invites</li>
        )}
      </ul>

      {/* Family Invites */}
      <h3 className="text-xl font-semibold text-white mb-2">Family Invites</h3>
      <ul className="space-y-4">
        {invites.family.length > 0 ? (
          invites.family
            .filter((invite) => invite.status === 'pending') // Alleen de pending uitnodigingen
            .map((invite) => (
              <li
                key={invite._id}
                className="bg-gray-700 p-4 rounded-lg shadow-md text-white flex justify-between items-center"
              >
                <span>
                  {invite.inviterUsername || 'Unknown User'} has sent you an invitation to join {invite.familyName || 'a family'}
                </span>  {/* Family-specific message */}
                <div>
                  <button
                    onClick={() => acceptInvite(invite._id, 'family')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md mr-3"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineInvite(invite._id, 'family')}
                    className="bg-red-600 text-white px-4 py-2 rounded-md"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))
        ) : (
          <li className="bg-gray-700 p-4 rounded-lg shadow-md text-center text-white">No pending family invites</li>
        )}
      </ul>
    </div>
  </div>
)}




{activeTab === 'chats' && (
    <div>
        {!selectedChat ? (
            <>
                <h2 className="text-2xl font-semibold text-white mb-4">Chats</h2>
                <ul className="space-y-4">
                    {chats && chats.length > 0 ? (
                        chats.map((chat) => (
                            <li
                                key={chat._id}
                                className="bg-gray-700 p-4 rounded-lg shadow-md text-white flex justify-between items-center"
                            >
                                <div onClick={() => openChat(chat)}>
                                    <h3 className="font-semibold">
                                        {chat.participants
                                            .filter((p) => p._id !== userId) // Verwijder eigen username
                                            .map((p) => p.username)
                                            .join(', ')}
                                    </h3>
                                    <p className="text-gray-400">
                                        {chat.lastMessage && typeof chat.lastMessage === 'object'
                                            ? chat.lastMessage.content
                                            : 'No messages yet'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => deleteChat(chat._id)}
                                    className="text-red-500 hover:text-red-700 ml-4"
                                >
                                    ❌
                                </button>
                            </li>
                        ))
                    ) : (
                        <p className="bg-gray-700 p-4 rounded-lg shadow-md text-center text-white">No chats available</p>
                    )}
                </ul>

                {/* Invite Button */}
                <div className="mt-6">
                    {showInviteInput ? (
                        <div className="bg-gray-700 p-4 rounded-lg shadow-md text-white">
                            <input
                                type="text"
                                value={chatInviteUsername}
                                onChange={(e) => setChatInviteUsername(e.target.value)}
                                placeholder="Enter username to invite"
                                className="w-full p-2 mb-2 bg-gray-800 rounded-md text-white"
                            />
                            <button
                                onClick={sendChatInvite}
                                className="bg-green-600 px-4 py-2 rounded-md text-white w-full"
                            >
                                Send Invite
                            </button>
                            <button
                                onClick={() => setShowInviteInput(false)}
                                className="bg-red-600 px-4 py-2 rounded-md text-white w-full mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div
                            className="bg-gray-700 p-4 rounded-lg shadow-md text-white flex justify-center items-center cursor-pointer"
                            onClick={() => setShowInviteInput(true)}
                        >
                            ➕ Invite
                        </div>
                    )}
                </div>
            </>
        ) : (
            <div className="mt-6">
<button
    onClick={() => {
        setSelectedChat(null); // Reset selected chat
    }}
    className="text-blue-500 hover:text-blue-700 mb-4"
>
    ← Back to Chats
</button>
            <div className="overflow-y-auto max-h-64 space-y-2 mb-4 p-4 bg-gray-800 rounded-md">
                <ul>
                    {messages.map((message, index) => (
                        <li key={index} className="text-gray-300">
                            <strong>{message.senderId?.username || 'Unknown User'}:</strong> {message.content}
                        </li>
                    ))}
                    <div ref={messagesEndRef} />
                </ul>
            </div>
            <div className="flex gap-2 items-center relative">
    <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        className="p-2 bg-gray-800 text-white rounded-md w-full"
        placeholder="Type a message..."
    />
    <button
        onClick={() => setShowEmojiPicker((prev) => !prev)}
        className="bg-gray-600 text-white px-2 py-2 rounded-md"
        title="Add emoji"
    >
        😊
    </button>
    <button
        onClick={sendMessage}
        className="bg-blue-600 text-white px-4 py-2 rounded-md"
    >
        Send
    </button>
    {showEmojiPicker && (
    <div className="absolute bottom-12 right-0">
        <Picker
            onEmojiSelect={addEmoji} // Use onEmojiSelect instead of onSelect
        />
    </div>
)}
</div>
                </div>
            )}
        </div>
    )}
</div>
);
};

export default Inbox;