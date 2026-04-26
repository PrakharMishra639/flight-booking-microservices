const express = require('express');
const router = express.Router();
const oauthService = require('../services/oauthService');
const { setTokensCookies } = require('../controllers/authController');

router.post('/google/token', async (req, res, next) => {
  try {
    const { code, code_verifier, redirect_uri, state } = req.body;
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri || process.env.GOOGLE_CALLBACK_URL
    );
    const { tokens } = await client.getToken({
      code,
      redirect_uri: redirect_uri || process.env.GOOGLE_CALLBACK_URL
    });
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const allowCreate = state === 'register';
    const result = await oauthService.handleGoogleOAuth({
      id: payload.sub,
      displayName: payload.name,
      emails: [{ value: payload.email }]
    }, req, allowCreate);
    
    // We can't import setTokensCookies directly because it's tightly coupled in controller,
    // let's do it manually inline or export it correctly. Just setting cookies manually:
    res.cookie('accessToken', result.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/auth' });
    
    const tokenService = require('../services/tokenService');
    res.json({ ...result, accessTokenExpiresAt: tokenService.getAccessTokenExpiry() });
  } catch (error) {
    next(error);
  }
});

router.get('/url/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const { code_challenge, state, redirect_uri } = req.query;
    const url = oauthService.getOAuthUrl(provider, code_challenge, state, redirect_uri);
    res.json({ url });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;