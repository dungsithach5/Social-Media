const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ColorThief = require('colorthief');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

async function getDominantColor(imageUrl) {
  try {
    // Kiểm tra URL hợp lệ
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error("URL không hợp lệ:", imageUrl);
      return null;
    }

    const response = await fetch(imageUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Kiểm tra response status
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} - ${response.statusText} for URL: ${imageUrl}`);
      return null;
    }

    // Kiểm tra content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error(`Invalid content type: ${contentType} for URL: ${imageUrl}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    
    // Kiểm tra buffer có dữ liệu không
    if (!buffer || buffer.byteLength === 0) {
      console.error("Empty buffer received for URL:", imageUrl);
      return null;
    }

    const colorResult = await ColorThief.getColor(Buffer.from(buffer));
    
    // Kiểm tra kết quả từ ColorThief
    if (!colorResult || !Array.isArray(colorResult) || colorResult.length !== 3) {
      console.error("Invalid color result from ColorThief for URL:", imageUrl);
      return null;
    }

    const [r, g, b] = colorResult;
    
    // Validate RGB values
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      console.error("Invalid RGB values:", { r, g, b });
      return null;
    }

    const hexColor = rgbToHex(r, g, b);
    console.log(`Successfully extracted dominant color: ${hexColor} from ${imageUrl}`);
    return hexColor;
    
  } catch (err) {
    console.error("Error dominant color:", err.message);
    return null;
  }
}

exports.getAllPosts = async (req, res) => {
  try {
    const { search, user_id } = req.query;
    const keyword = typeof search === 'string' ? search : '';

    let where = {};

    // Nếu có user_id, filter theo user_id
    if (user_id) {
      where.user_id = Number(user_id);
    }

    // Nếu có search keyword, thêm điều kiện search
    if (keyword) {
      const searchCondition = {
        OR: [
          { user_name: { contains: keyword } },
          { title: { contains: keyword } },
          { content: { contains: keyword } },
        ],
      };
      
      // Combine với user_id nếu có
      if (user_id) {
        where = {
          ...where,
          ...searchCondition
        };
      } else {
        where = searchCondition;
      }
    }

    const posts = await prisma.posts.findMany({
      where,
      select: {
        id: true,
        user_id: true,
        user_name: true,
        title: true,
        content: true,
        image_url: true,
        dominant_color: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const postsWithTags = await Promise.all(
      posts.map(async post => {
        const postTags = await prisma.post_tags.findMany({
          where: { post_id: post.id },
          include: {
            tag: true,
          },
        });

        const tags = postTags.map(pt => pt.tag.name);
        return { ...post, tags };
      })
    );

    res.status(200).json(postsWithTags);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      message: 'Error fetching posts',
      error: error.message || 'Unknown error',
    });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await prisma.posts.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        postTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const tags = post.postTags.map(pt => pt.tag.name);
    const postWithTags = {
      ...post,
      tags,
    };
    delete postWithTags.postTags;

    res.status(200).json(postWithTags);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post', error });
  }
};

exports.createPost = async (req, res) => {
  try {
    const {
      user_id,
      user_name,
      title,
      content,
      image_url,
      tags = [],
      // Copyright protection fields
      license_type,
      license_description,
      watermark_enabled,
      watermark_text,
      watermark_position,
      download_protected,
      allow_download,
      copyright_owner_id,
      copyright_year
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: 'user_id is required'
      });
    }

    const dominantColor = image_url ? await getDominantColor(image_url) : null;

    if (!user_name || !title || !content) {
      return res.status(400).json({
        message: 'Missing required fields: user_name, title, content',
        received: { user_name, title, content }
      });
    }

    const user = await prisma.users.findUnique({
      where: { email: user_name }
    });

    if (!user) {
      return res.status(400).json({
        message: 'User not found with email: ' + user_name,
        suggestion: 'Please make sure the user is registered in the system'
      });
    }

    const newPost = await prisma.posts.create({
      data: {
        user_id: user.id,
        user_name: user.username || user.email,
        title,
        content,
        image_url,
        dominant_color: dominantColor,
        // Copyright protection fields
        license_type: license_type || null,
        license_description: license_description || null,
        watermark_enabled: watermark_enabled || false,
        watermark_text: watermark_text || null,
        watermark_position: watermark_position || null,
        download_protected: download_protected || false,
        allow_download: allow_download !== undefined ? allow_download : true,
        copyright_owner_id: copyright_owner_id || null,
        copyright_year: copyright_year || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        postTags: {
          create: tags.map(tag => ({
            tag: {
              connectOrCreate: {
                where: { name: tag },
                create: { name: tag },
              },
            },
          })),
        },
      },
      include: {
        postTags: {
          include: { tag: true },
        },
      },
    });

    res.status(201).json(newPost);
  } catch (error) {
    res.status(400).json({
      message: 'Error creating post',
      error: error.message,
      details: error.code ? `Database error: ${error.code}` : 'Unknown error'
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { tags, image_url, ...postData } = req.body;
    const postId = Number(req.params.id);

    const existingPost = await prisma.posts.findUnique({
      where: { id: postId }
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let dominantColor = existingPost.dominant_color;

    if (image_url && image_url !== existingPost.image_url) {
      dominantColor = await getDominantColor(image_url);
    }

    const updatedPost = await prisma.posts.update({
      where: { id: postId },
      data: {
        ...postData,
        image_url,
        dominant_color: dominantColor,
        updatedAt: new Date(),
      }
    });

    if (tags && Array.isArray(tags)) {
      await prisma.post_tags.deleteMany({
        where: { post_id: postId }
      });

      for (const tagName of tags) {
        await prisma.post_tags.create({
          data: {
            post_id: postId,
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              },
            },
          },
        });
      }
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: 'Error updating post', error });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const deletedPost = await prisma.posts.delete({
      where: { id: Number(req.params.id) }
    });
    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Error deleting post', error });
  }
};

exports.getColors = async (req, res) => {
  try {
    const colors = await prisma.posts.findMany({
      select: { dominant_color: true },
      where: { dominant_color: { not: null } },
    });

    const colorList = colors.map(c => c.dominant_color.toLowerCase());
    res.status(200).json(colorList);
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ message: 'Failed to fetch colors', error });
  }
};


exports.getPostsByColor = async (req, res) => {
  try {
    const { color } = req.query;
    if (!color) return res.status(400).json({ message: "Color is required" });

    const posts = await prisma.posts.findMany({
      where: { dominant_color: color.toLowerCase() },
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error('Error searching posts by color:', error);
    res.status(500).json({ message: 'Error searching posts', error });
  }
};