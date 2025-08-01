import { useAuth } from "../../hooks/useAuth"

export default function ProfileHeader() {
  const { session, status } = useAuth(true)

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <section className="w-full flex flex-col justify-center items-center">      
      <div className=" w-48 h-48 rounded-full overflow-hidden">
        {session.user?.image && (
          <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold">{session.user?.name}</h2>
        <p className="text-gray-400">{session.user?.email}</p>
      </div>

      <div className="flex justify-center gap-4 mt-4 text-center">
        <button className="border px-4 py-2 rounded-full cursor-pointer hover:text-white hover:bg-black">Follow</button>
        <button className="border px-4 py-2 rounded-full cursor-pointer hover:text-white hover:bg-black">Message</button>
      </div>
    </section>
  );
}
  