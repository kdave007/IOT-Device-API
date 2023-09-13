const ALARM_TEXT = [
     null,
     {
          brief:"Temperatura de descongelación.",// eventId = 1
          text:"la caja enfriadora del camión se encuentra en descongelación"
     },
     {
          brief:"Temperatura de caja recuperada.",//2
          text:"la temperatura dentro de la caja enfriadora del camión se ha estabilizado"
     },
     {
          brief:"Temperatura alta en compresor de succión.",//3
          text:"la temperatura en el tubo de carga del compresor es muy alta"
     },
     {
          brief:"Temperatura baja en compresor de succión.",//4
          text:"la temperatura en el tubo de carga del compresor es muy baja"
     },
     {
          brief:"Temperatura recuperada comp de succión.",//5
          text:"la temperatura del tubo de carga del compresor se ha estabilizado"
     },
     {
          brief:"Temperatura alta en compresor de descarga.",//6
          text:"la temperatura en el tubo de descarga del compresor es muy alta"
     },
     {
          brief:"Temperatura baja en compresor de descarga.",//7
          text:"la temperatura en el tubo de descarga del compresor es muy baja"
     },
     {
          brief:"Temperatura recuperada comp de descarga.",//8
          text:"la temperatura del tubo de descarga del compresor se ha estabilizado"
     },
     {
          brief:"Puerta abierta por periodo extendido.",//9
          text:"la puerta trasera se mantuvo abierto por un periodo extendido"
     },
     {
          brief:"Puerta cerrada.",//10
          text:"la puerta trasera se ha cerrado después de un periodo largo"
     },
     {
          brief:"Batería desconectada.",//11
          text:"la batería principal del camión se desconecto"
     },
     {
          brief:"Batería reconectada.",//12
          text:"la batería principal del camión se conecto de nuevo"
     },
     {
          brief:"Alimentación externa en CeDis no conectada.",//13
          text:"la alimentación (CeDis)externa que alimenta el compresor se encuentra desconectada"
     },
     {
          brief:"Alimentación externa en CeDis conectada.",//14
          text:"la alimentación (CeDis)externa que alimenta el compresor ha sido conectada de vuelta"
     },
     {
          brief:"Temperatura de peligro, diferencia de temp es minima.",//15
          text:"la diferencia de temperaturas entre el tubo de carga y de descarga se encuentra en niveles peligrosos"
     },
     {
          brief:"Voltaje de powerbank lleno.",//16
          text:"el voltaje en el powerbank esta al máximo"
     },
     {
          brief:"Voltaje de powerbank no lleno.",//17
          text:"el voltaje en el powerbank ha bajado del nivel máximo"
     },
     {
          brief:"Voltaje de powerbank bajo.",//18
          text:"el voltaje en el powerbank esta al mínimo"
     },
     {
          brief:"Voltaje de powerbank no completamente bajo.",//19
          text:"el voltaje en el powerbank esta cerca del mínimo"
     },
     {
          brief:"Diferencia de voltaje del powerbank.",//20
          text:"voltaje del powerbank"
     },
     {
          brief:"Compresor apagado continuamente por cierto tiempo.",//21
          text:"se mantuvo el compresor continuamente por cierto tiempo"
     },
     {
          brief:"Se encendió nuevamente el comp después de un tiempo prol",//22
          text:"se ha encendido nuevamente el compresor despues de un tiempo prolongado"
     }
]
     module.exports = ALARM_TEXT;