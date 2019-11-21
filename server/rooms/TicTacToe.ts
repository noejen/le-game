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

    this.broadcast({
      action: "server-chat",
      message: `Player joined.`
    });

    this.state.players[client.sessionId] = client.sessionId;

    if (Object.keys(this.state.players).length === 2) {
      // Set the last player who joins as the first turn
      this.state.currentTurn = client.sessionId;

      this.broadcast({
        action: "server-chat",
        message: `Game has begun!`
      });

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
        message: `${ data.message }`
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

        if (this.state.board[index] === 0) {
          const playerMove = (client.sessionId === playersSessionIDs[0]) ? 1 : 2;
          this.state.board[index] = playerMove;

          if (this.isWin(data.x, data.y, playerMove)) {
            // Game ends with a win
            console.log('Game End', 'Winner is:', client.sessionId);
            this.state.winner = client.sessionId;
          } else if (this.isBoardFull()) {
            // Game ends in a draw
            console.log('Game End', 'Winner is:', 'Draw');
            this.state.draw = true;
          } else {
            // Next turn
            this.state.currentTurn = (client.sessionId === playersSessionIDs[0]) ? playersSessionIDs[1] : playersSessionIDs[0];
          }
        }
      }
    }
  }

  isWin(x: number, y: number, playerMove: number):boolean {
    let win = false;
    
    // col
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const index = x + (BOARD_WIDTH * col);
      if (this.state.board[index] !== playerMove) {
        break;
      }
      if (col == BOARD_WIDTH - 1) {
        win = true;
      }
    }

    // row
    for (let row = 0; row < BOARD_WIDTH; row++) {
      const index = row + (BOARD_WIDTH * y);
      if (this.state.board[index] !== playerMove) {
        break;
      }
      if (row == BOARD_WIDTH - 1) {
        win = true;
      }
    }

    // diag
    if (x === y) {
      for (let xy = 0; xy < BOARD_WIDTH; xy++) {
        const index = xy + (BOARD_WIDTH * xy);
        if (this.state.board[index] !== playerMove) {
          break;
        }
        if (xy == BOARD_WIDTH - 1) {
          win = true;
        }
      }
    }

    // back Diag
    for (let col = 0; x < BOARD_WIDTH; col++) {
      const row = (BOARD_WIDTH - 1) - col;
      const index = col + BOARD_WIDTH * row;
      if (this.state.board[index] !== playerMove) { 
        break; 
      }
      if (col == BOARD_WIDTH - 1) {
        win = true;
      }
    }

    return win;
  }

  isBoardFull() {
    let openSlots = this.state.board.filter(item => item === 0);
    return openSlots.length === 0;
  }

  onLeave (client: Client, consented: boolean) {
    this.broadcast(`${ client.sessionId } left.`);

    delete this.state.players[ client.sessionId ];
  }

  onDispose() {
  }

}
