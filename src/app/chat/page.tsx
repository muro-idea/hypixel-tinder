import ChatsPage from "@/components/pages/Chats";

export default async function Page() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <ChatsPage />
    </section>
  )
}
