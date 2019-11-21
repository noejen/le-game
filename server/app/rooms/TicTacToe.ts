import { Room, Client } from "colyseus";
import { type, Schema, MapSchema, ArraySchema } from '@colyseus/schema';

const TURN_TIMER = 1;
const BOARD_WIDTH = 3;

class State extends Schema {
  @type("string") 
  currentTurn!: string;
  
  @type({ map: "string" }) 
  players = new MapSchema<boolean>();

  @type(["number"]) 
  board: number[] = new ArraySchema<number>(0, 0, 0, 0, 0, 0, 0, 0, 0);
  
  @type("string") 
  winner!: string;
  
  @type("boolean") 
  draw!: boolean;
}

export class TicTacToe extends Room<State> {
  maxClients = 2;

  onCreate (options: any) {
    this.setState(new State())
  }

  onJoin (client: Client, options: any) {
    this.state.players[client.sessionId] = client.sessionId;

    if(Object.keys(this.state.players).length === 2) {
      // Set the last player who joins as the first turn
      this.stage.currentTurn = client.sessionId;

      // No more players
      this.lock();
    }
  }

  onMessage (client: Client, message: any) {
    // If a gamestate is win or draw, we don't respond to any more messages.
    if (this.state.winner || this.state.draw) {
      return false;
    }

    // We only listen for messages from the player who's current turn it is
    if(client.sessionId === this.state.currentTurn) {
      const playersSessionIDs = Object.keys(this.state.players);
    }
  }

  isWin() {

  }

  isBoardFull() {

  }

  onLeave (client: Client, consented: boolean) {
  }

  onDispose() {
  }

}
