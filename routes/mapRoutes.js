const express = require('express');
const router = express.Router();

// Route to fetch Map API key
router.get('/key', (req, res) => {
    const mapApiKey = process.env.MAPBOX_API_KEY; // Add the key to .env file
    if (!mapApiKey) {
        return res.status(500).json({ message: 'Map API key not found in environment variables' });
    }
    res.json({ key: mapApiKey });
});

module.exports = router;
