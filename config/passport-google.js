require('dotenv').config();
const passport =require("passport")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { UserModel} = require('./database');

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/api/google/callback'
}, async (accessToken, refreshToken, profile, done) => {

    let existingUser = await UserModel.findOne({ username: profile.emails[0].value });

    if (existingUser) {

        done(null, existingUser);
    } else {
        const newUser = new UserModel({
            googleid: profile.id,
            username: profile.emails[0].value,
            name : profile.displayName ,
            questions: []
            // Add other user properties as needed
        });
        await newUser.save();
        done(null, newUser);
    }
}));


passport.serializeUser((user, done) => {
    done(null, { id: user.id, name: user.name, username: user.username, questions: user.questions });
});

passport.deserializeUser(async (obj, done) => {
    try {
        const user = await UserModel.findById(obj.id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});
