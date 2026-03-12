/**
 * Utils index - Export all utility functions
 */

export { default as apiLogger } from './apiLogger';

// Date utilities
export * from './dateHelpers';

// Avatar utilities
export * from './avatarHelpers';

// Re-export default exports as named exports
import dateHelpers from './dateHelpers';
import avatarHelpers from './avatarHelpers';

export { dateHelpers, avatarHelpers };
