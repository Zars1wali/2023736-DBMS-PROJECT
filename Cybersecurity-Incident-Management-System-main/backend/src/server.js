const app = require('./app');
const db = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Test the connection using the centralized pool
db.pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ DBMS Connection Error:', err.stack);
  }
  console.log('✅ DBMS Connected (PostgreSQL/pgAdmin)');
  release();
  
  // Start the server ONLY after the database is confirmed
  app.listen(PORT, () => {
    console.log(`🚀 CIMS backend listening on port ${PORT}`);
  });
});

