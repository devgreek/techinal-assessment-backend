// This is a simple in-memory store for refresh tokens
// In a real application, you would use a database

const tokens = new Map();

const RefreshToken = {
  create: (userId, tokenId, expiry, userAgent = '', ip = '') => {
    const token = {
      userId,
      tokenId,
      expiry,
      revoked: false,
      userAgent,
      ip,
      createdAt: new Date(),
    };
    tokens.set(tokenId, token);
    return token;
  },

  findByTokenId: (tokenId) => {
    return tokens.get(tokenId);
  },

  revokeByTokenId: (tokenId) => {
    const token = tokens.get(tokenId);
    if (token) {
      token.revoked = true;
      tokens.set(tokenId, token);
    }
    return token;
  },

  delete: (tokenId) => {
    return tokens.delete(tokenId);
  },
  
  // This method revokes all tokens for a specific user
  revokeAllForUser: (userId) => {
    let count = 0;
    for (const [tokenId, token] of tokens.entries()) {
      if (token.userId === userId) {
        token.revoked = true;
        tokens.set(tokenId, token);
        count++;
      }
    }
    return count; // Return the number of tokens revoked
  }
};

module.exports = RefreshToken;
