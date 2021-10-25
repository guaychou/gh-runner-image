const  { createClient } = require('redis');
const client = createClient({
    url: process.env.REDIS_URI || "redis://localhost:6379"
});

exports.client = client