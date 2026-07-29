import { EventEmitter } from 'events';

// Create a global event emitter for the server process.
// In a serverless deployment or multi-instance setup, this should be replaced with Redis Pub/Sub.
export const gameEvents = new EventEmitter();
