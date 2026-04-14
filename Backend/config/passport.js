import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import configService from '../services/configService.js';

export default function(passport) {
  const clientID = configService.getConfig('GOOGLE_CLIENT_ID');
  const clientSecret = configService.getConfig('GOOGLE_CLIENT_SECRET');
  const callbackURL = configService.getConfig('GOOGLE_CALLBACK_URL', 'http://localhost:2000/api/auth/google/callback');

  if (!clientID || !clientSecret) {
    console.warn('⚠️ Google OAuth credentials missing. Google login will be disabled.');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL,
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/webmasters.readonly']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        // Update tokens on each login
        user.googleAccessToken  = accessToken;
        user.googleRefreshToken = refreshToken || user.googleRefreshToken;
        user.avatar             = profile.photos?.[0]?.value || user.avatar;
        await user.save();
        return done(null, user);
      }
      // Check if email already exists as a local account
      user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
      if (user && user.authProvider === 'local') {
        // Merge: link Google account to existing local account
        user.googleId           = profile.id;
        user.authProvider       = 'google';
        user.googleAccessToken  = accessToken;
        user.googleRefreshToken = refreshToken;
        user.avatar             = profile.photos?.[0]?.value;
        user.isEmailVerified    = true; // Google verifies email
        await user.save();
        return done(null, user);
      }
      // New user via Google
      const newUser = await User.create({
        name:                profile.displayName,
        email:               profile.emails[0].value.toLowerCase(),
        authProvider:        'google',
        googleId:            profile.id,
        googleAccessToken:   accessToken,
        googleRefreshToken:  refreshToken,
        avatar:              profile.photos?.[0]?.value,
        isEmailVerified:     true
      });
      return done(null, newUser);
    } catch (err) {
      return done(err, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      done(null, await User.findById(id));
    } catch (err) {
      done(err, null);
    }
  });
}
