import API from './index';

export const fetchSavedPosts = async (userId: string) => {
  const res = await API.get(`/users/${userId}/saved_posts`);
  return res.data;
};

export const savePost = async (postId: number, userId: string) => {
  const res = await API.post(`/posts/${postId}/save`, { userId });
  return res.data;
};