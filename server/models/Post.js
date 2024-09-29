import mongoose from 'mongoose';


const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sociopedia-User'
    },
    image:{
        type:String
    },
    description: {
      type: String
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: [
      {
        type: String
      }
    ]
  }
)


const Post = mongoose.model('Sociopedia-Post', PostSchema);

export default Post;