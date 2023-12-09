'use client'

import { useEffect, useState } from "react";
import { useWebSocket } from "@/contexts/websocket";
import { WebSocketMessage } from "@/types/websocket";
import { Button } from "@nextui-org/button";
import toast from "react-hot-toast";
import { Avatar, AvatarGroup, Tooltip } from "@nextui-org/react";

type Chat = {
  messages: {
    sender: {
      id: string;
      image: string | null;
      name: string | null;
      role: string | null;
    };
    id: string;
    text: string | null;
    image: string | null;
    chatId: string;
    userId: string;
    createdAt: Date;
  }[];
  members: any[];
} & any;

export default function ChatPage({ chat, user }: ChatPageProps) {
  const [messages, setMessages] = useState<WebSocketMessage['data'][]>([...chat.messages])
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const socket = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    socket.emit('joinRoom', (chat.id))

    socket.on('error', (error: any) => {
      if (typeof error === 'string') toast.error(error)
      else console.error(error)
    });

    socket.on('presenceJoin', (data: string) => {
      const newUsers = JSON.parse(data) as { id: string; socketId: string; };
      console.log(newUsers);
      setOnlineUsers(onlineUsers => {
        if (onlineUsers.some(user => user.id === newUsers.id)) {
          return onlineUsers;
        }
    
        const member = chat.members.find((member: any) => member.id === newUsers.id);
        if (member) {
          return [...onlineUsers, { ...member, socketId: newUsers.socketId }];
        }
    
        return onlineUsers;
      });
    });

    socket.on('presenceLeave', (id: string) => {
      setOnlineUsers(onlineUsers => onlineUsers.filter((user: any) => user.id !== id));
    });

    socket.on('removeMessage', (messageId: string) => {
      setMessages(messages => messages.filter(message => message.id !== messageId))
    });

    socket.on('message', async (message: string) => {
      const data = await JSON.parse(message) as WebSocketMessage['data']
      setMessages(messages => [...messages, data])
    });

    return () => {
      socket.off('message')
      socket.emit('leaveRoom', chat.id)
    };
  }, [socket, chat.id, user.id, chat.members]);

  function testSocket() {
    if (!socket || !user) return;
    
    const socketData = {
      content: 'Hello World!',
      chatId: chat.id,
      sender: {
        id: user.id,
        name: user.name,
        image: user.image
      }
    }

    socket.send(JSON.stringify(socketData));
  }

  function deleteMessage(id: string) {
    if (!socket) return;
    socket.emit('deleteMessage', id)
  }

  return (
    <div>
      <h1>{chat.name}</h1>
      <Button onClick={testSocket}>
        Test Socket
      </Button>
      <ul>
        {messages.map(message => (
          <li key={message.id}>
            {message.content}
            {message.sender.name}
            <img src={message.sender.image} alt={message.sender.name} />
            <span>are you reciever? {message.sender.id === user.id ? 'no' : 'yes'}</span>
            <Button onClick={() => deleteMessage(message.id)}>Delete Message</Button>
          </li>
        ))}
      </ul>
      <AvatarGroup>
        {chat.members.map((u: any) => (
          <Tooltip key={u.id} content={u.name}>
            <Avatar isBordered color={onlineUsers.findIndex((o) => o.id === u.id > -1 || u.id === user.id) >= 0 ? 'success' : 'danger'} src={u.image} />
          </Tooltip>
        ))}
      </AvatarGroup>
    </div>
  )
}

interface ChatPageProps {
  chat: Chat;
  user: any;
}