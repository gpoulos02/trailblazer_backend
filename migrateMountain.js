const mongoose = require('mongoose');
require('dotenv').config(); // Ensure environment variables are loaded

const Trail = require('./models/Trail');
const Chairlift = require('./models/Chairlift');
const PointOfInterest = require('./models/PointOfInterest');
const Route = require('./models/Route');
const Mountain = require('./models/Mountain');

const MOUNTAIN_ID_DEFAULT = 1; // Change this if needed

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ Error connecting to MongoDB:", err));

const updateMountainID = async () => {
    try {
        // Get all mountains to map names to IDs
        const mountains = await Mountain.find();
        const mountainMap = {}; // { mountainName: mountainID }
        mountains.forEach(m => mountainMap[m.name] = m.mountainID);

        console.log("🌄 Mountain Mapping:", mountainMap);

        // Update Trails
        await Trail.updateMany({ mountainID: { $exists: false } }, { $set: { mountainID: MOUNTAIN_ID_DEFAULT } });
        console.log("✅ Trails updated");

        // Update Chairlifts
        await Chairlift.updateMany({ mountainID: { $exists: false } }, { $set: { mountainID: MOUNTAIN_ID_DEFAULT } });
        console.log("✅ Chairlifts updated");

        // Update POIs
        await PointOfInterest.updateMany({ mountainID: { $exists: false } }, { $set: { mountainID: MOUNTAIN_ID_DEFAULT } });
        console.log("✅ Points of Interest updated");

        // Update Routes
        await Route.updateMany({ mountainID: { $exists: false } }, { $set: { mountainID: MOUNTAIN_ID_DEFAULT } });
        console.log("✅ Routes updated");

    } catch (error) {
        console.error("❌ Error updating database:", error);
    } finally {
        mongoose.disconnect();
    }
};

// Run the migration
updateMountainID();
