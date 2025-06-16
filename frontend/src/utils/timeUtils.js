/**
 * Get current time in GMT+7 (Bangkok timezone)
 * @returns {Date} Current date and time in GMT+7
 */
export const getCurrentTimeGMT7 = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 7)); // Add 7 hours for GMT+7
};

/**
 * Get current time in GMT+7 formatted as string
 * @returns {string} Current time in format "HH:mm:ss"
 */
export const getCurrentTimeStringGMT7 = () => {
  const now = getCurrentTimeGMT7();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Get current date in GMT+7 formatted as string
 * @returns {string} Current date in format "YYYY-MM-DD"
 */
export const getCurrentDateStringGMT7 = () => {
  const now = getCurrentTimeGMT7();
  return now.toISOString().split('T')[0];
};

/**
 * Get current datetime in GMT+7 formatted as string
 * @returns {string} Current datetime in format "YYYY-MM-DD HH:mm:ss"
 */
export const getCurrentDateTimeStringGMT7 = () => {
  const now = getCurrentTimeGMT7();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  return `${date} ${time}`;
}; 