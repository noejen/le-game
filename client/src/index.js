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

  }

  handleClick(i) {
    if(!this.state.currentTurn) {
      return;
    }

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


  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = { name: null, squares: [] };

    let status;
    if (winner.name) {
      status = 'Winner: ' + winner.name;
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }
    return (
      <div className="game">
        <div className="game-board">
        { this.state.currentTurn === undefined &&
          <div>
            Waiting for players
          </div>
        }
          <Board
            squaresHighlight={winner.squares}
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
          />
        </div>
        <div>{ status }</div>
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
