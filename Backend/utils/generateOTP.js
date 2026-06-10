import crypto from 'crypto';

/**
 * Generates a 6-digit numeric OTP using a cryptographically secure RNG.
 * @returns {string}
 */
const generateOTP = () => {
    // crypto.randomInt is unbiased over the range; Math.random() is predictable.
    return crypto.randomInt(100000, 1000000).toString();
};

export default generateOTP;
