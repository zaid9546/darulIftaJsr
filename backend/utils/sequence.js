const Counter = require('../models/Counter');

/**
 * Atomically increments and returns the next sequence value.
 * Uses MongoDB's findOneAndUpdate with $inc — safe for concurrent calls.
 *
 * @param {string} name - The counter name (e.g., 'fatwa')
 * @returns {Promise<number>} - The next integer in the sequence
 */
async function getNextSequence(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },              // Find counter by name
    { $inc: { seq: 1 } },       // Atomically increment by 1
    { new: true, upsert: true } // Create if not exists, return updated doc
  );
  return doc.seq;               // Return the new integer value
}

module.exports = { getNextSequence };
