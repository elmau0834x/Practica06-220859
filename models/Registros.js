import { model, Schema } from "mongoose";

const registrosSchema = new Schema({
    sessionId: {
        type:String,
        unique: true
    },
    email:{
        type:String,
        required:true
    },
    nickname:{
        type:String,
        required:true
    },
     
    createdAt:{
        type:Date,
        required:true
    },
    lastAccess:{
        type:Date,
        required:true
    },
    status:{
        type:String,
        enum:["Activa", "Inactiva", "Finalizada por el Usuario", "Finalizada por error"],
        required:true
    }, 
    clientData:{
        ip:{
            type:String,
            required:true
        },
        macAddress:{
            type:String,
            required:true
        }
    },
    serverData: {
        ip:{
            type:String,
            required:true
        },
        macAddress:{
            type:String,
            required:true
        }
    },
    inactivityTime: {
        hours:{
            type:Number,
            required:true,
            min: 0
        },
        minutes:{
            type:Number,
            required:true,
            min: 0,
            max: 59
        },
        seconds:{
            type:Number,
            required:true,
            min: 0,
            max: 59
        }
    }
},{
    versionKey:false,
})

export default model("registro", registrosSchema)