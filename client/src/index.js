import * as Colyseus from "colyseus.js"
// import * as PIXI from 'pixi.js'
import './scss/style.scss';

var client = new Colyseus.Client('ws://localhost:2567');
var room;

client.joinOrCreate("tictactoe").then(room => {
  console.log(room.sessionId, "joined", room.name);

  room.onStateChange((state) => {
    console.log(room.name, "has new state:", state);
  });

  room.onMessage((data) => {
    console.log(client.id, "received on", room.name, data);


    if(data.action === 'chat') {
      var p = document.createElement("p");
      p.innerHTML = `${data.playerSessionId}: ${data.message}`;
      document.querySelector("#messages").appendChild(p);
    }
  });

  room.onError(() => {
    console.log(client.id, "couldn't join", room.name);
  });

  room.onLeave(() => {
    console.log(client.id, "left", room.name);
  });

  document.querySelector("#form").onsubmit = function(e) {
    e.preventDefault();
    var input = document.querySelector("#input");
    console.log("input:", input.value);
    // send data to room
    room.send({ 
      action: 'chat',
      message: input.value 
    });
    // clear input
    input.value = "";
  }
      
}).catch(e => {
    console.log("JOIN ERROR", e);
});