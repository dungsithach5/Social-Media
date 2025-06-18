function ProfileHeader() {
    return (
      <div className="relative w-full bg-black text-white pb-10 mt-14">
        <div className="w-full h-48">
          <img
            src="https://cellphones.com.vn/sforum/wp-content/uploads/2024/04/anh-bia-facebook-42.jpg"
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
     
        <button className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm flex items-center gap-1">
           Edit profile
        </button>

  
        <div className="absolute left-1/2 top-32 transform -translate-x-1/2">
          <img
            src="/avatar.jpg"
            alt="Avatar"
            className="w-28 h-28 rounded-full border-4 border-black"
          />
        </div>
  
        <div className="mt-16 text-center">
          <h2 className="text-xl font-semibold">Ethan Walker</h2>
          <p className="text-gray-400">@ethanwalker</p>
        </div>
  
        <div className="flex justify-center gap-4 mt-4">
          <button className="bg-white text-black px-4 py-2 rounded">FOLLOW</button>
          <button className="border border-white px-4 py-2 rounded">MESSAGE</button>
        </div>
  
    
    
      </div>
    );
  }
export default ProfileHeader;
  