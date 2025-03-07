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
import Message from './models/Message.js';
import { timeStamp } from 'console';
import AWS from 'aws-sdk';

const app = express();
dotenv.config();

// app.use(cors())
const allowedOrigins = [
    "http://localhost:3000",
    "https://arjit-sociopedia.vercel.app",
    "http://localhost:8080",
    "http://sociopedia-application.us-east-1.elasticbeanstalk.com"
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests from allowed origins or no origin (e.g., Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Origin', 
        'X-Requested-With', 
        'Accept', 
        'Authorization', 
        'x-client-key', 
        'x-client-token', 
        'x-client-secret'
    ],
    credentials: true
};

// Use the CORS middleware with the defined options
app.use(cors(corsOptions));
app.use(express.json());

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));


// Additional headers for all responses (for dynamic origin handling)
app.all('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin); // Dynamically allow the origin
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

// Initialize Firebase
// console.log('Firebase Project ID:', process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID);
// console.log('Firebase Storage Bucket:', process.env.FIREBASE_STORAGE_BUCKET);

// Initialize Firebase Admin SDK with environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID,
    privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Access Firebase Storage
const bucket = admin.storage().bucket();


// const uploadImageToFirebase = async (file) => {
//     console.log('File to be uploaded:', file);

//     try {
//         // Check if file exists and has valid data
//         if (!file || !file.buffer) {
//             throw new Error('Invalid file or file buffer');
//         }

//         console.log('Uploading file:', file.originalname);

//         const token = uuidv4(); // To make file public with a unique token
//         const metadata = {
//             metadata: {
//                 firebaseStorageDownloadTokens: token
//             },
//             contentType: file.mimetype || 'application/octet-stream', // Fallback MIME type
//             cacheControl: 'public, max-age=31536000'
//         };

//         const fileName = `${Date.now()}-${file.originalname}`;
//         const fileUpload = bucket.file(`images/${fileName}`);

//         // Upload file directly from buffer
//         await fileUpload.save(file.buffer, {
//             metadata: metadata,
//             public: true, // Make the file public
//         });

//         console.log('File uploaded successfully to Firebase Storage.');

//         // Generate the public URL
//         const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileUpload.name)}?alt=media&token=${token}`;
//         return publicUrl;
//     } catch (error) {
//         console.error('Error during image upload:', error.message);  // Add detailed error message
//         throw new Error('Failed to upload image to Firebase Storage');
//     }
// };


  

// Set up storage for uploaded files (in memory)
const storage = multer.memoryStorage(); // Store files in memory

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

const upload = multer({ storage, fileFilter }); // Use memory storage

//for S3

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const uploadImageToS3 = async (file) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `images/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        return (await s3.upload(params).promise()).Location;
    } catch (error) {
        throw new Error(`S3 Upload Error: ${error.message}`);
    }
};



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
    console.log('User details:', req.body);
    console.log('File details:', req.file);  // Add logging for req.file

    try {
        if (!userName || !email || !password) {
            return res.status(200).json({ error: "Enter all the details!" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(200).json({ message: "Invalid email format" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(200).json("old-user");
        }

        let imagePath = null;
        if (req.file) {
            try {
                console.log('Uploading file to S3...');
                imagePath = await uploadImageToS3(req.file);
                console.log('Image uploaded successfully. Path:', imagePath);
            } catch (uploadError) {
                console.error('Error uploading file to S3:', uploadError.message);
                return res.status(500).json({ error: 'Error uploading file' });
            }
        }
        

        const newUser = new User({ email, password, userName, dp: imagePath });
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        await newUser.save();
        console.log('New user registered successfully:', newUser);
        return res.status(200).json({ message: "new-user", token, userId: newUser._id });
    } catch (error) {
        console.error('Error during registration:', error.message);  // Log detailed error
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


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
            imagePath = await uploadImageToS3(req.file); 
        }
        console.log(imagePath)

        const newPost = new Post({ userId, description, image: imagePath , timeStamp: new Date() });

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


//to send a meesage to a friend
app.post('/:userId/sendMessage/:friendId',verifyToken, async(req,res) => {
   try{
        const {userId,friendId} = req.params;
        const {message} = req.body;
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);
        if(!user){
            return res.status(200).json({message:"Please login to chat with your friends."});
        }
        if(!friend){
            return res.status(200).json({message:"Your friend doesn't seem to have an account."});
        }

        if(!user.friends.includes(friendId)){
            return res.status(200).json({message:"Need to be your friend, to chat!!"});
        }
        const newMessage = new Message({
             userId:userId,
             friendId:friendId,
             message:message,
             timeStamp:new Date()
        })
 
        await newMessage.save();
        await User.findByIdAndUpdate(userId,{$push:{sent_messages: newMessage._id}});
        await User.findByIdAndUpdate(friendId,{$push:{received_messages:newMessage._id}});


        return res.status(200).json({message:"Text sent succesfully to your friend."});
   }catch(error){
        console.log('Error: ',error);
   }
})


//to get meesages of a particular friend
app.get('/:userId/getMessage/:friendId',verifyToken, async(req,res) => {
    try{
         const {userId,friendId} = req.params;
         const user = await User.findById(userId);
         const friend = await User.findById(friendId);
         if(!user){
             return res.status(200).json({message:"User does not exists."});
         }
         if(!friend){
             return res.status(200).json({message:"Your friend doesn't seem to have an account."});
         }
 
         if(!user.friends.includes(friendId)){
             return res.status(200).json({message:"Need to be your friend, to chat!!"});
         }
  
         //display the array of sent_messages and received_messages that have this userId and friendId
         const s_m = await Message.find({userId,friendId}).sort({timeStamp:1});
         const r_m = await Message.find({friendId: userId, userId: friendId}).sort({timeStamp:1});

         const allMessages = [...s_m,...r_m].sort((a,b) => a.timeStamp - b.timeStamp);
         
         return res.status(200).json({sent_messages:s_m, received_messages:r_m, all_messages:allMessages});
    }catch(error){
         console.log('Error: ',error);
    }
 })
 






//to display all the posts
app.get('/posts',async(req,res) => {
    try{
      const posts = await Post.find().sort({timeStamp:-1});

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

//to like Post
app.post('/:postId/likePost/:userId' , async(req,res) => {
    try{
      const {userId,postId} = req.params;
      
      const post = await Post.findById(postId);
      if(!post){
        return res.status(404).json("Post does not exists!");
      }
      if (!post.likes) {
        post.likes = [];
      }

      const isPresent = post.likes.includes(userId);
      if(isPresent){
        await Post.findByIdAndUpdate(postId, { $pull :{likes : userId}});

        await post.save();
        return res.status(200).json("Post Unliked Successfully!");
      }

      post.likes.push(userId);
      await post.save();
      return res.status(200).json("Post Liked Successfully!");
    } catch(error){
        console.log('Error: ',error);
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