module.exports = {
  jwt: {
    algorithm: process.env.JWT_ALGORITHM || 'HS256', // 'HS256' or 'RS256'
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    // For RS256, use these environment variables to provide private and public keys
    privateKey: process.env.JWT_PRIVATE_KEY || null,
    publicKey: process.env.JWT_PUBLIC_KEY || null, 
    accessExpiration: 30 * 60, // 30 minutes in seconds (1800s)
    refreshExpiration: 7 * 24 * 60 * 60, // 7 days in seconds (604,800s)
  },
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  }
};
