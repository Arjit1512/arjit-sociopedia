import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Post from './models/Post.js';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const app = express();
dotenv.config();

// app.use(cors())

app.use(cors({
    origin: ["http://localhost:3000","https://arjit-sociopedia.vercel.app"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
//app.options('*', cors()); 

app.use(bodyParser.json({ limit: "30mb", extended: "true" }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: "true" }));

// Initialize Firebase
// Initialize Firebase
console.log('Service Account Path:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
console.log('Storage Bucket:', process.env.FIREBASE_STORAGE_BUCKET);

// Check if the service account file exists
if (!fs.existsSync(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH))) {
    console.error('Firebase service account file not found!');
    process.exit(1); // Exit if the file does not exist
}

// Log raw file content to ensure it's being read correctly
let serviceAccount;
try {
    const fileContent = fs.readFileSync(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH), 'utf8');
    serviceAccount = JSON.parse(fileContent);
} catch (error) {
    console.error('Error reading or parsing the service account JSON:', error.message);
    process.exit(1); // Stop execution if the file is invalid or cannot be parsed
}

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Now that Firebase is initialized, you can use the bucket
const bucket = admin.storage().bucket();


const uploadImageToFirebase = async (file) => {
    console.log('File to be uploaded:', file);

    try {
      // Check if file exists and has valid data
      if (!file || !file.path) {
        throw new Error('Invalid file or file path');
      }
  
      console.log('Uploading file:', file.originalname);
  
      const token = uuidv4(); // To make file public with a unique token
      const metadata = {
        metadata: {
          firebaseStorageDownloadTokens: token
        },
        contentType: file.mimetype || 'application/octet-stream', // Fallback MIME type
        cacheControl: 'public, max-age=31536000'
      };
  
      const fileName = `${Date.now()}-${file.originalname}`;
      const uploadResponse = await bucket.upload(file.path, {
        destination: `images/${fileName}`,
        metadata: metadata,
      });
  
      console.log('File uploaded successfully:', uploadResponse);
  
      // Make file public
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadResponse[0].name)}?alt=media&token=${token}`;
      return publicUrl;
    } catch (error) {
      console.error('Error during image upload:', error);
      throw new Error('Failed to upload image to Firebase Storage');
    }
  };
  
  

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Specify the destination folder for uploads ------------------> (NOTE: 'cb' means callback) 
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const isValidType = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (isValidType) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.'));
    }
};

const upload = multer({ storage, fileFilter });
app.use('/uploads', express.static('uploads'));


//for jwt
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; 
        next(); 
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};


app.post('/auth/register', upload.single('dp'), async (req, res) => {
    const { userName, email, password } = req.body;
    console.log(req.body);
    console.log(req.file);
    try {
        if (!userName || !email || !password) return res.status(200).json({ error: "Enter all the details!" });


        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(200).json("old-user");
        }

        let imagePath = null;
        if(req.file){
            imagePath = await uploadImageToFirebase(req.file);
        }

        const newUser = new User({ email, password, userName, dp: imagePath });

        const token = jwt.sign( {userId:newUser._id} , process.env.JWT_SECRET, {expiresIn:'30d'});

        await newUser.save();
        return res.status(200).json({ message: "new-user",token, userId: newUser._id });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
})

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(200).json("new-user");
        }
        const isMatch = existingUser.password === password;

        if (!isMatch) {
            return res.status(200).json("wrong-password");
        }
        const token = jwt.sign({userId:existingUser._id} , process.env.JWT_SECRET,{expiresIn:'30d'});
        return res.status(200).json({message: "old-user", token, userId:existingUser._id});

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
})

//get personal details of the User

app.get('/user/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(200).json("new-user");
        }
        return res.status(200).json(existingUser);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
})


app.post('/:userId/createPost', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { description } = req.body;

        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(200).json("new-user");
        }
        let imagePath='';
        if(req.file){
            imagePath = await uploadImageToFirebase(req.file); 
        }
        console.log(imagePath)

        const newPost = new Post({ userId, description, image: imagePath });

        await newPost.save();
        existingUser.posts.push(newPost._id);
        await existingUser.save();

        return res.status(200).json({message: "Post created successfully!",imagePath, postId: newPost._id});
    } catch (error) {
        console.log('Error: ', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})

app.post('/:userId/deletePost/:postId', verifyToken, async (req, res) => {
    try {
        const { userId, postId } = req.params;
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(200).json("new-user");
        }
        const existingPost = await Post.findOne({ _id: postId, userId });

        if (!existingPost) {
            return res.status(200).json("post-not-exists");
        }

        await User.findByIdAndUpdate(userId, { $pull: { posts: postId } });
        await Post.findByIdAndDelete(postId);

        return res.status(200).json("Post deleted successfully!");

    } catch (error) {
        console.log('Error: ', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})

//to display all the posts
app.get('/posts',async(req,res) => {
    try{
      const posts = await Post.find();

      return res.status(200).json(posts);
    } catch (error) {
        console.log('Error: ', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})

//get all the users
app.get('/users',async(req,res) => {
    try{
      const users = await User.find();

      return res.status(200).json(users);
    } catch (error) {
        console.log('Error: ', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})


app.post('/:userId/addFriend/:friendId', verifyToken, async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(200).json("new-user");
        }

        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(200).json("friend-not-exists");
        }
        if (existingUser.friends.includes(friendId)) {
            return res.status(200).json("Already friends!");
        }

        await User.findByIdAndUpdate(userId, { $push: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $push: { friends: userId } });

        return res.status(200).json("Friend added successfully!");

    } catch (error) {
        console.log('Error: ', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})




app.post('/:userId/removeFriend/:friendId', verifyToken, async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(200).json("new-user");
        }

        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(200).json("friend-not-exists");
        }
        if (existingUser.friends.includes(friendId)) {
            await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
            await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
            return res.status(200).json("Removed as your friend successfully!");
        }
        else {
            return res.status(200).json("He/She was not your friend previously!");
        }

    } catch (error) {
        console.log('Error: ', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})















const PORT = process.env.PORT || 6001;
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        })
    })
    .catch((error) => {
        console.log('Error: ', error);
    })