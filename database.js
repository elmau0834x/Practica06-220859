import mongoose from "mongoose";

async function connectBD() {
    mongoose.connect('mongodb+srv://mau:Mau.220859.25@cluster0.wqb1tkt.mongodb.net/db_sessions?retryWrites=true&w=majority&appName=Cluster0')
    .then((db)=> {
        console.log('MongoDB Atlas conect successfull')
    })
    .catch((error)=> {
        console.error(`Error aal conectr a la DB. Este es el ${error}`)
    });
}


export default connectBD;