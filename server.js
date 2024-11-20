// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // For parsing JSON request bodies

// Import routes
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const poiRoutes = require('./routes/poiRoutes');
const trailRoutes = require('./routes/trailRoutes');
const chairliftRoutes = require('./routes/chairliftRoutes');


// Define routes
app.use('/api/auth', authRoutes);         // Authentication routes
app.use('/api/routes', routeRoutes);       // Route planning/navigation routes
app.use('/api/metrics', metricsRoutes);    // Performance metrics routes
app.use('/api/weather', weatherRoutes);    // Weather data routes
app.use('/api/pois', poiRoutes);            // Add POI routes
app.use('/api/trails', trailRoutes);       // Add trail routes
app.use('/api/chairlifts', chairliftRoutes); // Add chairlift routes

// Root route for basic check
app.get('/', (req, res) => {
    res.send('Welcome to the TrailBlazer API!');
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
