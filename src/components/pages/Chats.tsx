'use client'

import { Chat } from "@/types/prisma"
import { Button } from "@nextui-org/button"
import { Link } from "@nextui-org/link"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  useEffect(() => {
    fetch('/api/chats')
      .then(res => res.json())
      .then(chats => setChats(chats))
  }, [])

  async function createChat() {
    const newChat = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'New Chat' })
    }).then(res => res.json())
    
    toast.success('Chat created successfully')

    setChats([...chats, newChat])
  }

  async function deleteChat(id: string) {
    try {
      await fetch('/api/chats', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })

      toast.success('Chat deleted successfully')
      
      setChats(chats.filter(chat => chat.id !== id))
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div>
      <h1>Chats</h1>
      <Button onClick={createChat}>Create Chat</Button>
      <ul>
        {chats.map(chat => (
          <li key={chat.id}>
            <Link href={`/chat/${chat.id}`}>{chat.name}</Link>
            <Button onClick={() => deleteChat(chat.id)}>Delete Chat</Button>
          </li>
        ))}
      </ul>
    </div>
  )
}