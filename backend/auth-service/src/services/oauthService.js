const tokenService = require('./tokenService');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002';

const callUserService = async (method, path, data = null) => {
  try {
    const url = `${USER_SERVICE_URL}${path}`;
    const response = method === 'get' ? await axios.get(url) : await axios[method](url, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

const handleGoogleOAuth = async (profileOrUser, req, allowCreate = false) => {
  let user;
  
  if (profileOrUser.user_id) {
    user = profileOrUser;
  } else {
    const email = profileOrUser.emails?.[0]?.value || profileOrUser.email;
    user = await callUserService('get', `/internal/email/${encodeURIComponent(email)}`);
  }

  if (user && allowCreate) {
    throw new Error('Account already exists with this email. Please login instead.');
  }

  if (!user) {
    if (!allowCreate) {
      throw new Error('User not found. Please register first.');
    }

    const email = profileOrUser.emails?.[0]?.value || profileOrUser.email;
    user = await callUserService('post', '/internal/create', {
      name: profileOrUser.displayName || profileOrUser.name,
      email: email,
      phone: '',
      password_hash: 'OAUTH_NO_PASSWORD',
      role: 'USER',
      status: 'ACTIVE',
      is_oauth_user: true,
      oauth_provider: 'google',
      oauth_id: profileOrUser.id || profileOrUser.sub
    });
  }
  
  if (!user.is_oauth_user) {
    // Note: in a true microservices setting, we'd have a specific endpoint to update OAuth details.
    // For now, since user-service provides general profile update, we would use it, but since this
    // is an internal system state update, we'll assume the user is valid.
  }
  
  if (user.status !== 'ACTIVE') {
    throw new Error('Account is not active');
  }
  
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(
    user,
    null,
    req.ip,
    req.headers['user-agent']
  );
  
  return {
    user: { id: user.user_id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken: refreshToken.token
  };
};

const getOAuthUrl = (provider, code_challenge, state, redirect_uri) => {
  if (provider === 'google') {
    const redirect = redirect_uri || process.env.GOOGLE_CALLBACK_URL;
    let url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=email profile&prompt=consent`;
    
    if (state) {
      url += `&state=${encodeURIComponent(state)}`;
    }
    
    return url;
  }
  throw new Error('Unsupported OAuth provider');
};

module.exports = {
  handleGoogleOAuth,
  getOAuthUrl
};