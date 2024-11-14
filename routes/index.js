const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const multer = require('multer');

// Ensure user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Render home page
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id).populate('following');
        const followingIds = user.following.map(u => u._id);

        const posts = await Post.find({ 
            $or: [
                { author: { $in: followingIds } }, 
                { author: req.session.user._id }
            ]
        })
        .populate('author', 'username') // Populate the author's username in posts
        .populate({
            path: 'comments.author',
            select: 'username' // Populate the username of the author of each comment
        })
        .sort({ createdAt: -1 });

        res.render('home', { posts, user });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// Handle new post with file upload
router.post('/post', isAuthenticated, upload.single('media'), async (req, res) => {
    try {
        const newPost = new Post({
            content: req.body.content,
            author: req.session.user._id,
            mediaFile: req.file ? req.file.filename : null,
            mediaType: req.file ? req.file.mimetype : null
        });
        await newPost.save();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// Follow a user
router.post('/follow/:id', isAuthenticated, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.session.user._id);

        if (!currentUser.following.includes(userToFollow._id)) {
            currentUser.following.push(userToFollow._id);
            userToFollow.followers.push(currentUser._id);
            await currentUser.save();
            await userToFollow.save();
        }

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// Handle new comment on a post
router.post('/post/:id/comment', isAuthenticated, async (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;

    try {
        const post = await Post.findById(postId).populate('comments.author');
        if (post) {
            post.comments.push({
                content,
                author: req.session.user._id,
                createdAt: new Date()
            });
            await post.save();
            res.redirect(`/post/${postId}`);
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// Search users
router.get('/search', isAuthenticated, async (req, res) => {
    const searchQuery = req.query.query;

    try {
        // Fetch the logged-in user and their following list
        const currentUser = await User.findById(req.session.user._id).populate('following');
         // Ensure currentUser.following is an array
         if (!Array.isArray(currentUser.following)) {
            currentUser.following = [];
        }

        // Search users
        const users = await User.find({
            username: new RegExp(searchQuery, 'i') // Case-insensitive search
        });

        res.render('searchResults', { 
            users, 
            searchQuery, 
            currentUser 
        });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

module.exports = router;
