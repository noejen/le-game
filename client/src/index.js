import React from 'react';
import ReactDOM from 'react-dom';
import * as Colyseus from "colyseus.js";

import './index.css';

function Square(props) {
  if (!props.highlight) {
    return (
      <button className="square" onClick={() => props.onClick()}>
        {props.value}
      </button>
    );
  } else {
    return (
      <button className="square highlight" onClick={() => props.onClick()}>
        {props.value}
      </button>
    );
  }
}

class Players extends React.Component {
  render() {
    console.log('LIST', Object.keys(this.props.list).length,this.props.list, this.props.list.length);
    return (
      <div class="c-players">
        <p>
        {
          Object.keys(this.props.list).length < 2 ?
            'Waiting for another player.' :
            'Players: ' + Object.keys(this.props.list).concat(' ')
        }
      </p>
    </div>
    );
  }
}

class NextMoveStatus extends React.Component {
  render() {
    let status = null;
    if(this.props.room === null) {
      status = '';
    } else if(this.props.currentTurn === this.props.room.sessionId) {
      status = 'It is your turn!';
    } else if (this.props.currentTurn !== undefined) {
      status = `It's ${this.props.currentTurn}'s turn!`;
    }
    return (
      <div class="c-next-move-status">
        {status}
      </div>
    );
  }
}

class Board extends React.Component {

  renderSquare(i) {
    return (
      <Square
        highlight={this.props.squaresHighlight.includes(i)}
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  render() {
    let rows = Array(3).fill(null);
    for(let x=0; x<3; x++) {
      let cols = Array(3).fill(null);
      for(let y=0; y<3; y++) {
        cols[y] = this.renderSquare((x*3)+y);
      }
      rows[x] = React.createElement('div', {className: "board-row"}, cols);
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
      messages: []
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
      <div className="game">
        <form id="form" onSubmit={this.handleSubmit}>
          <input type="text" id="input" value={this.state.input} onChange={this.handleChange} />
          <input type="submit" value="send" />
        </form>
        <div id="messages">
          {this.state.messages.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      </div>
    );
  }
}

class Game extends React.Component {

  constructor() {
    super();
    this.state = {
      history: [{
        squares: Array(9).fill(null),
      }],
      stepNumber: 0,
      xIsNext: true,
      
      room: null,
      
      board: null,
      players: [],
      currentTurn: '',
      winner: '',
      draw: false,
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
        console.log(client.id, "received on", room.name, data);

        if (data.action === "chat") {
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

    }).catch(e => {
      console.log("JOIN ERROR", e);
    });

  }

  handleClick(i) {
    if(this.state.currentTurn !== this.state.room.sessionId) {
      return;
    }

    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();

    this.state.room.send({
      action: 'move',
      x: Math.floor(i%3),
      y: Math.floor(i/3)
    });
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
    });
  }


  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = { name: null, squares: [] };

    return (
      <div className="game">
        <div className="game-players">
          <Players list={this.state.players} />
        </div>
        <div className="game-board">
          <Board
            squaresHighlight={winner.squares}
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
          />
        </div>

        <Chat
          room = {this.state.room}
        >
        </Chat>

        <div className="game-winner">
          <NextMoveStatus
            winner={this.state.winner}
            room={this.state.room}
            currentTurn={this.state.currentTurn}
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
