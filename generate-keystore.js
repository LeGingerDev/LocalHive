const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Create the keystores directory if it doesn't exist
const keystoreDir = path.join(__dirname, 'android', 'keystores');
if (!fs.existsSync(keystoreDir)) {
  fs.mkdirSync(keystoreDir, { recursive: true });
}

// Generate a simple keystore file (this is just a placeholder, not a real keystore)
const keystorePath = path.join(keystoreDir, 'upload-keystore.jks');
const buffer = crypto.randomBytes(2048);
fs.writeFileSync(keystorePath, buffer);

console.log(`Generated keystore at: ${keystorePath}`);
console.log('Note: This is NOT a real keystore, just a placeholder file.');
console.log('You should replace this with a proper keystore generated with keytool.'); 