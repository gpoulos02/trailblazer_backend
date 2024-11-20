const fs = require('fs');
const https = require('https');
const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();


// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const poiRoutes = require('./routes/poiRoutes');

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/pois', poiRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the secure TrailBlazer API!');
});

// SSL/TLS configuration
const options = {
    key: fs.readFileSync('./ssl/private.key'),
    cert: fs.readFileSync('./ssl/certificate.crt'),
};

// Start HTTPS server
const PORT = process.env.PORT || 5001;
https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
});
