type Direction = 'up' | 'left' | 'down' | 'right';
type KeyMap = {up: number, left: number, down: number, right: number};

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let foodCoord: {x: number, y: number};
let game: Game;
let gridWidth: number;
let gridHeight: number;
let squareHeight;
let growthPerFood: number;
let gridLineWidth: number;
let isOnePlayer: boolean;

const heightToWidthRatio = 3 / 2;
const minPxlPadding = 10;
const canvasBorder = 4;
const paddingHeightPercent = .02;
const minMenuBarWidth = 200;
const menuBarWidthPercent = .2;
const difficulties = {1: 600, 2: 500, 3: 400, 4: 300, 5: 200};
const gridWidths = {1: 12, 2: 18, 3: 24, 4: 30, 5: 36};
const directions = {up: 0, left: 1, down: 2, right: 3};
const backgroundColor = '#000000';
const gridLineColor = '#11293B';
const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082'];



window.addEventListener('keydown', (event) => {
    if (event.keyCode === 32) {
        game._snakes[0].segmentsToAdd+=2;//TODO:remove
        //game.pause();
    } else if (!game.paused) {
        game.checkKeyDown(event.keyCode);
    }
}, false);

window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;
    context = canvas.getContext('2d');
    game = new Game();
    game.startGame({playerNum: 1, difficulty: 5, gridSize: 3});
    isOnePlayer = false;
    game.recalculateAndDrawGrid();
}, false);

window.addEventListener('resize', () => {
    game.resize();
}, false);
























class Snake {
    
    private _playerNum: number;
    public keyMap: KeyMap;
    public direction: number;
    private _color: string = colors[0];
    private _segments: {x: number, y: number}[];
    public segmentsToAdd = 0;
    
    constructor(playerNum: number, keyMap: KeyMap) {
        this.keyMap = keyMap;
        this._playerNum = playerNum;
        this._segments
        if (playerNum === 1) {
            this._segments = [{x: 3 * gridWidth / 4 - 1, y: gridHeight / 4}];
            this.direction = 1;
        } else {
            this._segments = [{x: gridWidth / 4, y: 3 * gridHeight / 4 - 1}];
            this.direction = 3;
        }
    }
    
    draw() {
        const translation = gridLineWidth / 2;
        const snakeWidth = squareHeight - gridLineWidth;
        if (isOnePlayer) {
            let colorCount = 0;
            for (let segment of this._segments) {
                context.fillStyle = colors[colorCount];
                colorCount = (colorCount === colors.length - 1) ? 0 : colorCount + 1;
                context.fillRect(segment.x * squareHeight + translation, 
                    segment.y * squareHeight + translation, snakeWidth, snakeWidth);
            }
        } else {
            context.fillStyle = (this._playerNum === 1) ? colors[0] : colors[4];
            for (let segment of this._segments) {
                context.fillRect(segment.x * squareHeight + translation, 
                    segment.y * squareHeight + translation, snakeWidth, snakeWidth);
            }
        }
    }

    move() {
        this._segments.unshift({
            x: this._segments[0].x + ((this.direction % 2 === 1) ? this.direction - 2 : 0),
            y: this._segments[0].y + ((this.direction % 2 === 0) ? this.direction - 1 : 0)
        });
        if (this.segmentsToAdd > 0) {
            this.segmentsToAdd--;
        } else {
            this._segments.pop();
        }
    }
}





























class Game {
    
    private _playerNum: number;
    private _paused = false;
    private _gameLoop: (timestamp: number) => void;
    private _loopId: number;
    private _lastTimeStamp: number;
    public _snakes: Snake[];
    private _difficulty: number;
    
    constructor() {
        this._gameLoop = (timestamp) => {
            if (!this._lastTimeStamp || (timestamp - this._lastTimeStamp) > this._difficulty) {
                this._lastTimeStamp = timestamp;
                this._drawGrid();
                for (let snake of this._snakes) {
                    snake.move();
                    snake.draw();                    
                }
            }
            this._loopId = requestAnimationFrame(this._gameLoop);
        }
    }
    
    startGame(options: {playerNum: number, difficulty: number, gridSize: number}) {
        this._playerNum = options.playerNum;
        this._difficulty = difficulties[options.difficulty];
        gridWidth = gridWidths[options.gridSize];
        gridHeight = gridWidth * 2 / 3;
        growthPerFood = gridWidth / 2;
        this._snakes = [new Snake(1, {left: 37, up: 38, right: 39,  down: 40})];
        if (options.playerNum === 2) {
            this._snakes.push(new Snake(2, {left: 65, up: 87, right: 68,  down: 83}));
        }
        this._loopId = requestAnimationFrame(this._gameLoop);

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
        this.recalculateAndDrawGrid();
    }

    public recalculateAndDrawGrid() {
        const minPadding = Math.max(minPxlPadding, paddingHeightPercent * window.innerHeight);
        const menuBarWidth = Math.max(minMenuBarWidth, menuBarWidthPercent * window.innerWidth);
        const availHeight = window.innerHeight - 2 * (minPadding + canvasBorder);
        const availWidth = window.innerWidth - 2 * (minPadding + canvasBorder) - menuBarWidth;
        context.canvas.height = Math.floor(Math.min(availHeight, availWidth / heightToWidthRatio));
        context.canvas.width = Math.floor(context.canvas.height * heightToWidthRatio);
        canvas.style.height = context.canvas.height + 'px';
        canvas.style.width = context.canvas.width + 'px';
        canvas.style.top = Math.floor((window.innerHeight - context.canvas.height) / 2 - canvasBorder) + 'px';
        canvas.style.left = Math.floor(menuBarWidth + minPadding + canvasBorder) + 'px';
        squareHeight = context.canvas.height / gridHeight;
        gridLineWidth = Math.max(1, squareHeight / 10);
        this._drawGrid();
    }

    private _drawGrid(): void {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.lineWidth = gridLineWidth;
        context.strokeStyle = gridLineColor;
        for (let i = squareHeight; i < context.canvas.height; i += squareHeight) {
            drawLine(0, Math.round(i), context.canvas.width, Math.round(i));
        }
        for (let i = squareHeight; i < context.canvas.width; i += squareHeight) {
            drawLine(i, 0, i, context.canvas.height);
        }
        function drawLine(x1: number, y1: number, x2: number, y2: number) {
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
        }
    }


    public get paused() {
        return this._paused;
    }

    public checkKeyDown(keyCode: number) {
        for (let snake of this._snakes) {
            for (let property in snake.keyMap) {
                if (keyCode === snake.keyMap[property]) {
                    if (snake.direction + 2 % 4 !== directions[property]) {
                        snake.direction = directions[property]
                    }
                    return;
                }
            }
        }
    }
}