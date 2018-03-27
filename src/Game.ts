import Snake from './Snake';
import {canvas, context} from './Main';

const heightToWidthRatio = 3 / 2;
const minPxlPadding = 5;
const paddingHeightPercent = .01;
const minMenuBarWidth = 50;
const menuBarWidthPercent = .08;
const difficulties = {1: 600, 2: 500, 3: 400, 4: 300, 5: 200};
const gridWidths = {1: 12, 2: 18, 3: 24, 4: 30, 5: 36};
const backgroundColor = 'black';
const gridLineColor = 'blue';

function drawLine(x1: number, y1: number, x2: number, y2: number) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}

export default class Game {
    
    private _playerNum: number;
    private _paused = true;
    private _gameLoop: (timestamp: number) => void;
    private _loopId: number;
    private _lastTimeStamp: number;
    private _snakes: Snake[];
    private _difficulty: number;
    private _grid: {width: number, height: number};
    
    constructor() {
        this._gameLoop = (timestamp) => {
            this._loopId = requestAnimationFrame(this._gameLoop);
            if (!this._lastTimeStamp || (timestamp - this._lastTimeStamp) > this._difficulty) {
                this._lastTimeStamp = timestamp;
                for (let snake of this._snakes) {
                    snake.draw();
                }
            }
        }
    }
    
    startGame(options: {playerNum: number, difficulty: number, gridSize: number}) {
        this._playerNum = options.playerNum;
        this._difficulty = difficulties[options.difficulty];
        this._grid.width = gridWidths[options.gridSize];
        this._grid.height = this._grid.width * 2 / 3;
        this._snakes = [];
        this._snakes.push(new Snake(1, {left: 37, up: 38, right: 39,  down: 40}));
        if (options.playerNum === 2) {
            this._snakes.push(new Snake(2, {left: 65, up: 87, right: 68,  down: 83}));
        }
    }
    
    public pause(pause: boolean = !this._paused) {
        if (pause) {
            if (!this._paused) {
                this._paused = true;
                //other stuff
            }
        } else if (this._paused) {
            this._paused = false;
            //other stuff
        }
    }
    
    public resize() {
        if (!this._paused) {
            this.pause(true);
        }
        const minPadding = Math.max(minPxlPadding, paddingHeightPercent * window.innerHeight);
        const menuBarWidth = Math.max(minMenuBarWidth, menuBarWidthPercent * window.innerWidth);
        const availHeight = window.innerHeight - 2 * minPadding;
        const availWidth = window.innerHeight - minPadding;
        context.canvas.height = Math.floor(Math.min(availHeight, heightToWidthRatio * availWidth));
        context.canvas.width = Math.floor(context.canvas.height / heightToWidthRatio);
        canvas.style.top = Math.floor((window.innerHeight - context.canvas.height) / 2) + 'px';
        canvas.style.left = Math.floor((window.innerWidth + menuBarWidth - context.canvas.height) / 2) + 'px';
        this._drawGrid();
    }

    private _drawGrid(): void {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        for (let snake of this._snakes) {
            snake.draw();
        }
        context.lineWidth = 2;
        context.fillStyle = gridLineColor;
        const squareHeight = context.canvas.height / this._grid.height;
        for (let i = squareHeight; i < this._grid.height; i += squareHeight) {
            drawLine(0, i, context.canvas.width, i);
        }
        for (let i = squareHeight; i < this._grid.width; i += squareHeight) {
            drawLine(i, 0, i, context.canvas.height);
        }
    }

    public get paused() {
        return this._paused;
    }

    public checkKeyDown(keyCode: number) {
        for (let snake of this._snakes) {
            for (let property in snake.keyMap) {
                if (keyCode === snake.keyMap[property].keyCode) {
                    //player.setMovementInterval(property as Direction);
                    return;
                }
            }
        }
    }
}