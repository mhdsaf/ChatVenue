const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    users:[{
        name:{
            type: String
        },
        id:{
            type: String
        }
    }]
});
const rooms = mongoose.model('Rooms', roomSchema);

module.exports = rooms;