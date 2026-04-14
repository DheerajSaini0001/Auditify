import { encrypt, decrypt } from '../Backend/utils/encrypt.js';

const test = 'Hello World';
try {
    const encrypted = encrypt(test);
    console.log('Encrypted:', encrypted);
    const decrypted = decrypt(encrypted);
    console.log('Decrypted:', decrypted);
    if (test === decrypted) {
        console.log('✅ Success: Encryption/Decryption match!');
    } else {
        console.log('❌ Failure: Decryption does not match original!');
    }
} catch (e) {
    console.error('❌ Error during test:', e);
}
