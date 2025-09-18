#!/usr/bin/env node

/**
 * Cache Refresh Script
 * 
 * This script refreshes the recommendation cache to ensure fresh data
 * after making changes to the filtering logic or user profiles.
 * 
 * Usage:
 *   node scripts/refresh-cache.js
 *   npm run refresh-cache
 */

const axios = require('axios');

async function refreshCache() {
  try {
    console.log('🔄 Refreshing recommendation cache...');
    
    const response = await axios.post('http://localhost:3000/api/cache/refresh');
    
    if (response.data.success) {
      console.log('✅ Cache refreshed successfully!');
      console.log(`   Old size: ${response.data.oldSize}`);
      console.log(`   New size: ${response.data.newSize}`);
      console.log(`   Timestamp: ${response.data.timestamp}`);
    } else {
      console.error('❌ Cache refresh failed:', response.data.error);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running. Please start the server first:');
      console.error('   npm start');
    } else {
      console.error('❌ Error refreshing cache:', error.message);
    }
    process.exit(1);
  }
}

refreshCache();
