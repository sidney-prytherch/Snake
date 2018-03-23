class Game {

    private _paused = true;
    private _gridSquareWidth: number;
    private _gridSquareHeight: number;
    private _squarePixelLength: number;
    private _gameLoop: (timestamp: number) => void;
    private _loopId: number;
    private _lastTimeStamp: number;
    private _snakes: Snake[];
    private _gameOptions: {playerNum: number, difficulty: number, gridSize: number};
    private _difficulty = {1: 600, 2: 500, 3: 400, 4: 300, 5: 200};
    private _gridSize = {1: 10, 2: 15, 3: 20, 4: 25, 5: 30};

    constructor() {
        this._gameLoop = (timestamp) => {
            this._loopId = requestAnimationFrame(this._gameLoop);
            if (!this._lastTimeStamp || (timestamp - this._lastTimeStamp) > this._difficulty[this._gameOptions.difficulty]) {
                this._lastTimeStamp = timestamp;
                for (let snake of this._snakes) {
                    snake.draw();
                }
            }
        }
    }

    _paintSquare(coord: {x: number, y: number}) {
        //this._context;
    }

    startGame(options: {playerNum: number, difficulty: number, gridSize: number}) {
        this._gameOptions = options;
        this._snakes = [];
        this._snakes.push(new Snake(1, {left: 37, up: 38, right: 39,  down: 40}));
        if (this._gameOptions.playerNum === 2) {
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
            this.pause();
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

class Snake {

    public playerNum: number
    public keyMap: KeyMap;
    private _headColor: string;
    private _segments: number;
    private _colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];

    constructor(playerNum: number, keyMap: KeyMap){
        this.keyMap = keyMap;
        this.playerNum = playerNum;
    }

    draw() {
        let color = this._headColor;
        for (let i = 0; i < this._segments; i++) {
            //stuff
            color
        }
    }
}

type KeyMap = {up: number, right: number, down: number, left: number};
type Direction = 'up' | 'right' | 'left' | 'down';

let foodCoord: {x: number, y: number};
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let game: Game;

document.addEventListener('keydown', (event) => {
    if (event.keyCode === 32) {
        game.pause();
    } else if (!game.paused) {
        game.checkKeyDown(event.keyCode);
    }
}, false);

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;
    context = canvas.getContext('2d');
    game = new Game();
}, false);

document.addEventListener('resize', () => {
    game.resize();
});



