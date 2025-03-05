const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // To generate UUID
const InvalidatedToken = require('../models/InvalidatedToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const gridfsStream = require('gridfs-stream');
const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');
//const firebaseAdmin = require('firebase-admin'); // Import Firebase Admin SDK
var firebaseAdmin = require("firebase-admin");
const nodemailer = require('nodemailer'); // Make sure Nodemailer is required


var serviceAccount = require('../config/serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount) // Use the service account JSON file
  });
} else {
  firebaseAdmin.app(); // If already initialized
}




const conn = mongoose.createConnection(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Set up multer to store files directly in MongoDB (using GridFS)
const storage = new GridFsStorage({
    url: process.env.MONGO_URI,  // MongoDB connection string (make sure to set this in your .env)
    file: (req, file) => {
        return {
            bucketName: 'profile_pictures',  // Name of the GridFS bucket
            filename: `${req.user.userID}-${Date.now()}${file.originalname}`
        };
    }
});

const upload = multer({ storage }).single('profilePicture');


// Register a new user
exports.register = async (req, res) => {
    try {
        console.log("in register");
        const { username, password, firstName, lastName, email } = req.body;

        // Check if the username or email already exists in MongoDB
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

        // Create new user with the generated userID in MongoDB
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

        // Check if the email is already in Firebase Authentication
        try {
            const firebaseUser = await firebaseAdmin.auth().getUserByEmail(email);

            // If user exists in Firebase, send an email verification link
            console.log('Firebase user found:', firebaseUser.uid);
            firebaseAdmin.auth().generateEmailVerificationLink(email)
                .then((link) => {
                    console.log('Email verification link:', link);
                    
                    // Send the verification link to the user's email
                    sendVerificationEmail(email, link); // Call the function to send email
                })
                .catch(error => {
                    console.error('Error sending verification email:', error);
                });

        } catch (error) {
            // If the user doesn't exist in Firebase, create the Firebase user
            if (error.code === 'auth/user-not-found') {
                firebaseAdmin.auth().createUser({
                    email: email,
                    password: password // You may want to hash the password before passing it here
                })
                .then((userRecord) => {
                    console.log('Firebase user created:', userRecord.uid);
                    // After creating the user, send the email verification link
                    firebaseAdmin.auth().generateEmailVerificationLink(email)
                        .then((link) => {
                            console.log('Email verification link:', link);
                            sendVerificationEmail(email, link); // Send the email
                        })
                        .catch(error => {
                            console.error('Error sending verification email:', error);
                        });
                })
                .catch((error) => {
                    console.error('Error creating Firebase user:', error);
                });
            } else {
                // Handle other Firebase errors (unexpected issues)
                console.error('Firebase error:', error);
            }
        }

        res.status(201).json({ message: 'User registered successfully. Please check your email for verification.' });
        console.log(`Signing up user: ${username} (${firstName} ${lastName})`);
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to send email with the verification link using Nodemailer
function sendVerificationEmail(to, link) {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use Gmail SMTP
        auth: {
            user: process.env.EMAIL_USER,  // Your Gmail email address from .env
            pass: process.env.EMAIL_PASS,  // Your Gmail app password from .env
        },
        tls: {
            rejectUnauthorized: false, // This is important for handling self-signed certificates and some other SSL issues
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER, // Your email address from .env
        to: to, // Recipient's email
        subject: 'Please verify your email address',
        text: `Click the following link to verify your email address: \n\n${link}`, // Email body with the verification link
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Verification email sent:', info.response);
        }
    });
}

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

        // Check if the email is verified in Firebase
        const firebaseUser = await firebaseAdmin.auth().getUserByEmail(user.email);
        console.log('Firebase User:', firebaseUser); // Log the Firebase user object

        if (!firebaseUser.emailVerified) {
            console.log('Email not verified');
            return res.status(403).json({ message: 'Please verify your email address before logging in.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Incorrect password');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token with userId (MongoDB _id) and userID (UUID)
        const token = jwt.sign(
            { userId: user._id, userID: user.userID }, // Include both IDs
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
};




//logout
exports.logout = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(400).json({ message: 'No token provided' });
        }

        // Decode the token to get its expiration date
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        const expirationDate = new Date(decoded.exp * 1000);

        // Save invalidated token to the database
        const invalidatedToken = new InvalidatedToken({
            token,
            expiresAt: expirationDate,
        });

        await invalidatedToken.save();
        res.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        console.log('Received userID from middleware:', req.user.userID);
        const user = await User.findOne({ userID: req.user.userID }).select('-password');
        if (!user) {
            console.error('User not found for userID:', req.user.userID);
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userID: user.userID,
            bio: user.bio,
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile (first name, last name, and username)
exports.updateUserProfile = async (req, res) => {
    const { userID } = req.user;
    const { firstName, lastName, bio } = req.body;

    try {
        const user = await User.findOne({ userID });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (bio !== undefined) user.bio = bio;

        const updatedUser = await user.save();

        res.status(200).json({
            message: 'User profile updated successfully',
            user: {
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                bio: updatedUser.bio,
            },
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Update profile picture in the user profile (storing in MongoDB)
exports.updateProfilePicture = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            return res.status(400).json({ message: err.message });
        }

        const fileId = req.file.id; // File ID stored in MongoDB

        try {
            // Update the user's profile picture field in the database with the file ID
            const user = await User.findOne({ userID: req.user.userID });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.profilePicture = fileId;  // Store the GridFS file ID
            await user.save();

            res.status(200).json({
                message: 'Profile picture updated successfully',
                profilePicture: fileId,
            });
        } catch (error) {
            console.error('Error updating profile picture:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
};

// Fetch the profile picture from MongoDB using the file ID
exports.getProfilePicture = async (req, res) => {
    const fileId = req.params.fileId; // The file ID is passed in the URL

    conn.once('open', () => {
        const gfs = gridfsStream(conn.db, mongoose.mongo);
        gfs.collection('profile_pictures'); // The GridFS bucket for storing profile pictures

        // Find the file by its ID in the database
        gfs.files.findOne({ _id: mongoose.Types.ObjectId(fileId) }, (err, file) => {
            if (err || !file) {
                return res.status(404).json({ message: 'File not found' });
            }

            // Create a read stream and send the file as a response
            const readStream = gfs.createReadStream(file.filename);
            res.set('Content-Type', file.contentType); // Set the correct content type
            readStream.pipe(res); // Pipe the file stream to the response
        });
    });
};
