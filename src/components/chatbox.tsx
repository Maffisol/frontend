import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';  // Zorg ervoor dat je het pad naar je SocketContext correct instelt

interface Message {
    senderId: string;
    message: string;
  }

  interface ChatboxProps {
    userId: string;
  }
  

const Chatbox: React.FC<ChatboxProps> = ({ userId }) => {
    const socket = useSocket().socket;  // Haal de socket op uit de context
    const [messages, setMessages] = useState<Message[]>([]); // Array of Message objects
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        // Haal eerdere chatberichten op
        const fetchMessages = async () => {
            try {
                const response = await axios.get('/api/chat/messages');
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching chat messages:', error);
            }
        };
    
        fetchMessages();
    
        // Check of de socket niet null is voordat we luisteren naar berichten
        if (socket) {
            // Luister naar nieuwe berichten via WebSocket
            socket.on('newChatMessage', (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            });
    
            // Cleanup WebSocket-verbinding bij component unmount
            return () => {
                socket.off('newChatMessage');
            };
        }
    
        // Return niets als socket null is
        return () => {};
    }, [socket]); // Voeg socket als afhankelijkheid toe zodat het alleen wordt uitgevoerd als de socket beschikbaar is.
    
    
    // Verstuur een nieuw bericht
    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;
    
        try {
            const response = await axios.post('/api/chat/send', {
                senderId: userId,
                message: newMessage,
                type: 'public'
            });
            setNewMessage('');
            
            // Check of de socket niet null is voordat we het bericht versturen
            if (socket) {
                // Emit het nieuwe bericht via WebSocket naar andere clients
                socket.emit('newChatMessage', response.data);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };
    
    return (
        <div className="chatbox">
            <div className="chat-messages">
                {messages.map((msg: Message, index) => (
                    <div key={index} className="message">
                        <strong>{msg.senderId}</strong>: {msg.message}
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chatbox;
