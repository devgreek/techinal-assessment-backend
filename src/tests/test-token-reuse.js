#!/usr/bin/env node

const fetch = require('node-fetch');

/**
 * Specialized test script for JWT token reuse detection
 * 
 * This script simulates an attack scenario where a refresh token is stolen and reused:
 * 1. User logs in -> receives refresh token
 * 2. User refreshes token once legitimately -> receives new token, old one is invalidated
 * 3. Attacker tries to use the old (stolen) refresh token -> should get 403 Forbidden
 * 4. Original user tries to use their current token -> should still work
 */

// Store cookies for legitimate user and attacker
let userCookies = [];
let stolenCookies = [];
let stolenRefreshToken = '';

/**
 * Parse cookies from response headers
 */
function parseCookies(response) {
  const rawCookies = response.headers.raw()['set-cookie'];
  if (rawCookies) {
    return rawCookies.map(entry => entry.split(';')[0]);
  }
  return [];
}

/**
 * Extract just the refresh token from cookies
 */
function extractRefreshToken(cookies) {
  const refreshCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
  if (refreshCookie) {
    return refreshCookie.split('=')[1];
  }
  return null;
}

/**
 * Make a request with the given cookies
 */
async function makeRequest(url, options = {}, customCookies = null) {
  const cookies = customCookies || userCookies;
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
 * Main test function
 */
async function testTokenReuseDetection() {
  try {
    console.log('\n====== STARTING TOKEN REUSE DETECTION TEST ======\n');
    
    // Step 1: User logs in
    console.log('Step 1: User logs in');
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
    
    // Store the cookies (including refresh token)
    userCookies = parseCookies(response);
    console.log('✅ Login successful, received cookies');
    
    // Attacker steals the refresh token - simulate by copying the cookie
    stolenRefreshToken = extractRefreshToken(userCookies);
    const refreshCookie = userCookies.find(c => c.startsWith('refreshToken='));
    stolenCookies = [refreshCookie];
    
    console.log('⚠️ Refresh token stolen by attacker');
    
    // Step 2: User refreshes token legitimately
    console.log('\nStep 2: User refreshes token legitimately');
    response = await makeRequest('http://localhost:5000/auth/refresh', {
      method: 'POST'
    });
    
    if (response.status !== 200) {
      console.log('❌ Token refresh failed with status', response.status);
      const data = await response.json();
      console.log('Response:', data);
      return;
    }
    
    // Update user's cookies
    userCookies = parseCookies(response);
    console.log('✅ Token refresh successful, received new tokens');
    
    // Step 3: Attacker tries to use the stolen refresh token
    console.log('\nStep 3: Attacker tries to use the stolen refresh token');
    console.log('Attacker uses refresh token:', stolenRefreshToken);
    
    response = await makeRequest('http://localhost:5000/auth/refresh', {
      method: 'POST'
    }, stolenCookies);
    
    const attackerResponseData = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', attackerResponseData);
    
    if (response.status === 403) {
      console.log('✅ Reuse detection working! Attacker got 403 Forbidden');
    } else {
      console.log('❌ Security issue: Attacker was able to refresh token');
    }
    
    // Step 4: Original user tries to use their current token
    console.log('\nStep 4: User tries to access protected resource after attacker was detected');
    response = await makeRequest('http://localhost:5000/protected');
    
    const finalResponseData = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', finalResponseData);
    
    if (response.status === 401) {
      console.log('✅ Security working correctly: All user tokens were revoked after attack detection');
    } else if (response.status === 200) {
      console.log('ℹ️ Note: User can still access resources after attack detection');
      console.log('   This is a security vs. user experience trade-off.');
      console.log('   For maximum security, you might want to revoke all user tokens on reuse detection.');
    } else {
      console.log('❓ Unexpected response for legitimate user');
    }
    
    console.log('\n====== TOKEN REUSE DETECTION TEST COMPLETE ======');
    
  } catch (error) {
    console.error('Error during token reuse detection test:', error);
  }
}

// Run the test
testTokenReuseDetection();
