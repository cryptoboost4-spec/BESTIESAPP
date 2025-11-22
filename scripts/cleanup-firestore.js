#!/usr/bin/env node

/**
 * Firestore Cleanup Script
 *
 * WARNING: This script deletes ALL documents from ALL collections in Firestore.
 * Use only for testing/development purposes.
 *
 * Usage: node scripts/cleanup-firestore.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Collections to clean up
const COLLECTIONS = [
  'users',
  'besties',
  'checkins',
  'templates',
  'badges',
  'errors',
  'performance',
  'user_actions',
  'funnel_events',
  'alerts',
  'notifications',
  'emergency_sos',
  'bestie_celebrations',
  'posts',
  'alert_responses',
  'interactions',
  'circle_milestones'
];

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // No more documents to delete
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    // Also delete subcollections
    deleteSubcollections(doc.ref);
    batch.delete(doc.ref);
  });
  await batch.commit();

  console.log(`  Deleted ${batchSize} documents`);

  // Recurse on the next process tick to avoid stack overflow
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function deleteSubcollections(docRef) {
  // Delete reactions and comments subcollections for posts and checkins
  const subcollections = ['reactions', 'comments'];

  for (const subcollection of subcollections) {
    try {
      const subcollectionRef = docRef.collection(subcollection);
      const snapshot = await subcollectionRef.get();

      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (error) {
      // Subcollection might not exist, that's okay
    }
  }
}

async function confirmDeletion() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  WARNING: This will DELETE ALL documents from Firestore!\n\nType "DELETE ALL" to confirm: ', (answer) => {
      rl.close();
      resolve(answer === 'DELETE ALL');
    });
  });
}

async function main() {
  console.log('🗑️  Firestore Cleanup Script\n');
  console.log('This script will delete all documents from the following collections:');
  COLLECTIONS.forEach(col => console.log(`  - ${col}`));

  const confirmed = await confirmDeletion();

  if (!confirmed) {
    console.log('\n❌ Cleanup cancelled.');
    process.exit(0);
  }

  console.log('\n🔥 Starting cleanup...\n');

  for (const collection of COLLECTIONS) {
    try {
      console.log(`Deleting collection: ${collection}`);
      await deleteCollection(collection);
      console.log(`✅ ${collection} deleted\n`);
    } catch (error) {
      console.error(`❌ Error deleting ${collection}:`, error.message);
    }
  }

  console.log('✅ Firestore cleanup complete!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
