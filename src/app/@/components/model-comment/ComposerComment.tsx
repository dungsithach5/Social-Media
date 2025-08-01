"use client"

import { useState, useEffect, useRef } from "react"
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"

import { useAuth } from "../../../hooks/useAuth"
import DropdownMenuEllipsis from "../dropdown-ellipsis"
import HoverCardUser from "../hover-card-user"
import LikeButton from "./like-button"
import BookmarkButton from "./bookmark-button"
import { savePost } from "../../../services/Api/saved-post"
import ColorPalette from "./color-palette"
import EmojiPickerPopover from "./emoji-picker-popover"
import RelatedPosts from "./related-post"
import { ZoomImage } from '../zoom-image'
import { Label } from "../ui/label"
import Link from 'next/link'

type Comment = {
  id: number;
  avatarUrl: string;
  name: string;
  username: string;
  content: string;
};

type ComposerCommentProps = {
  post: any;
  currentUserId?: number;
  onDelete?: (id: number) => void;
  relatedPosts?: any[];
};

export function ComposerComment({ post, currentUserId, onDelete, relatedPosts = [] }: ComposerCommentProps) {
  const [currentPost, setCurrentPost] = useState(post)
  const [loading, setLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dialogContentRef = useRef<HTMLDivElement>(null)

  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [bookmarked, setBookmarked] = useState(false)
  const { session, user } = useAuth(true)

  const googleUser = session?.user
  const userName = googleUser?.name || 'Unknown User'
  const userEmail = googleUser?.email || ''
  const userAvatar = googleUser?.image || '/img/user.png'

  const addEmoji = (emojiData: any) => {
    setComment((prev) => prev + emojiData.emoji)
  }

  const isOwner = post.session?.user?.id === currentUserId

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (liked) {
      setLiked(false)
      setLikeCount((prev: number) => prev - 1)
    } else {
      setLiked(true)
      setLikeCount((prev: number) => prev + 1)
    }
  }

  const handleCommentSubmit = () => {
    if (!comment.trim()) return

    const newComment: Comment = {
      id: Date.now(),
      avatarUrl: userAvatar,
      name: userName,
      username: userEmail,
      content: comment.trim(),
    }

    setComments([newComment, ...comments])
    setComment('')
  }

  useEffect(() => {
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [currentPost])

  useEffect(() => {
    setCurrentPost(post)
    setLikeCount(post.likeCount || 0)
    setLiked(false)
    setBookmarked(false)
    setComments([])
  }, [post])

  const handleSelectRelatedPost = (newPost: any) => {
    setLoading(true)
    setTimeout(() => {
      setCurrentPost(newPost)
      setLikeCount(newPost.likeCount || 0)
      setLiked(false)
      setBookmarked(false)
      setComments([])
      setLoading(false)
    }, 1000)
  }

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) return;

    const postId = currentPost.id;
    const userId = user.id;

    try {
      await savePost(postId, userId);
      setBookmarked((prev) => !prev);
    } catch (err) {
      console.error("Error saving post:", err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div key={currentPost.id} className="mb-4 break-inside-avoid cursor-pointer">
          <div className="mx-auto">
            <div className="relative group cursor-pointer">
              <img
                src={currentPost.image_url}
                alt="Post"
                className="w-full rounded-sm object-cover"
              />
              <div
                className={`absolute inset-0 bg-black/30 rounded-lg transition-opacity duration-300 flex items-end p-4
                  ${isDropdownOpen ? "opacity-100" : "group-hover:opacity-100 opacity-0"}`}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuEllipsis
                    imageUrl={currentPost.image_url}
                    fileName="downloaded-image.jpg"
                    onOpenChange={(open) => setIsDropdownOpen(open)}
                    isOwner={isOwner}
                    onDelete={onDelete}
                    postId={currentPost.id}
                  />
                </div>

                <div className="w-full flex items-center justify-between gap-2 z-0">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white"
                    />
                    <strong className="text-white">{userName}</strong>
                  </Link>

                  <div className="flex items-center gap-4 text-white text-sm">
                    <LikeButton
                      liked={liked}
                      likeCount={likeCount}
                      onToggle={handleLikeToggle}
                    />

                    <BookmarkButton
                      bookmarked={bookmarked}
                      onToggle={handleBookmarkToggle}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent 
        ref={dialogContentRef}
        className="sm:max-w-7xl flex flex-col overflow-x-hidden break-words"
      >
        {loading ? (
          <div className="flex justify-center items-center h-[650px]">
            <svg
              className="animate-spin h-10 w-10 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2 w-full">
              <DialogHeader className="max-w-3xl">
                <DialogTitle className="flex items-center gap-3">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold">{userName}</p>
                  </div>
                </DialogTitle>
                <div className="flex flex-col text-left">
                  <p className="text-xl font-semibold">{currentPost.title}</p>
                  <p className="text-sm">{currentPost.content}</p>
                </div>
                <div className="relative h-[650px] bg-gray-100 flex items-center justify-center">
                  <img
                    src={currentPost.image_url}
                    alt="Post"
                    className="object-contain h-full"
                  />
                </div>
              </DialogHeader>
            </div>

            <div className="md:w-1/2 w-full flex flex-col gap-2 px-2">
              <div className="flex items-center justify-between">
                <ColorPalette imageUrl={currentPost.image_url} />

                <div className="flex items-center gap-2">
                  <LikeButton
                    liked={liked}
                    likeCount={likeCount}
                    onToggle={handleLikeToggle}
                  />

                  <BookmarkButton
                    bookmarked={bookmarked}
                    onToggle={handleBookmarkToggle}
                  />
                </div>
              </div>

              <Label>
                <p className="text-xl font-semibold">Feedback</p>
              </Label>

              <div className="relative w-full">
                <EmojiPickerPopover onSelect={addEmoji} />

                <textarea
                  id="comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your comment..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <button
                  onClick={handleCommentSubmit}
                  className="absolute bottom-3 right-3 bg-black text-white p-2 rounded-full hover:bg-gray-800 transition"
                  title="Post Comment"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                {comments.map(({ id, avatarUrl, name, username, content }) => (
                  <div key={id} className="flex items-start gap-3">
                    <HoverCardUser avatarUrl={avatarUrl} name={name} username={username} />
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                    </div>
                  </div>
                ))}
              </div>
              {Array.isArray(currentPost.tags) && currentPost.tags.length > 0 && (
                <div className="mt-6">
                  <Label className="block mb-2 text-sm font-semibold text-gray-700">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {currentPost.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {relatedPosts.length > 0 && (
          <RelatedPosts
            relatedPosts={relatedPosts}
            currentUserId={currentUserId}
            onDelete={onDelete}
            userAvatar={userAvatar}
            userName={userName}
            liked={liked}
            likeCount={likeCount}
            handleLikeToggle={handleLikeToggle}
            bookmarked={bookmarked}
            setBookmarked={setBookmarked}
            isOwner={isOwner}
            onSelectPost={handleSelectRelatedPost}
            currentPostId={currentPost.id}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
