"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import Masonry from "react-masonry-css";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/tabs";
import { ComposerComment } from "./model-comment/ComposerComment";
import { fetchPosts } from "../../services/Api/posts";
import { useAuth } from "../../hooks/useAuth";
import SkeletonPost from "./skeleton-post";

const breakpointColumnsObj = {
  default: 6,
  1024: 2,
  640: 2,
};

export default function ProfileTabs() {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const { user, session } = useAuth(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts("");
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: user?.username || user?.name,
          title: item.title,
          content: item.content,
          image_url: item.image_url,
          likeCount: item.likeCount || 0,
        }));
        setPosts(mapped);
      } catch (err) {
        console.error("Error loading posts", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [user]);

  const handleDeletePost = async (postId: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post", err);
    }
  };

  return (
    <Tabs defaultValue="post" className="mt-6 px-6">
      <TabsList className="mx-auto space-x-80 border-b border-white/10 bg-transparent">
        <TabsTrigger value="post">Post</TabsTrigger>
        <TabsTrigger value="saved">Saved</TabsTrigger>
        <TabsTrigger value="followers">Followers</TabsTrigger>
      </TabsList>

      <TabsContent
        value="post"
      >
        {isLoading ? (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex gap-4"
            columnClassName="flex flex-col gap-4"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <SkeletonPost key={i} index={i} />
            ))}
          </Masonry>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex gap-4"
            columnClassName="flex flex-col"
          >
            {posts.map((post) => (
              <ComposerComment
                key={post.id}
                post={post}
                currentUserId={session?.user?.id ? Number(session.user.id) : undefined}
                onDelete={handleDeletePost}
              />
            ))}
          </Masonry>
        )}
      </TabsContent>

      {/* Following */}
      <TabsContent value="following" className="mt-6 mx-auto">
        {/* save ở đây */}
      </TabsContent>

      {/* Followers */}
      <TabsContent value="followers" className="mt-6 mx-auto">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img
              src="https://ui.shadcn.com/avatars/01.png"
              alt="Avatar"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">John Dofe</span>
            <span className="text-gray-500 text-sm">m@example.com</span>
          </div>
          <button className="ml-auto flex items-center border border-gray-300 rounded-md px-3 py-1 text-sm font-medium hover:bg-gray-100 transition cursor-pointer">
            Follow
          </button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
