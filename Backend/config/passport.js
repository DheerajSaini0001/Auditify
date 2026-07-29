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

  // [NEW] — Make the OAuth redirect_uri VISIBLE at boot, and shout when it's wrong.
  //
  // Google rejects a login with "Error 400: redirect_uri_mismatch" when the
  // redirect_uri we send isn't listed verbatim in the OAuth client's Authorized
  // redirect URIs — and the value we send is exactly this `callbackURL`.
  //
  // The trap: configService.getConfig() reads the PlatformConfig collection FIRST
  // and only falls back to process.env, and its initializer inserts a key only when
  // that row is MISSING — it never updates one. So a GOOGLE_CALLBACK_URL row seeded
  // once (e.g. from a developer's .env, pointing at localhost) pins production to
  // that value forever, no matter what the production .env says. Nothing logged it,
  // so the only symptom was Google's error page.
  const isProd = configService.getConfig('NODE_ENV', 'development') === 'production';
  const frontendUrl = configService.getConfig('FRONTEND_URL', 'http://localhost:5173');
  console.log(`🔑 [OAuth] Google redirect_uri = ${callbackURL}  (must match a URI registered on the OAuth client)`);
  if (isProd && /localhost|127\.0\.0\.1/i.test(callbackURL)) {
    console.warn(
      `🚨 [OAuth] NODE_ENV=production but the Google callback points at localhost (${callbackURL}).\n` +
      `   Every Google login will fail with redirect_uri_mismatch. Fix the GOOGLE_CALLBACK_URL value in the\n` +
      `   PlatformConfig collection (the DB value overrides .env), then register that exact URI in Google Cloud\n` +
      `   Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs.`
    );
  }
  if (isProd && /localhost|127\.0\.0\.1/i.test(frontendUrl)) {
    console.warn(
      `🚨 [OAuth] NODE_ENV=production but FRONTEND_URL is ${frontendUrl} — a successful login would redirect the\n` +
      `   user to localhost. Update the FRONTEND_URL row in PlatformConfig too.`
    );
  }

  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL,
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/webmasters']
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
