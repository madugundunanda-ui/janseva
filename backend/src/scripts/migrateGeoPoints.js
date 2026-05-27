/**
 * Migration Script: Backfill geoPoint fields for existing documents.
 *
 * Populates the GeoJSON `geoPoint` / `location.geoPoint` field from existing
 * `latitude`/`longitude` values so that 2dsphere indexes can be used for
 * geospatial queries ($near, $geoWithin, $geoNear).
 *
 * Usage:
 *   node src/scripts/migrateGeoPoints.js
 *
 * Safe to run multiple times (idempotent).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Complaint, Hotspot } = require('../models');
const logger = require('../utils/logger');

const MONGO_URI = process.env.MONGO_URI;

async function migrateCollection(Model, modelName, getCoords) {
  const cursor = Model.find({}).cursor();
  let updated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    const { lat, lng, setPath } = getCoords(doc);

    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) {
      skipped++;
      continue;
    }

    // Skip if already populated
    const existing = setPath === 'geoPoint' ? doc.geoPoint : doc.location?.geoPoint;
    if (
      existing &&
      existing.type === 'Point' &&
      Array.isArray(existing.coordinates) &&
      existing.coordinates.length === 2
    ) {
      skipped++;
      continue;
    }

    const geoPoint = { type: 'Point', coordinates: [lng, lat] };

    await Model.updateOne(
      { _id: doc._id },
      { $set: { [setPath]: geoPoint } }
    );
    updated++;
  }

  logger.info(`[Migration] ${modelName}: updated=${updated}, skipped=${skipped}`);
  return { updated, skipped };
}

async function main() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not set. Please configure .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  logger.info('[Migration] Connected to MongoDB');

  // Migrate Users
  await migrateCollection(User, 'User', (doc) => ({
    lat: doc.latitude,
    lng: doc.longitude,
    setPath: 'geoPoint',
  }));

  // Migrate Complaints
  await migrateCollection(Complaint, 'Complaint', (doc) => ({
    lat: doc.location?.latitude,
    lng: doc.location?.longitude,
    setPath: 'location.geoPoint',
  }));

  // Migrate Hotspots
  await migrateCollection(Hotspot, 'Hotspot', (doc) => ({
    lat: doc.latitude,
    lng: doc.longitude,
    setPath: 'geoPoint',
  }));

  logger.info('[Migration] GeoPoint backfill complete');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[Migration] Fatal error:', err);
  process.exit(1);
});
