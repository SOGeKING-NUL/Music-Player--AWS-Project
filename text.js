const { Client, Pool } = require('pg');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require('fs');
const path = require('path');

// 1. S3 Configuration (SDK v3)
const s3Client = new S3Client({ 
    region: 'ap-south-1' 
    // Note: On EC2/Lambda, credentials are picked up automatically via IAM Roles
});

async function main() {
  const password = 'Qwe=-123';
  // Read CA bundle as a buffer, not string
  const caBundle = fs.readFileSync(path.join(__dirname, 'global-bundle.pem'));

  // 2. Database Connection (Using Pool for scalability)
  const pool = new Pool({
    host: 'music-player-db.cbs4e4gim1z4.ap-south-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: {
      rejectUnauthorized: false,
      ca: caBundle
    }
  });

  try {
    console.log("Attempting to connect to RDS...");
    
    // Test the connection
    const res = await pool.query('SELECT version()');
    console.log("✅ Connection Successful!");
    console.log("RDS PostgreSQL Version:", res.rows[0].version);

    // Example: How you would generate a Presigned URL for a song
    // const command = new GetObjectCommand({ Bucket: "your-bucket", Key: "song.flac" });
    // const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    // console.log("Sample Streaming URL generated.");

  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.code === 'ETIMEDOUT') {
        console.error('Check your Security Group: Is Port 5432 open for your IP?');
    }
  } finally {
    // For a simple script we end the pool. 
    // In a real Express app, you keep the pool alive.
    await pool.end();
  }
}

main().catch(console.error);