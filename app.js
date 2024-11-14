const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const postRouter = require('./routes/post');

// Import Post model safely
const Post = require('./models/post');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/microblogging';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');  

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

mongoose.connect(MONGODB_URI);

// Use the routers
app.use('/', indexRouter);
app.use('/', userRouter);
app.use('/', postRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
