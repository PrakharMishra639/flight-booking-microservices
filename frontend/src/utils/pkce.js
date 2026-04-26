// Utility functions for Proof Key for Code Exchange (PKCE)

/**
 * Generates a random alphanumeric string for the code_verifier
 * @param {number} length length of the verifier
 * @returns {string} code_verifier
 */
export const generateCodeVerifier = (length = 64) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const values = window.crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
};

/**
 * Encodes an ArrayBuffer to Base64URL string
 * @param {ArrayBuffer} buffer 
 * @returns {string} Base64URL encoded string
 */
const base64UrlEncode = (buffer) => {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Generates a code_challenge from a code_verifier (S256)
 * @param {string} verifier 
 * @returns {Promise<string>} code_challenge
 */
export const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
};
