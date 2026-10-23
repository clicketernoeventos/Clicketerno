/* La dirección de la planilla central de Click Eterno.
   UNA sola para todas las invitaciones nuevas: una planilla de Google
   con una pestaña por fiesta, y un solo Apps Script implementado.
   Está acá y en ningún otro lado — escrita en cada invitación, el día
   que cambie quedarían la mitad apuntando a una dirección muerta y
   ninguna tiraría un error: la confirmación se manda, no llega, y la
   pantalla dice "listo".
   Qué fiestas existen va en lib/planillas.json, que es lo que lee el
   Apps Script.
   Vacía = todavía no se implementó: las invitaciones que dependen de
   esto muestran su confirmación como una MUESTRA y dicen con todas las
   letras que no se manda a ningún lado. Nunca dicen "listo". */
window.PLANILLA = {
  exec: ""
};
