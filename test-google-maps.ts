#!/usr/bin/env bun
// Test script for Google Maps integration

import { planTripWithGoogleMaps } from './src/services/planner/google-maps-planner.js';
import { logger } from './src/lib/logger.js';

async function main() {
  logger.info('Testing Google Maps integration...\n');

  // Test 1: Known locations
  logger.info('Test 1: Portal Norte → Universidad Nacional');
  const result1 = await planTripWithGoogleMaps('Portal Norte', 'Universidad Nacional');

  if (result1.success) {
    logger.success(`✓ Found ${result1.routes.length} routes`);
    result1.routes.forEach((route, i) => {
      console.log(`\n  Route ${i + 1}:`);
      console.log(`  ${route.departureTime} → ${route.arrivalTime} (${route.duration})`);
      console.log(`  ${route.summary}`);
    });
  } else {
    logger.error(`✗ Failed: ${result1.error}`);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Test 2: Original addresses
  logger.info('Test 2: Cra 21 #87-22 → UNIMONSERRATE');
  const result2 = await planTripWithGoogleMaps('Cra 21 #87-22', 'UNIMONSERRATE');

  if (result2.success) {
    logger.success(`✓ Found ${result2.routes.length} routes`);
    result2.routes.forEach((route, i) => {
      console.log(`\n  Route ${i + 1}:`);
      console.log(`  ${route.departureTime} → ${route.arrivalTime} (${route.duration})`);
      console.log(`  ${route.summary}`);
    });
  } else {
    logger.error(`✗ Failed: ${result2.error}`);
  }

  console.log('\n' + '─'.repeat(60) + '\n');
  logger.info('Test complete!');
}

main().catch(console.error);
