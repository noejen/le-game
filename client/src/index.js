import * as Colyseus from "colyseus.js"
// import * as PIXI from 'pixi.js'
import './scss/style.scss';

var client = new Colyseus.Client('ws://localhost:2567');
var room;

client.join("room_name").then(room => {
  console.log(room.sessionId, "joined", room.name);

  room.onStateChange((state) => {
    console.log(room.name, "has new state:", state);
  });

  room.onMessage((message) => {
    console.log(client.id, "received on", room.name, message);
  });

  room.onError(() => {
    console.log(client.id, "couldn't join", room.name);
  });

  room.onLeave(() => {
    console.log(client.id, "left", room.name);
});
      
}).catch(e => {
    console.log("JOIN ERROR", e);
});