const axios = require('axios');

exports.getWeatherData = async (req, res) => {
    try {
        const { latitude, longitude } = req.query; // Retrieve from query params

        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                lat: latitude,
                lon: longitude,
                appid: process.env.WEATHER_API_KEY,
                units: 'metric' // Celsius; change to 'imperial' for Fahrenheit
            }
        });

        // Parse relevant data for a simpler response
        const weatherInfo = {
            temperature: response.data.main.temp,
            condition: response.data.weather[0].main, // e.g., "Rain", "Snow", "Clear"
            description: response.data.weather[0].description // e.g., "light rain", "scattered clouds"
        };

        res.json(weatherInfo);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching weather data' });
    }
};
