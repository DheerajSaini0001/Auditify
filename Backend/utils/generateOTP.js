import crypto from 'crypto';

/**
 * Generates a cryptographically-secure 6-digit numeric OTP.
 * @returns {string}
 */
const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

export default generateOTP;
