const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
exports.getAllComments = async (req, res) => {
    try {
        const comments = await prisma.comment.findMany();
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error });
    }
};

exports.getCommentById = async (req, res) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: Number(req.params.id) } });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comment', error });
    }
};

exports.createComment = async (req, res) => {
    try {
        const { user_id, post_id, content, parent_id } = req.body;

        const newComment = await prisma.comment.create({
            data: {
                user_id,
                post_id,
                content,
                parent_id: parent_id || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        // Tạo notification cho chủ post hoặc chủ comment cha
        let targetUserId = null;
        if (parent_id) {
            const parentComment = await prisma.comment.findUnique({ where: { id: parent_id } });
            targetUserId = parentComment?.user_id;
        } else {
            const post = await prisma.posts.findUnique({ where: { id: post_id } });
            targetUserId = post?.user_id;
        }
        if (targetUserId && targetUserId !== user_id) {
            await prisma.notification.create({
                data: {
                    user_id: targetUserId,
                    type: 'comment',
                    content: `User ${user_id} đã bình luận vào nội dung của bạn.`,
                    is_read: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }

        res.status(201).json(newComment);
    } catch (error) {
        res.status(400).json({ message: 'Error creating comment', error });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const updatedComment = await prisma.comment.update({
            where: { id: Number(req.params.id) },
            data: req.body
        });
        res.status(200).json(updatedComment);
    } catch (error) {
        res.status(400).json({ message: 'Error updating comment', error });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        await prisma.comment.delete({ where: { id: Number(req.params.id) } });
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment', error });
    }
};

exports.getCommentsByPostId = async (req, res) => {
    try {
        const post_id = Number(req.params.post_id);

        //comment gốc
        const comments = await prisma.comment.findMany({
            where: {
                post_id,
                parent_id: null
            },
            include: {
                replies: true //  (comment con)
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error });
    }
};

exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany();
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
};

exports.getNotificationsByUser = async (req, res) => {
    try {
        const user_id = Number(req.params.user_id);
        const notifications = await prisma.notification.findMany({
            where: { user_id },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
};