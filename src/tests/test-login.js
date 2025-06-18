#!/usr/bin/env node

const fetch = require('node-fetch');

/**
 * Comprehensive test script for authentication endpoints
 * Tests: login, refresh token, and logout functionality
 */

// Store cookies between requests
let cookies = [];

/**
 * Parse and store cookies from response headers
 */
function parseCookies(response) {
  const rawCookies = response.headers.raw()['set-cookie'];
  if (rawCookies) {
    cookies = rawCookies.map(entry => entry.split(';')[0]);
    console.log('Received cookies:', cookies.map(c => c.split('=')[0]).join(', '));
  }
  return cookies;
}

/**
 * Helper to make authenticated requests with stored cookies
 */
async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  if (cookies.length > 0) {
    headers['Cookie'] = cookies.join('; ');
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Update our stored cookies if new ones are received
  parseCookies(response);
  
  return response;
}

/**
 * Test the login endpoint
 */
async function testLoginEndpoint() {
  console.log('\n====== TESTING LOGIN ENDPOINT ======');
  
  try {
    const response = await makeRequest('http://localhost:5000/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response body:', data);
      
      if (response.status === 200) {
        console.log('✅ Login successful!');
        return true;
      } else {
        console.log('❌ Login failed!');
        return false;
      }
    } else {
      const text = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', text);
      console.log('❌ Login failed!');
      return false;
    }
  } catch (error) {
    console.error('Error testing login endpoint:', error.message);
    console.log('❌ Login failed!');
    return false;
  }
}

/**
 * Test the refresh token endpoint
 */
async function testRefreshTokenEndpoint() {
  console.log('\n====== TESTING REFRESH TOKEN ENDPOINT ======');
  
  try {
    const response = await makeRequest('http://localhost:5000/auth/refresh', {
      method: 'POST'
    });

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response body:', data);
      
      if (response.status === 200) {
        console.log('✅ Token refresh successful!');
        return true;
      } else {
        console.log('❌ Token refresh failed!');
        return false;
      }
    } else {
      const text = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', text);
      console.log('❌ Token refresh failed!');
      return false;
    }
  } catch (error) {
    console.error('Error testing refresh token endpoint:', error.message);
    console.log('❌ Token refresh failed!');
    return false;
  }
}

/**
 * Test the logout endpoint
 */
async function testLogoutEndpoint() {
  console.log('\n====== TESTING LOGOUT ENDPOINT ======');
  
  try {
    const response = await makeRequest('http://localhost:5000/auth/logout', {
      method: 'POST'
    });

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response body:', data);
      
      if (response.status === 200) {
        console.log('✅ Logout successful!');
        return true;
      } else {
        console.log('❌ Logout failed!');
        return false;
      }
    } else {
      const text = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', text);
      console.log('❌ Logout failed!');
      return false;
    }
  } catch (error) {
    console.error('Error testing logout endpoint:', error.message);
    console.log('❌ Logout failed!');
    return false;
  }
}

/**
 * Test access to a protected route
 */
async function testProtectedRoute() {
  console.log('\n====== TESTING PROTECTED ROUTE ======');
  
  try {
    const response = await makeRequest('http://localhost:5000/protected');
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response body:', data);
      
      if (response.status === 200) {
        console.log('✅ Protected route access successful!');
        return true;
      } else {
        console.log('❌ Protected route access failed!');
        return false;
      }
    } else {
      const text = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', text);
      console.log('❌ Protected route access failed!');
      return false;
    }
  } catch (error) {
    console.error('Error testing protected route:', error.message);
    console.log('❌ Protected route access failed!');
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('Starting JWT authentication endpoint tests...');
  
  // Test 1: Login
  const loginSuccess = await testLoginEndpoint();
  if (!loginSuccess) {
    console.log('❌ Authentication flow stopped: Login failed');
    return;
  }
  
  // Test 2: Access protected route with fresh token
  await testProtectedRoute();
  
  // Test 3: Refresh token
  const refreshSuccess = await testRefreshTokenEndpoint();
  if (!refreshSuccess) {
    console.log('❌ Authentication flow stopped: Token refresh failed');
    return;
  }
  
  // Test 4: Access protected route with refreshed token
  await testProtectedRoute();
  
  // Test 5: Logout
  const logoutSuccess = await testLogoutEndpoint();
  if (!logoutSuccess) {
    console.log('❌ Authentication flow stopped: Logout failed');
    return;
  }
  
  // Test 6: Try accessing protected route after logout (should fail)
  console.log('\n====== TESTING PROTECTED ROUTE AFTER LOGOUT (SHOULD FAIL) ======');
  const protectedRouteAfterLogout = await testProtectedRoute();
  if (protectedRouteAfterLogout) {
    console.log('❌ Security issue: Still able to access protected route after logout!');
  } else {
    console.log('✅ Protected route properly secured after logout');
  }
  
  console.log('\n====== TEST SUMMARY ======');
  console.log('Login:', loginSuccess ? '✅ Passed' : '❌ Failed');
  console.log('Token Refresh:', refreshSuccess ? '✅ Passed' : '❌ Failed');
  console.log('Logout:', logoutSuccess ? '✅ Passed' : '❌ Failed');
}

// Run all tests
runTests();
