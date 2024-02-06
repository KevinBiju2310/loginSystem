// This file operates with database
// Importing modules
const mongoose = require("mongoose")
const connect = mongoose.connect("mongodb://localhost:27017/LoginSystem")

// checking database connection
connect.then(()=>{
    console.log("Database Connected Successfully")
})
.catch(()=>{
    console.log("Database connection issue")
})

//creating a schema
const LoginSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    userType:{
        type: String,
        required: true
    }
})

//creating a model
//collection part

const collection = new mongoose.model("users",LoginSchema) //(collection,schema)

module.exports = collection
