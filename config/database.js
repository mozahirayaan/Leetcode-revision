require('dotenv').config();
const mongoose = require('mongoose');


mongoose.connect(process.env.MONGODB_URL);


const questionSchema = mongoose.Schema({
    url:String,
    category: String,
    notes:String,
    email: String
})

const userSchema = mongoose.Schema({
    googleid: String,
    username: String,
    name: String,
    questions: [{
        url: String,
        category: String,
        notes: String
    }]
})


const questionModel= mongoose.model('questions', questionSchema);
const UserModel=mongoose.model('users',userSchema)


module.exports = {
   questionModel,
   UserModel
};
