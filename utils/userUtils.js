// Utility functions for handling user operations

/**
 * Get a valid ObjectId for database operations
 * Handles the production bypass case where user._id might be a string
 * @param {string|ObjectId} userId - The user ID from req.user._id
 * @returns {ObjectId|null} - Valid ObjectId or null for production bypass
 */
const getValidUserId = (userId) => {
  // Handle production bypass user
  if (userId === 'admin-production-id') {
    return null;
  }
  
  // Return the actual ObjectId
  return userId;
};

module.exports = {
  getValidUserId
};