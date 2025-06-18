#!/usr/bin/env node

const fetch = require('node-fetch');

/**
 * Simple script to test the login API endpoint
 */
async function testLoginEndpoint() {
  console.log('Testing login endpoint...');
  
  try {
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
    } else {
      const text = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', text);
    }
  } catch (error) {
    console.error('Error testing login endpoint:', error.message);
  }
}

testLoginEndpoint();
