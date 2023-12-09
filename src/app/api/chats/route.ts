import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Chat } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const chats = await prisma.chat.findMany({
    where: {
      members: {
        some: {
          id: user.id
        }
      }
    },
    include: {
      members: true
    }
  }) as Chat[]

  return NextResponse.json(chats)
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const newChat = await prisma.chat.create({
    data: {
      name: body.name,
      description: body.description,
      members: {
        connect: body.userIds?.map((id: string) => ({ id }))
      }
    },
    include: {
      members: true
    }
  }) as Chat

  return NextResponse.json(newChat)
}

export async function PUT(request: NextRequest) {
  const { id, name, userIds } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 })
  }

  const updatedChat = await prisma.chat.update({
    where: {
      id
    },
    data: {
      name,
      members: {
        connect: userIds?.map((id: string) => ({ id }))
      }
    }
  }) as Chat

  return NextResponse.json(updatedChat)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 })
  }

  const deletedChat = await prisma.chat.delete({
    where: {
      id
    }
  })

  return NextResponse.json(deletedChat)
}