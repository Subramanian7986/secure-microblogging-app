const express = require('express');
const router = express.Router();
const Post = require('../models/post');

// Get a specific post by ID
router.get('/post/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('author', 'username')
            .populate('comments.author', 'username'); // Populate the author's username for comments
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.render('post', { post, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
