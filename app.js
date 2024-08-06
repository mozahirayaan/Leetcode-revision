require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const { UserModel } = require('./config/database');
const app = express();
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URL);

const corsOptions = {
  origin: ['https://leetcode-revisions.vercel.app', 'chrome-extension://fghklbodnbneniojeehofjgeeodjebhc'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL, collectionName: "sessions" }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

require('./config/passport-google');

app.use(passport.initialize());
app.use(passport.session());

// Middleware to check authentication status
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

app.get('/', async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      res.status(200).json({ user: req.user});
    } else {
      res.status(200).json({ user: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/get-data', isAuthenticated, async (req, res) => {
  try {
    const username = req.user.username;
    const user = await UserModel.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const data = user.questions;
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/delete-data', isAuthenticated, async (req, res) => {
  try {
    const username = req.user.username;
    const user = await UserModel.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const problemSlug = req.body.slug;
    user.questions = user.questions.filter(item => item.url !== problemSlug);
    await user.save();
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/receive-data', async (req, res) => {
  const { url, category, notes, email } = req.body;
  console.log('Received data:', { url, category, notes, email });

  try {
    const user = await UserModel.findOne({ username: email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove existing question with the same URL if it exists
    user.questions = user.questions.filter(question => question.url !== url);

    // Add the new question
    const newQuestion = { url, category, notes };
    user.questions.push(newQuestion);

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: 'Data saved successfully' });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ message: 'Error saving data' });
  }
});


app.get('/auth/google', passport.authenticate('google', { scope: ["email", "profile"] }));

app.get('/google/callback', passport.authenticate('google', { failureRedirect: 'http://localhost:5000' }), (req, res) => {
  res.redirect('https://leetcode-revisions.vercel.app/');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
