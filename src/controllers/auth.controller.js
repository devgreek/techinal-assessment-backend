const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const config = require('../config/auth.config');

function generateTokens(userId, userAgent = '', ip = '') {
  const accessTokenId = uuidv4();
  const refreshTokenId = uuidv4();
  
  // Current timestamp in seconds
  const now = Math.floor(Date.now() / 1000);
  
  // Determine which algorithm and secret/key to use
  const algorithm = config.jwt.algorithm;
  
  // Get the right secret/key based on algorithm
  const accessTokenSecret = algorithm === 'RS256' && config.jwt.privateKey 
    ? config.jwt.privateKey 
    : config.jwt.accessSecret;
    
  const refreshTokenSecret = algorithm === 'RS256' && config.jwt.privateKey 
    ? config.jwt.privateKey 
    : config.jwt.refreshSecret;
  
  // Generate access token
  const accessToken = jwt.sign(
    { 
      sub: userId, 
      jti: accessTokenId,
      iat: now
    }, 
    accessTokenSecret, 
    { 
      algorithm,
      expiresIn: config.jwt.accessExpiration 
    }
  );
  
  // Generate refresh token
  const refreshToken = jwt.sign(
    { 
      sub: userId, 
      jti: refreshTokenId,
      iat: now
    }, 
    refreshTokenSecret, 
    { 
      algorithm,
      expiresIn: config.jwt.refreshExpiration 
    }
  );
  
  // Store refresh token with user agent and IP info
  const refreshTokenExpiry = now + config.jwt.refreshExpiration;
  RefreshToken.create(userId, refreshTokenId, refreshTokenExpiry, userAgent, ip);
  
  return {
    accessToken,
    refreshToken,
    accessTokenId,
    refreshTokenId
  };
}

function setTokenCookies(res, tokens) {
  // Set access token as cookie
  res.cookie('accessToken', tokens.accessToken, {
    ...config.cookie,
    maxAge: config.jwt.accessExpiration * 1000, // Convert to milliseconds
  });
  
  // Set refresh token as cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    ...config.cookie,
    path: '/auth/refresh', // Restrict refresh token to refresh endpoint
    maxAge: config.jwt.refreshExpiration * 1000, // Convert to milliseconds
  });
}

function clearTokenCookies(res) {
  res.clearCookie('accessToken', { ...config.cookie });
  res.clearCookie('refreshToken', { ...config.cookie, path: '/auth/refresh' });
}

const AuthController = {
  login: (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const user = User.findByCredentials(username, password);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Get user agent and IP for security tracking
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    
    // Generate tokens with user agent and IP info
    const tokens = generateTokens(user.id, userAgent, ip);
    
    // Set cookies
    setTokenCookies(res, tokens);
    
    // Return user info (without sensitive data)
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      },
      message: 'Login successful'
    });
  },
  
  refresh: (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }
    
    try {
      // Get the right key for verification based on algorithm
      const verifyKey = config.jwt.algorithm === 'RS256' && config.jwt.publicKey
        ? config.jwt.publicKey
        : config.jwt.refreshSecret;
        
      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, verifyKey);
      const userId = decoded.sub;
      const tokenId = decoded.jti;
      
      // Check if the token exists in the store
      const storedToken = RefreshToken.findByTokenId(tokenId);
      
      if (!storedToken) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      
      if (storedToken.revoked) {
        // Token reuse detected! This is a security concern
        console.warn(`Token reuse detected for user ${storedToken.userId} from IP ${req.ip}`);
        
        // Revoke all refresh tokens for this user (security measure)
        const revokedCount = RefreshToken.revokeAllForUser(storedToken.userId);
        console.warn(`Revoked ${revokedCount} tokens for user ${storedToken.userId}`);
        
        // Force user to login again
        clearTokenCookies(res);
        
        // Return 403 Forbidden status
        return res.status(403).json({ 
          message: 'Security violation: Token reuse detected. All sessions have been terminated.'
        });
      }
      
      // Get user agent and IP for security tracking
      const userAgent = req.get('User-Agent') || '';
      const ip = req.ip || req.connection.remoteAddress || '';
      
      // Delete the old token (rotation)
      RefreshToken.delete(tokenId);
      
      // Generate new tokens with updated user agent and IP
      const tokens = generateTokens(userId, userAgent, ip);
      
      // Set cookies
      setTokenCookies(res, tokens);
      
      res.status(200).json({ message: 'Token refreshed successfully' });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Refresh token expired' });
      }
      
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  },
  
  logout: (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      try {
        // Get the right key for verification based on algorithm
        const verifyKey = config.jwt.algorithm === 'RS256' && config.jwt.publicKey
          ? config.jwt.publicKey
          : config.jwt.refreshSecret;
        
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, verifyKey, {
          ignoreExpiration: true // We want to delete it even if expired
        });
        
        // Delete token from store
        RefreshToken.delete(decoded.jti);
      } catch (error) {
        // Ignore errors, we're logging out anyway
      }
    }
    
    // Clear cookies
    clearTokenCookies(res);
    
    res.status(200).json({ message: 'Logged out successfully' });
  }
};

module.exports = AuthController;
