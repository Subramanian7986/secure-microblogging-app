const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Render login page
router.get('/login', (req, res) => {
    res.render('login', { message: req.query.message || '' });
});

// Handle login form submission
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect('/login?message=User not found.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.redirect('/login?message=Incorrect password.');
        }

        req.session.user = user;
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.redirect('/login?message=An error occurred. Please try again.');
    }
});

// Render registration page
router.get('/register', (req, res) => {
    res.render('register', { message: req.query.message || '' });
});

// Handle registration form submission
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    try {
        if (password !== confirmPassword) {
            return res.redirect('/register?message=Passwords do not match.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.redirect('/register?message=An error occurred. Please try again.');
    }
});

// Handle logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});

module.exports = router;
