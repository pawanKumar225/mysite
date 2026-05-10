const bcrypt = require('bcryptjs');

async function generateHash() {

   const hashed = await bcrypt.hash("hrManager@123", 10);

   console.log(hashed);
}

generateHash();