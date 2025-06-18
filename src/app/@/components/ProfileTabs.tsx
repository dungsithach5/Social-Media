import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/tabs';
import PostItem from '../components/PostItem';

export default function ProfileTabs() {
  return (
    <Tabs defaultValue="post" className="mt-6 max-w-xl mx-auto">
      <TabsList className="flex justify-center space-x-40 border-b border-white/10 bg-transparent rounded-none  px-6">
        <TabsTrigger
          value="post"
          className="pb-3 text-gray-400 hover:text-white hover:border-white border-b-2 border-transparent transition"
        >
          Post
        </TabsTrigger>
        <TabsTrigger
          value="following"
          className="pb-3 text-gray-400 hover:text-white hover:border-white border-b-2 border-transparent transition"
        >
          Following
        </TabsTrigger>
        <TabsTrigger
          value="followers"
          className="pb-3 text-gray-400 hover:text-white hover:border-white border-b-2 border-transparent transition"
        >
          Followers
        </TabsTrigger>
      </TabsList>

      <TabsContent value="post" className="mt-6">
        <PostItem
          name="Anna Smith"
          time="2 hours ago"
          text="Enjoying a quiet afternoon 🌿"
          image="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
        />
        
      </TabsContent>

      <TabsContent value="following" className="mt-6 text-white">
        Nội dung Following
      </TabsContent>
      <TabsContent value="followers" className="mt-6 text-white">
        Nội dung Followers
      </TabsContent>
    </Tabs>
  );
}
