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
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();

    this.state.room.send({ action: 'move', x: i%3, y: i/3 });
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    })
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = { name: null, squares: [] };

    const moves = history.map((step, move) => {
      const desc = move ?
        'Go to move #' + move :
        'Go to game start';
      if(move===this.state.stepNumber) {
        return (
          <li key={move}>
            <button onClick={() => this.jumpTo(move)} className="highlight">{desc}</button>
          </li>
        );
      } else {
        return (
          <li key={move}>
            <button onClick={() => this.jumpTo(move)}>{desc}</button>
          </li>
        );
      }
    });

    let status;
    if (winner.name) {
      status = 'Winner: ' + winner.name;
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }
    return (
      <div className="game">
        { this.state.currentTurn === undefined &&
          <div>
            Waiting for players
          </div>
        }
        <div className="game-board">
          <Board
            squaresHighlight={winner.squares}
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
        <Chat
          room = {this.state.room}
        >
        </Chat>
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
