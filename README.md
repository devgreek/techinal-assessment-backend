# Express Minimal Application with JWT Authentication

This is an Express application with a secure JWT-based authentication system. The application implements a comprehensive token-based authentication approach with access and refresh tokens.

## Project Structure

```
express-minimal
├── src
│   ├── app.js                # Entry point of the application
│   ├── config
│   │   └── auth.config.js    # Authentication configuration
│   ├── controllers
│   │   └── auth.controller.js  # Authentication logic
│   ├── middleware
│   │   └── auth.middleware.js  # Token verification middleware
│   ├── models
│   │   ├── refreshToken.model.js  # Refresh token storage
│   │   └── user.model.js     # User data management
│   └── routes
│       ├── auth.routes.js    # Authentication routes
│       └── index.js          # Route definitions
├── package.json              # npm configuration file
├── .gitignore                # Files to ignore in git
└── README.md                 # Project documentation
```

## Getting Started

To get started with this project, follow these steps:

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd express-minimal
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the application:**
   ```
   npm start
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`.

5. **Set up environment variables (optional):**
   Create a `.env` file in the root directory with the following variables:
   ```
   # JWT Configuration
   JWT_ALGORITHM=HS256                           # Algorithm for JWT signing: 'HS256' or 'RS256'
   JWT_ACCESS_SECRET=your_strong_access_secret   # Secret key for access tokens (used with HS256)
   JWT_REFRESH_SECRET=your_strong_refresh_secret # Secret key for refresh tokens (used with HS256)
   
   # For RS256 support (optional)
   JWT_PRIVATE_KEY=path/to/private.key           # Path to RSA private key file
   JWT_PUBLIC_KEY=path/to/public.key             # Path to RSA public key file
   
   # Token Expiration (optional)
   ACCESS_TOKEN_EXPIRY=1800                      # 30 minutes in seconds
   REFRESH_TOKEN_EXPIRY=604800                   # 7 days in seconds
   
   # Server Configuration
   PORT=3000                                     # Port for Express server
   NODE_ENV=development                          # Environment: 'development' or 'production'
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3001             # Origin allowed for CORS
   
   # Cookie Configuration (optional)
   COOKIE_SECURE=false                           # Set to true in production
   COOKIE_HTTP_ONLY=true                         # Prevent JavaScript access
   COOKIE_SAME_SITE=strict                       # CSRF protection
   ```

## Usage Examples

### Authentication Flow

```javascript
// Login example - Frontend code
async function login(username, password) {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    credentials: 'include',  // Important for cookies
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  return await response.json();
}

// Access protected resource
async function getProtectedResource() {
  const response = await fetch('http://localhost:3000/protected', {
    credentials: 'include'  // Send the httpOnly cookies
  });
  
  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshResult = await refreshToken();
    if (refreshResult.success) {
      return getProtectedResource(); // Try again with new token
    } else {
      // Redirect to login
    }
  }
  
  return await response.json();
}

// Refresh token
async function refreshToken() {
  try {
    const response = await fetch('http://localhost:3000/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

// Logout
async function logout() {
  await fetch('http://localhost:3000/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
}
```

## JWT Authentication Implementation

This application implements a secure JWT-based authentication system with the following features:

### Token Configuration

- **Signing Algorithm**: 
  - HMAC SHA-256 (HS256) by default
  - RS-256 support available by providing public/private keys

- **Token Expiration**: 
  - Access token: 30 minutes (1800 seconds)
  - Refresh token: 7 days (604,800 seconds)

### Refresh Token Security

- **Token Storage**: Refresh tokens are stored server-side with comprehensive metadata:
  - User ID: Links token to specific user
  - Token ID (jti): Unique identifier for the token
  - Expiry time: When the token becomes invalid
  - Revoked flag: Indicates if token has been invalidated
  - User agent: Browser/client information (optional)
  - IP address: Client IP address (optional)

- **Token Rotation**: 
  - On every `/auth/refresh` call, the old refresh token is deleted and a new one is issued
  - This provides protection against token theft and replay attacks

### Error Handling

- **401 Unauthorized**: Returned when:
  - No token is provided
  - Token is invalid (malformed, incorrect signature)
  - Token has expired
  
- **403 Forbidden**: Returned when:
  - Refresh token reuse is detected (indicates potential token theft)
  - When reuse is detected, all user sessions are terminated as a security measure

### Cookie-Based Token Storage

- **HttpOnly Cookies**: Tokens are stored in HttpOnly cookies to prevent JavaScript access
- **Secure Flag**: Enabled in production to ensure tokens are only sent over HTTPS
- **SameSite Policy**: Set to 'strict' to prevent CSRF attacks

### CORS Configuration

- Cross-Origin Resource Sharing is configured to allow requests from specified origins
- Credentials mode is enabled to allow cookie-based authentication across origins

## Environment Variables

The following environment variables can be set to customize the JWT authentication:

- `JWT_ALGORITHM`: Signing algorithm ('HS256' or 'RS256')
- `JWT_ACCESS_SECRET`: Secret key for access tokens when using HS256
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens when using HS256
- `JWT_PRIVATE_KEY`: Private key for signing when using RS256
- `JWT_PUBLIC_KEY`: Public key for verification when using RS256
- `PORT`: Port to run the server on (defaults to 3000)
- `NODE_ENV`: Environment ('production' or 'development')

## Authentication API Endpoints

- **POST /auth/login**: Authenticate user and issue tokens
- **POST /auth/refresh**: Refresh access token using refresh token
- **POST /auth/logout**: Invalidate the current refresh token

## Additional Information

- You can expand the routes in `src/routes/index.js` to add more functionality to your application.
- To protect routes, use the `verifyToken` middleware from `auth.middleware.js`.
- For production use, it's recommended to store refresh tokens in a persistent database instead of memory.