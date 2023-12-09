import ChatPage from "@/components/pages/Chat";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export default async function Page({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user) return <h1>You must be logged in to view this page</h1>

  const { slug } = params

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

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      {chat ? <ChatPage chat={chat} user={user} /> : <h1>Chat not found</h1>}
    </section>
  )
}

interface PageProps {
  params: {
    slug: string;
  };
}