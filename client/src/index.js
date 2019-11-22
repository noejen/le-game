import React from 'react';
import ReactDOM from 'react-dom';
import * as Colyseus from "colyseus.js";

import './index.css';

function Square(props) {
  let value = '';
  if (props.value === 1) {
    value = 'X';
  } else if (props.value === 2) {
    value = 'O';
  }

  return (
    <button className="square" onClick={() => props.onClick()}>
      {value}
    </button>
  );
}

class GameStatus extends React.Component {
  render() {
    let status = null;
    if(this.props.room === null) {
      status = '';
    } else if(this.props.currentTurn === undefined) {
      status = 'Waiting for opponent...';
    } else if(this.props.currentTurn === this.props.room.sessionId) {
      status = 'Your turn!';
    } else if (this.props.currentTurn !== undefined) {
      status = `Opponent's turn.`;
    }

    if(this.props.winner) {
      if(this.props.winner === this.props.room.sessionId) {
        status = `You won! :D`;
      } else {
        status = `You lost :(`;
      }
      
    }

    return (
      <div class="c-next-move-status">
        {status}
      </div>
    );
  }
}

class Board extends React.Component {

  renderSquare(index) {
    return (
      <Square
        value={this.props.boardstate[index]}
        onClick={() => this.props.onClick(index)}
      />
    );
  }

  render() {
    const board_width = Math.sqrt(this.props.boardstate.length);
    
    if(board_width % 1 !== 0) {
      return false;
    }

    let rows = [];
    for (let y = 0; y < board_width; y++){
      let row = [];
      for (let x = 0; x < board_width; x++) {
        row.push( this.renderSquare(x+(board_width*y)) );
      }
      rows[y] = React.createElement('div', {className: "board-row"}, row);
    }

    return (
      React.createElement('div', null, rows)
    ); 
  }
}

class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      input: '',
    };


    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  
  handleChange(event) {
    this.setState({input: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();

    if(this.state.input === '') {
      return;
    }

    this.props.room.send({
      action: 'chat',
      message: this.state.input 
    });

    this.setState({input: ''});
  }

  render() {
    return (
      <div>
        <div class="chat-messages">
          {this.props.messages.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
        <div class="chat-controls">
          <form onSubmit={this.handleSubmit}>
            <input class="chat-input" type="text" value={this.state.input} onChange={this.handleChange} />
            <input class="chat-submit" type="submit" value="Send" />
          </form>
        </div>
      </div>
    );
  }
}

class Game extends React.Component {

  constructor() {
    super();
    this.state = {
      room: null,
      
      board: [],
      players: [],
      currentTurn: '',
      winner: '',
      draw: false,

      chatMessages: []
    };

    var client = new Colyseus.Client('ws://localhost:2567');
    
    client.joinOrCreate("tictactoe").then(room => {
      console.log(room.sessionId, "joined", room.name);
      this.setState({ room });

      room.onStateChange((state) => {
        const { players, board, currentTurn, winner, draw} = state;

        this.setState({
          players,
          board,
          currentTurn,
          winner,
          draw
        });

        console.log("STATE CHANGE", this.state);
      });
    
      room.onMessage((data) => {
        if (data.action === "chat") {
          let playerLabel = (this.state.room.sessionId === data.playerSessionId) ? 'You' : 'Opponent';

          this.state.chatMessages.push(`${playerLabel}: ${data.message}`);
          this.forceUpdate();
        }
        if (data.action === "server-chat") {
          this.state.chatMessages.push(`${data.message}`);
          this.forceUpdate();
        }
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

  }

  handleClick(index) {
    if(this.state.currentTurn !== this.state.room.sessionId) {
      return;
    }

    const board_width = Math.sqrt(this.state.board.length);
    
    if(board_width % 1 !== 0) {
      return false;
    }

    this.state.room.send({
      action: 'move',
      x: Math.floor(index % board_width),
      y: Math.floor(index / board_width)
    });
  }


  render() {

    return (
      <div className="game">
        <h1>Le Game - TicTacToe</h1>

        <div className="game-board">
          <Board
            boardstate={this.state.board}
            onClick={(i) => this.handleClick(i)}
          />
        </div>

        <div className="game-status">
          <GameStatus
            winner={this.state.winner}
            room={this.state.room}
            currentTurn={this.state.currentTurn}
          />
        </div>

        <div className="game-chat">
          <Chat 
            room={this.state.room} 
            messages={this.state.chatMessages}
          />
        </div>
        
      </div>
    );
  }
}

  
// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

// ========================================
