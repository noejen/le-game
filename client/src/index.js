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
    };

    var client = new Colyseus.Client('ws://localhost:2567');
    
    client.joinOrCreate("tictactoe").then(room => {
      console.log(room.sessionId, "joined", room.name);
      this.setState({ room });

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
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (calculateWinner(squares).name || squares[i]) {
      return;
    }

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
    const winner = calculateWinner(current.squares);

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
      </div>
    );
  }
}



function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return {
        name: squares[a],
        squares: lines[i]
      };
    }
  }
  return {
    name: null,
    squares: [],
  };
}


  
// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

// ========================================
