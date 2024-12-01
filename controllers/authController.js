const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // To generate UUID

// Register a new user
exports.register = async (req, res) => {
    try {
        console.log("in register")
        const { username, password, firstName, lastName, email } = req.body;

        // Check if the username or email already exists
        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            console.log('User already exists:', user);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed Password:', hashedPassword);

        // Generate a new unique userID
        const userID = uuidv4();  // Generate a unique userID using UUID v4

        // Create new user with the generated userID
        user = new User({
            username,
            password: hashedPassword,
            firstName,
            lastName,
            email,
            userID // Use the generated userID
        });

        const savedUser = await user.save();
        console.log('User saved:', savedUser);

        res.status(201).json({ message: 'User registered successfully' });
        console.log(`Signing up user: ${username} (${firstName} ${lastName})`);
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt for user:', username);

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Incorrect password', password);
            return res.status(400).json({ message: 'Invalid credentials' });
        }


        // Create JWT token with userId (MongoDB _id) and userID (UUID)
        const token = jwt.sign(
            { userId: user._id, userID: user.userID }, // Include both IDs
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
        //console.log(token);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
