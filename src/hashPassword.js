const bcrypt = require('bcryptjs');

async function generateHash() {

   const hashed = await bcrypt.hash("$tudent01", 10);

   console.log(hashed);
}

generateHash();