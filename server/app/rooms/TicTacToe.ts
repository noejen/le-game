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
    this.broadcast(`${ client.sessionId } joined.`);


    this.state.players[client.sessionId] = client.sessionId;

    if (Object.keys(this.state.players).length === 2) {
      // Set the last player who joins as the first turn
      this.state.currentTurn = client.sessionId;

      // No more players
      this.lock();
    }
  }

  onMessage (client: Client, data: any) {
    console.log("Action:", data.action, "Client:", client.sessionId, "Data:", data);

    if (data.action === 'chat') {
      this.broadcast({
        action: data.action,
        playerSessionId: client.sessionId,
        message:`${ data.message }`
      });
    }

    if (data.action === 'move') {
      // If a gamestate is win or draw, we don't do any more moves.
      if (this.state.winner || this.state.draw) {
        return false;
      }

      // We only listen for moves from the player who's current turn it is
      if (client.sessionId === this.state.currentTurn) {
        const playersSessionIDs = Object.keys(this.state.players);
        const index = data.x + (BOARD_WIDTH * data.y);

        if (this.stage.board[index] === 0) {
          const playerMove = (client.sessionId === playerIds[0]) ? 1 : 2;
          this.stage.board[index] = playerMove;

          if (this.isWin()) {
            // Game ends with a win
            console.log('Game End', 'Winner is:', client.sessionId);
            this.state.winner = client.sessionId;
          } else if (this.isBoardFull()) {
            // Game ends in a draw
            console.log('Game End', 'Winner is:', 'Draw');
            this.state.draw = true;
          } else {
            // Next turn
            this.state.currentTurn = (client.sessionId === playerIds[0]) ? playerIds[1] : playerIds[0];
          }
        }
      }
    }
    
    

  }

  isWin() {

  }

  isBoardFull() {
    let openSlots = this.state.board.filter(item => item === 0);
    return openSlots.length === 0;
  }

  onLeave (client: Client, consented: boolean) {
    this.broadcast(`${ client.sessionId } left.`);
  }

  onDispose() {
  }

}
