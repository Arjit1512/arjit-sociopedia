import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        userName:{
            type:String,
            required:true,
        },
        dp:{
            type:String
        },
        email:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true,
        },
        posts:[
          {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Sociopedia-Post'
          }
        ],
        friends:[
            {
              type:Array,
            }
        ]

    }
)

const User = mongoose.model('Sociopedia-User',UserSchema);
export default User;