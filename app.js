import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import moment from "moment-timezone";
import os from "os"
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import morgan from "morgan";
import registroDao from "./dao/registros.dao.js";
import connectBD from "./database.js";

const app = express();
const port = 3000;
const sessions = {};

//Settings
app.set("port", process.env.PORT || 3000);

//Middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors());
app.use(express.json()); // Necesita paréntesis
app.use(express.urlencoded({ extended: true })); // También se necesita el paréntesis
app.use(
    session({
        secret: "P4-MRG#aquinitaxduxita-SesionesHTTP-VariablesDeSesion ",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 5*60*1000 }
    })
)

// const getClientIP = (req) => {
//     return (
//         req.headers["x-forwarded-for"] ||
//         req.connection.remoteAddress ||
//         req.socket.remoteAddress ||
//         req.connection.socket?.remoteAddress
//     );
// };
// Función para obtener la IP del cliente automáticamente
const getClientIP = (req) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.connection?.socket?.remoteAddress ||
               "IP no disponible";

    // Si la IP tiene el prefijo "::ffff:", lo eliminamos para obtener solo la dirección IPv4
    if (ip.startsWith("::ffff:")) {
        return ip.slice(7); // Eliminamos el prefijo "::ffff:" de la dirección
    }

    return ip;
};


const getServerNetworkInfo = () => {
    const interfaces = os.networkInterfaces();
    for(const name in interfaces){
        for(const iface of interfaces[name]){
            if(iface.family === 'IPv4' && !iface.internal){
                return {
                    serverIp: iface.address,
                    serverMac: iface.mac,
                }
            }
        }
    }
}

app.post("/login", (req, res) => {
    const { nickname, email, macAddress } = req.body;
    const serverInfo = getServerNetworkInfo();

    if (!email || !nickname || !macAddress) {
        return res.status(400).json({
            message: "Se esperan campos requeridos",
        });
    }

    const sessionId = uuidv4();
    const now = new Date();
    const horaMexico = moment(now).tz("America/Mexico_City").format("YYYY-MM-DD HH:mm:ss")
    const ipClient = getClientIP(req)
    console.log(horaMexico)

    sessions[sessionId] = {
        sessionId,
        email,
        nickname,
        createdAt: horaMexico, 
        lastAccess: horaMexico,
        status: "Activa",
        clientData:{
            ip:ipClient,
            macAddress:macAddress
        },
        serverData:{
            ip:serverInfo.serverIp,
            macAddress:serverInfo.serverMac
        },
        inactivityTime:{
            hours:0,
            minutes:0,
            seconds:0
        },
        duration:{
            hours:0,
            minutes:0,
            seconds:0
        }
    };
    registroDao.insert(sessions[sessionId])
    .then((data)=>{
        res.status(200).json({
            message: "Se ha logueado con éxito",
            data:data
        });
    })
    .catch((error)=>{
        res.json({
            data:{
                error:error
            }
        })
    })
});

app.post("/logout", (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No se ha encontrado una sesión activa",
        });
    }

    delete sessions[sessionId];
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error al cerrar la sesión");
        }
    });
    estado = {
        status:'Inactiva'
    }
    registroDao.findOneAndUpdate()
    res.status(200).json({
        message: "Logout successful",
    });
});

app.put("/update", async (req, res) => {
    const { sessionId, email, nickname } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ message: "No existe una sesión activa" });
    }

    // Obtener la hora actual en Ciudad de México
    const now = moment().tz("America/Mexico_City");
    const lastAccess = moment(sessions[sessionId].lastAccess).tz("America/Mexico_City");
    const createdAt = moment(sessions[sessionId].createdAt).tz("America/Mexico_City");

    // Calcular el tiempo de inactividad en horas, minutos y segundos
    const inactivityDuration = moment.duration(now.diff(lastAccess));
    const inactivityHours = inactivityDuration.hours();
    const inactivityMinutes = inactivityDuration.minutes();
    const inactivitySeconds = inactivityDuration.seconds();
    console.log(`Inactividad: ${inactivityHours} horas, ${inactivityMinutes} minutos, ${inactivitySeconds} segundos`);
    
    // Calcular la duracion en horas, minutos y segundos
    const duration = moment.duration(now.diff(createdAt));
    const durationHours = duration.hours();
    const durationMinutes = duration.minutes();
    const durationSeconds = duration.seconds();
    console.log(`Duration: ${durationHours} horas, ${durationMinutes} minutos, ${durationSeconds} segundos`);

    // Actualizar datos de la sesión
    if (email) sessions[sessionId].email = email;
    if (nickname) sessions[sessionId].nickname = nickname;
    sessions[sessionId].lastAccess = now.format("YYYY-MM-DD HH:mm:ss");
    sessions[sessionId].inactivityTime = {
        hours: inactivityHours,
        minutes: inactivityMinutes,
        seconds: inactivitySeconds
    };
    sessions[sessionId].duration = {
        hours: durationHours,
        minutes: durationMinutes,
        seconds: durationSeconds
    };

    const dataUpdated = {
        nickname: sessions[sessionId].nickname,
        email: sessions[sessionId].email,
        lastAccess: sessions[sessionId].lastAccess,
        inactivityTime: sessions[sessionId].inactivityTime,
        duration: sessions[sessionId].duration
    };

    try {
        const registro = await registroDao.findOneAndUpdate(sessionId, dataUpdated);
        const dato = await registroDao.findOne(sessionId)


        if (!registro) {
            return res.status(404).json({ message: "No se encontró la sesión en la base de datos" });
        }

        res.status(200).json({
            message: "Datos actualizados correctamente",
            data: dato
        });
    } catch (error) {
        res.status(500).json({ error: error.message || "Error en la actualización" });
    }
});

app.get("/status", (req, res) => {
    const sessionId = req.query.sessionId;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No hay sesión activa"
        });
    }

    const now = new Date();
    const horaMexico = moment(now).tz("America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");

    // Calcular el tiempo de inactividad en horas, minutos y segundos
    const inactivityDuration = moment.duration(now.diff(lastAccess));
    const inactivityHours = inactivityDuration.hours();
    const inactivityMinutes = inactivityDuration.minutes();
    const inactivitySeconds = inactivityDuration.seconds();
    console.log(`Inactividad: ${inactivityHours} horas, ${inactivityMinutes} minutos, ${inactivitySeconds} segundos`);
    
    // Calcular la duracion en horas, minutos y segundos
    const duration = moment.duration(now.diff(createdAt));
    const durationHours = duration.hours();
    const durationMinutes = duration.minutes();
    const durationSeconds = duration.seconds();
    console.log(`Duration: ${durationHours} horas, ${durationMinutes} minutos, ${durationSeconds} segundos`);

    sessions[sessionId].lastAccessed = horaMexico;
    sessions[sessionId].inactivityTime = {
        hours: inactivityHours,
        minutes: inactivityMinutes,
        seconds: inactivitySeconds
    };
    sessions[sessionId].duration = {
        hours: durationHours,
        minutes: durationMinutes,
        seconds: durationSeconds
    };

    res.status(200).json({
        message: "Sesión activa",
        session: sessions[sessionId]
    });
});


app.get("/statusAll", (req, res) => {
    registroDao.findAll()
    .then((data) =>{
        res.json({
            data:{
                data:data
            }
        })
    })
    .catch((error) =>{
        res.json({
            data:{
                error:error
            }
        })
    })
});

app.get("/deleteAllSessions", (req, res) =>{
    registroDao.deleteAll()
    .then((data) =>{
        res.json({
            data:{
                message:"Todos los datos eliminados",
                data:data
            }
        })
    })
    .catch((error)=>{
        res.json({
            data:{
                error:error
            }
        })
    })
})

connectBD();
app.listen(port, () => {
    console.log(`Servidor levantado en el puerto ${port}`);
});

app.get("/", (req, res)=>{
    return res.status(200).json({
        message:"Bienvenid@ al API de control de Sesiones",
        author:"Mauricio Rosales Gbriel"
    })
})

