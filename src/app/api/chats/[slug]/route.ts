import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }:{ params: { slug: string }}) {
  const { slug } = params
  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  const chat = await prisma.chat.findUnique({
    where: {
      id: slug,
      members: {
        some: {
          id: user.id
        }
      }
    },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true
            }
          }
        }
      }
    }
  })

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  return NextResponse.json(chat)
}