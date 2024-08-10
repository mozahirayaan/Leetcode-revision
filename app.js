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
  origin: ['https://leetcode-revisions.vercel.app','http://localhost:5173', 'chrome-extension://fghklbodnbneniojeehofjgeeodjebhc'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};


app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1)

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};




app.post('/get-data', async (req, res) => {
  try {
    const { googleId, username, name } = req.body;
    let user = await UserModel.findOne({ username: username });

    if (!user) {
      const newUser = new UserModel({
        googleid: googleId,
        username: username,
        name: name,
        questions: []
      });
      user = await newUser.save();
    }

    const data = user.questions || []; // Ensure `questions` is an array
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.post('/delete-data', async (req, res) => {
  try {
    const username = req.body.username;
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
  const { url, category, notes, email,name, googleId } = req.body;
  console.log('Received data:', { url, category, notes, email });

  try {
    let user = await UserModel.findOne({ username: email });

    if (!user) {
      const newUser = new UserModel({
        googleid: googleId,
        username: email,
        name: name,
        questions: []
      });
      user = await newUser.save();
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


app.get('/api/auth/google', passport.authenticate('google', { scope: ["email", "profile"] }));

app.get('/api/google/callback', passport.authenticate('google', { failureRedirect: 'http://localhost:5173' }), (req, res) => {
  res.redirect('http://localhost:5173');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
