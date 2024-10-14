import mongoose from "mongoose";


const messageSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Sociopedia-User',
            required:true
        },
        friendId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Sociopedia-User',
            required:true
        },
        message:{
            type:String,
            required:true
        },
        timeStamp:{
            type:Date
        }
    }
)

const Message = mongoose.model('Message',messageSchema);
export default Message;
