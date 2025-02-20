import Registro from "../models/Registros.js";

const registroDao = {};

registroDao.insert = async(registro) =>{
    return await Registro.create(registro)
};

registroDao.findOneAndUpdate = async(sessionId,registro) =>{
    return await Registro.findOneAndUpdate({sessionId:sessionId}, registro)
}

registroDao.findOne = async(sessionId) =>{
    return await Registro.findOne({sessionId:sessionId})
}

registroDao.findAll = async() =>{
    return await Registro.find()
}

registroDao.deleteAll = async () => {
    return await Registro.deleteMany({});
};

export default registroDao;