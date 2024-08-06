require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { UserModel } = require('./database'); // Adjust based on your actual file structure

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let existingUser = await UserModel.findOne({ username: profile.emails[0].value });

        if (existingUser) {
            done(null, existingUser);
        } else {
            const newUser = new UserModel({
                googleid: profile.id,
                username: profile.emails[0].value,
                name: profile.displayName,
                questions: []
            });
            await newUser.save();
            done(null, newUser);
        }
    } catch (err) {
        done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id); // Store only user ID
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserModel.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});
