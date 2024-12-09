import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Type for the context
interface SocketContextValue {
  socket: Socket | null;
  registerWallet: (walletAddress: string) => void;
  messages: string[]; // Store incoming messages
  isConnected: boolean; // Track connection status
}

// Socket events types
interface SocketEvents {
  'register': (walletAddress: string, callback: (response: any) => void) => void;
  'message': (message: string) => void;
  'connect': () => void;
  'connect_error': (error: Error) => void;
}

// Context creation
const SocketContext = createContext<SocketContextValue | undefined>(undefined);

// Provider component
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useRef<Socket<SocketEvents> | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false); // Track connection status

  // Get the socket server URL from the environment variable
  const socketURL = import.meta.env.VITE_SOCKET_URL;

  // Connect the socket on mount
  useEffect(() => {
    socket.current = io(socketURL, {
      transports: ['polling', 'websocket'], // Specify transport methods
      withCredentials: true,  // Allow sending cookies if needed
      reconnectionAttempts: 5, // Reconnection attempts before failing
      reconnectionDelay: 1000, // Delay between reconnection attempts
    });

    // Listen for connection
    socket.current.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    // Listen for connection error
    socket.current.on('connect_error', (err) => {
      console.error('Connection failed:', err);
      setIsConnected(false);
    });

    // Listen for incoming messages
    socket.current.on('message', (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup on unmount
    return () => {
      socket.current?.disconnect();
      console.log('Socket disconnected');
    };
  }, [socketURL]);

  // Function to register wallet
  const registerWallet = (walletAddress: string) => {
    if (!socket.current) return;
    socket.current.emit('register', walletAddress, (response: any) => {
      console.log('Wallet registration response:', response);
    });
  };

  return (
    <SocketContext.Provider value={{ socket: socket.current, registerWallet, messages, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
