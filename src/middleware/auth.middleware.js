const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    // Get the right key for verification based on algorithm
    const verifyKey = config.jwt.algorithm === 'RS256' && config.jwt.publicKey
      ? config.jwt.publicKey
      : config.jwt.accessSecret;
      
    const decoded = jwt.verify(token, verifyKey);
    req.userId = decoded.sub;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'TOKEN_INVALID',
        details: error.message
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        message: 'Token not active',
        error: 'TOKEN_NOT_ACTIVE',
        date: error.date
      });
    }
    return res.status(401).json({ 
      message: 'Unauthorized',
      error: 'AUTH_FAILED'
    });
  }
};

module.exports = {
  verifyToken
};
