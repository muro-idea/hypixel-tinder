import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const WebSocketContext = createContext<Socket | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!data || !data.user) return;

    const sockett = io('wss://ws.fabra.tech/').connect();

    sockett.on('connect', () => {
      setSocket(sockett);
      sockett.emit('setUserId', data.user.id);
    });

    sockett.on('disconnect', () => {
      setSocket(null);
    });

    return () => {
      sockett.disconnect();
      setSocket(null);
    };
  }, [data]);

  return (
    <WebSocketContext.Provider value={socket}>{children}</WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}