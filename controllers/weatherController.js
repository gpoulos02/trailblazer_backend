const axios = require('axios');

exports.getWeatherData = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        console.log(`Debug: Received request for latitude=${latitude}, longitude=${longitude}`);

        if (!latitude || !longitude) {
            console.log("Debug: Missing latitude or longitude in query");
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        // Fetch current weather
        const currentWeatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                lat: latitude,
                lon: longitude,
                appid: process.env.WEATHER_API_KEY,
                units: 'metric'
            }
        });

        // Fetch forecast
        const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
            params: {
                lat: latitude,
                lon: longitude,
                appid: process.env.WEATHER_API_KEY,
                units: 'metric'
            }
        });

        // Parse relevant data
        const weatherInfo = {
            current: {
                temperature: currentWeatherResponse.data.main.temp,
                condition: currentWeatherResponse.data.weather[0].main,
                description: currentWeatherResponse.data.weather[0].description
            },
            forecast: forecastResponse.data.list.slice(0, 5).map((entry) => ({
                time: entry.dt_txt,
                temperature: entry.main.temp,
                condition: entry.weather[0].main,
                description: entry.weather[0].description
            }))
        };

        res.json(weatherInfo);
    } catch (error) {
        console.error("Debug: Error fetching weather data:", error);
        res.status(500).json({ message: 'Error fetching weather data' });
    }
};
