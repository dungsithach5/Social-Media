"use client";

import { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import { Search, Frown } from "lucide-react";
import RotatingText from './@/components/RotatingText/RotatingText';

import { fetchPosts } from "./services/Api/posts";
import { fetchBannedKeywords } from "./services/Api/bannedKeywords";

import { ComposerComment } from "./@/components/model-comment/ComposerComment";
import SkeletonPost from "./@/components/skeleton-post";
import { useAuth } from "./hooks/useAuth";
import axios from "axios";

const breakpointColumnsObj = {
  default: 6,
  1024: 2,
  640: 2,
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [bannedKeywords, setBannedKeywords] = useState<string[]>([]);
  const [violation, setViolation] = useState(false);
  const { user, session, status } = useAuth(true);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const loadBanned = async () => {
      try {
        const words = await fetchBannedKeywords();
        setBannedKeywords(words);
      } catch (err) {
        console.error("Error loading banned keywords", err);
      }
    };
    loadBanned();
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts("");
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.username || user?.name,
          title: item.title,
          content: item.content,
          image_url: item.image_url,
          tags: item.tags || [],
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

  // Extract top 5 tags based on word frequency
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const tagCount: Record<string, number> = {};

    posts.forEach((post) => {
      const allText = `${post.tags}`.toLowerCase();
      const words = allText.match(/\b\w+\b/g) || [];
      words.forEach((word) => {
        if (word.length > 3) {
          tagCount[word] = (tagCount[word] || 0) + 1;
        }
      });
    });

    const sortedTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    setPopularTags(sortedTags);
  }, [posts]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = searchInput.trim().toLowerCase();

    const foundViolation = bannedKeywords.some((word) =>
      keyword.includes(word)
    );
    if (foundViolation) {
      setViolation(true);
      setPosts([]);
      return;
    }

    setViolation(false);
    setIsLoading(true);

    setTimeout(async () => {
      try {
        const data = await fetchPosts(keyword);
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: user?.username || user?.name,
          title: item.title,
          content: item.content,
          image_url: item.image_url,
        }));
        setPosts(mapped);
      } catch (err) {
        console.error("Error fetching posts", err);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post", err);
    }
  };

  const filteredPosts = selectedTag
    ? posts.filter((post) => post.tags?.includes(selectedTag))
    : posts;

  return (
    <section>
      {/* Banner */}
      <section className="w-full overflow-hidden">
        <div className="flex h-full flex-col px-6">
          <h1 className="font-bold leading-tight text-[clamp(2.5rem,10vw,8rem)] flex flex-wrap items-center gap-2">
            Unleash your{" "}
            <RotatingText
              texts={["creative", "vivid", "pure", "real", "fluid", "cool", "artsy"]}
              mainClassName="px-2 sm:px-2 md:px-5 bg-black text-white overflow-hidden py-0.5 sm:py-1 md:py-1 justify-center rounded-xl"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2500}
            />
            energy
          </h1>

          <p className="text-lg md:text-xl text-gray-800">
            Step into a world where visuals speak and creativity knows no limits 
            <br />
            a space to express, inspire, and connect through art.
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="w-full px-6 mt-12 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="w-1/3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                name="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                className="w-full p-3 px-4 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2C343A]"
              />
              <button
                type="submit"
                className="absolute h-10 w-10 bg-black rounded-full flex justify-center items-center top-1/2 right-1 -translate-y-1/2 text-white cursor-pointer"
              >
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* Popular Tags (dynamic) */}
          <div className="flex gap-2 w-auto">
            <label className="text-sm">Popular Tags:</label>
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-4 py-2 rounded-full border text-sm font-medium shadow-sm transition-colors
                  ${tag === selectedTag
                    ? "bg-black text-white border-black"
                    : "bg-white text-black hover:bg-black hover:text-white border-gray-300"}`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Sort UI (placeholder) */}
          <div className="w-auto">
            <select className="p-2 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C343A]">
              <option value="popular">Popular</option>
              <option value="following">Following</option>
            </select>
          </div>
        </div>

        {/* Selected Tag Notice */}
        {selectedTag && (
          <div className="px-2 text-sm text-gray-600">
            Showing results for tag: <span className="font-semibold text-black">#{selectedTag}</span>
          </div>
        )}
      </section>

      {/* Posts */}
      <section className="px-6 mt-6 pb-20">
        {violation ? (
          <div className="mt-12 text-center w-full flex justify-center items-center">
            <div className="flex flex-col justify-center items-center space-y-6">
              <Frown className="text-gray-400" size={120} />
              <div>
                The topic you are looking for violates our <strong>Community Guidelines</strong>, 
                <br />so we are currently unable to display the search results.
              </div>
            </div>
          </div>
        ) : isLoading ? (
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
            {filteredPosts.map((post) => (
              <ComposerComment
                key={post.id}
                post={post}
                currentUserId={session?.user?.id ? Number(session.user.id) : undefined}
                onDelete={handleDeletePost}
                relatedPosts={filteredPosts.filter((p) => p.id !== post.id)}
              />
            ))}
          </Masonry>
        )}
      </section>
    </section>
  );
}
