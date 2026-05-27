const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5001';
  process.env.JWT_SECRET = 'test_secret_key_must_be_32_characters_long_minimum!';
  process.env.JWT_EXPIRE = '1h';
  process.env.BYPASS_AUTH = 'false';
  process.env.AI_SERVICE_URL = 'http://localhost:8000';

  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
});

afterAll(async () => {
  // Clean up connections and stop MongoMemoryServer
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clear collections between tests
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});
