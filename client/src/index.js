import * as Colyseus from "colyseus.js"
import * as PIXI from 'pixi.js'
import './scss/style.scss';

var client = new Colyseus.Client('ws://localhost:2567');