const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const downloadProtection = async (req, res, next) => {
    try {
        const imageUrl = req.query.url || req.params.url;
        
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL required' });
        }

        // Tìm post chứa hình ảnh này
        const post = await prisma.posts.findFirst({
            where: {
                image_url: {
                    contains: imageUrl
                }
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Kiểm tra quyền download
        if (post.download_protected) {
            // Nếu có user đăng nhập, kiểm tra quyền
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(403).json({ 
                    error: 'Login required to download this image',
                    message: 'This image is protected from unauthorized downloads'
                });
            }

            // Kiểm tra xem user có quyền download không
            if (post.user_id !== userId && !post.allow_download) {
                return res.status(403).json({ 
                    error: 'Download not allowed',
                    message: 'You do not have permission to download this image'
                });
            }
        }

        // Thêm thông tin vào request để sử dụng ở middleware tiếp theo
        req.postInfo = post;
        next();
    } catch (error) {
        console.error('Download protection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const preventRightClick = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
};

module.exports = {
    downloadProtection,
    preventRightClick
};
