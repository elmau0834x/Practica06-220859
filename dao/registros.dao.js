import Registro from "../models/Registros.js";

const registroDao = {};

registroDao.insert = async(registro) =>{
    return await Registro.create(registro)
};

registroDao.findOneAndUpdate = async(sessionId,registro) =>{
    return await Registro.findOneAndUpdate({sessionId:sessionId}, registro)
}

export default registroDao;