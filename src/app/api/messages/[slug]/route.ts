import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { slug } = params

  if (!slug) {
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 })
  }

  try {
    await prisma.message.deleteMany({
      where: {
        id: slug,
        senderId: user.id
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}