const axios = require('axios');

// Get weather data for a specific location
exports.getWeatherData = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        
        // Replace with your weather API URL and key
        const response = await axios.get(`https://api.weatherapi.com/v1/current.json`, {
            params: {
                key: process.env.WEATHER_API_KEY,
                q: `${latitude},${longitude}`
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching weather data' });
    }
};
