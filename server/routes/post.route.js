const express = require('express');
const router = express.Router();

const {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    savePost,
} = require('../controllers/post.controller');

router
    .route('/')
    .get(getAllPosts)
    .post(createPost);

router
    .route('/:id')
    .get(getPostById)
    .put(updatePost)
    .delete(deletePost);

router
    .route('/:id/save')
    .post(savePost);

module.exports = router;
