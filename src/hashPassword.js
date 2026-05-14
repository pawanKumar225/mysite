const bcrypt = require('bcryptjs');

async function generateHash() {

   const hashed = await bcrypt.hash("$riRama@225", 10);

   console.log(hashed);
}

generateHash();