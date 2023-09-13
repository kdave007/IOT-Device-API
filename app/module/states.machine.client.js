/**
 * @brief
 *  Data struct for JSON's to 
 *  identify next step
 *  
 */

 //Possible errors
const ERROR = {
     _205 : 205,//Reinicia inmediatamente el dispositivo.
     _401 : 401,// ID y/o contraseña incorrecta.
     _404 : 404,//La url es incorrecta.
     _500 : 500,//Ocurrió un error el lógica del servidor.
     _503 : 503,//El servidor está caído.
     _NULL : null
}

const STATUS_RESP = {
    _200 : 200,//Nuevas configuraciones, no se requiere un nuevo paquete.
    _204 : 204,//No existen nuevas configuraciones.
    _206 : 206//Nuevas configuraciones, se requiere el envío nuevamente de un POST, utilizado si el tamaño del paquete de configuraciones excede el buffer del cliente.
}

const RECOGNITION = {
     NEW_REG : 1,
     SUCCESSFULL : 2,
     UFO:3
}

const TASK = {
    NEW_DEF : 0,
    GET_UPDT : 1,
    GET_ALL: 3
}

const SETTINGS = {
    THERM_CAL : "THERM_CAL",// TABLE A
    REPORT : "REPORT",// TABLE A
    SENS_FILTER: "SENS-FILTER",// TABLE A
    WIFI_CONFIG: "WIFI",// TABLE AB
    AV_CONFIG: "AV-CONF",// TABLE D
    LIGHT_MOD: "L-MOD",// TABLE E
    MON_CONFIG:"MONITOR-CONF",// TABLE B
    LIVE_EVENT: "LIVE-EVENT",// TABLE C
    COMP_CONTROL:"C-CONTROL"
}

const PACKAGE_RESOLVE = {
    _1P:0,
    _2P:1
}

const SAMPLES_KEYS = {//DEVICE OUTPUT KEYS
    L_MODULE:"L-MODULE",
    GPS:"GPS",
    GPIO:"GPIO",
    TH_TV:"TH-TV",
    EVENT:"EVENT",
    PR_V:"PR-V"
}

module.exports={
    STATUS_RESP,
    ERROR,
    RECOGNITION,
    TASK,
    SETTINGS,
    PACKAGE_RESOLVE,
    SAMPLES_KEYS
};