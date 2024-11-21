const fs = require('fs');
const https = require('https');
const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();


// Connect to MongoDB
connectDB();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

app.register = async (req, res) => {
    try {
        const { username, password, firstName, lastName, email, userID } = req.body;

        // Check if the username or email already exists
        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            console.log('User already exists:', user);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed Password:', hashedPassword);

        // Create new user
        user = new User({ username, password: hashedPassword, firstName, lastName, email, userID });

        const savedUser = await user.save();
        console.log('User saved:', savedUser);

        res.status(201).json({ message: 'User registered successfully' });
        console.log(`Signing up user: ${username} (${firstName} ${lastName})`);
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// SSL/TLS configuration
const options = {
    key: fs.readFileSync('./ssl/private.key'),
    cert: fs.readFileSync('./ssl/certificate.crt'),
};

// Start HTTPS server
const PORT = process.env.PORT || 5001;
https.createServer(options, app).listen(PORT, 'TrailBlazer33', () => {
    console.log(`HTTPS Server running on https://TrailBlazer33:${PORT}`);
});
