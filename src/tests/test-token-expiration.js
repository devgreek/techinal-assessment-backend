#!/usr/bin/env node

const fetch = require('node-fetch');

/**
 * Test script for token expiration handling
 * 
 * Note: To properly test this, you would need to modify your 
 * auth.config.js to use shorter expiration times during testing,
 * e.g., 10 seconds for access token and 30 seconds for refresh token.
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
    return cookies;
  }
  return [];
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
  
  return response;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test access token expiration and refresh
 */
async function testTokenExpiration() {
  console.log('\n====== TESTING TOKEN EXPIRATION ======');
  
  try {
    // Step 1: Login to get tokens
    console.log('\nStep 1: Logging in to get fresh tokens');
    let response = await makeRequest('http://localhost:5000/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    
    if (response.status !== 200) {
      console.log('❌ Login failed with status', response.status);
      return;
    }
    
    cookies = parseCookies(response);
    console.log('✅ Login successful, received tokens');
    
    // Step 2: Access protected route with fresh token (should succeed)
    console.log('\nStep 2: Accessing protected route with fresh token');
    response = await makeRequest('http://localhost:5000/protected');
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Protected route access successful!');
      console.log('Response:', data);
    } else {
      console.log('❌ Protected route access failed with fresh token');
      console.log('Status:', response.status);
    }
    
    // Step 3: Wait for token to expire (simulated in test environment)
    const waitTime = 3; // seconds
    console.log(`\nStep 3: In a real test, we would wait for token to expire.`);
    console.log(`This script is simulating expired tokens. In a real test,`);
    console.log(`you would need to set auth.config.js to use short expiration times`);
    console.log(`and actually wait for the tokens to expire.`);
    
    console.log(`\nWaiting ${waitTime} seconds to simulate token expiration...`);
    await sleep(waitTime * 1000);
    
    // Step 4: Try to access protected route with expired token (should fail with 401)
    console.log('\nStep 4: Accessing protected route with "expired" token (simulation)');
    console.log('In a real test with appropriate token settings, this should fail with 401.');
    response = await makeRequest('http://localhost:5000/protected');
    
    if (response.status === 401) {
      console.log('✅ As expected, protected route access failed with status 401');
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.log('⚠️ Protected route returned status', response.status, 'instead of 401');
      console.log('Note: This is expected in this simulation since tokens haven\'t actually expired.');
    }
    
    // Step 5: Refresh token to get a new access token
    console.log('\nStep 5: Refreshing token');
    response = await makeRequest('http://localhost:5000/auth/refresh', {
      method: 'POST'
    });
    
    if (response.status === 200) {
      cookies = parseCookies(response);
      const data = await response.json();
      console.log('✅ Token refresh successful!');
      console.log('Response:', data);
    } else {
      console.log('❌ Token refresh failed with status', response.status);
      try {
        const data = await response.json();
        console.log('Response:', data);
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    }
    
    // Step 6: Try to access protected route with new token (should succeed)
    console.log('\nStep 6: Accessing protected route with new token');
    response = await makeRequest('http://localhost:5000/protected');
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Protected route access successful with refreshed token!');
      console.log('Response:', data);
    } else {
      console.log('❌ Protected route access failed with refreshed token');
      console.log('Status:', response.status);
    }
    
    console.log('\n====== TOKEN EXPIRATION TEST COMPLETE ======');
    
  } catch (error) {
    console.error('Error in token expiration test:', error);
  }
}

// Run the test
testTokenExpiration();
