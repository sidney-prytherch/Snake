type Direction = 'up' | 'left' | 'down' | 'right';
type KeyMap = {up: number, left: number, down: number, right: number};
type Coord = {x: number, y: number};


const gameSettings = {playerNum: 1, difficulty: 5, gridSize: 4};

enum Colors {
    FOOD = '#683200',
    RED = '#511313',
    ORANGE = '#54391E',
    YELLOW = '#4F4416',
    GREEN = '#0F401F',
    BLUE = '#171438',
    PURPLE = '#220032',
    RANDOM = 'RANDOM',
    RAINBOW = 'RAINBOW'
}

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
let snakes: Snake[];
let food: Coord;

const heightToWidthRatio = 3 / 2;
const minPxlPadding = 10;
const canvasBorder = 4;
const paddingHeightPercent = .02;
const minMenuBarWidth = 200;
const menuBarWidthPercent = .2;
const difficulties = {1: 1000, 2: 300, 3: 200, 4: 150, 5: 100};
const gridWidths = {1: 12, 2: 18, 3: 24, 4: 30, 5: 36};
const directions = {up: 0, left: 1, down: 2, right: 3};
const backgroundColor = '#000000';
const gridLineColor = '#11293B';
const colors = [Colors.RED, Colors.ORANGE, Colors.YELLOW, Colors.GREEN, Colors.BLUE, Colors.PURPLE];

function removeCoord(coords: Coord[], element: Coord) {
    for (let i = 0; i < coords.length; i++) {
        if (coords[i].x === element.x && coords[i].y === element.y) {
            coords.splice(i, 1);
            return;
        }
    }
}

window.addEventListener('keydown', (event) => {
    if (event.keyCode === 49) {
        (snakes[0] as any)._segmentsToAdd+=growthPerFood;//TODO:remove
    }
    if (event.keyCode === 32) {
        game.pause();
    } else if (!game.paused) {
        for (let snake of snakes) {
            for (let property in snake.keyMap) {
                if (event.keyCode === snake.keyMap[property]) {
                    if (snake.direction % 2 !== directions[property] % 2) {
                        snake.newDirection = directions[property];
                        snake.queuedDirection = null;
                    } else {
                        snake.queuedDirection = directions[property];
                    }
                    return;
                }
            }
        }
    }
}, false);

window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;
    context = canvas.getContext('2d');
    game = new Game();
    game.startGame(gameSettings);
    game.recalculateAndDrawGrid();
}, false);

window.addEventListener('resize', () => {
    game.resize();
}, false);

window.addEventListener('visibilitychange', function() {
    if (document.hidden){
        game.pause(true);
    }
});
























class Snake {
    
    private _playerNum: number;
    public score: number;
    public keyMap: KeyMap;
    public direction: number;
    public newDirection: number;
    public queuedDirection: number;
    private _color: Colors;
    private _segments: Coord[];
    private _segmentsToAdd: number;
    private _colors: {r: number[], g: number[], b: number[]};
    
    constructor(playerNum: number, keyMap: KeyMap, colorOption: Colors) {
        this._segmentsToAdd = 0;
        this.keyMap = keyMap;
        this._playerNum = playerNum;
        this._color = colorOption;
        if (colorOption = Colors.RANDOM) {
            this._colors = {
                r: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)],
                g: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)],
                b: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]
            };
        }
        if (playerNum === 1) {
            this._segments = [{x: 5 * gridWidth / 6 - 1, y: gridHeight / 4}];
            this.newDirection = this.direction = 1;
        } else {
            this._segments = [{x: gridWidth / 6, y: 3 * gridHeight / 4 - 1}];
            this.newDirection = this.direction = 3;
        }
        console.warn(this._segments);
        removeCoord(game.freeSpots, this._head);
    }
    
    draw() {
        const translation = gridLineWidth / 2;
        const snakeWidth = squareHeight - gridLineWidth;
        if (this._color === Colors.RAINBOW) {
            let colorCount = 0;
            for (let segment of this._segments) {
                context.fillStyle = colors[colorCount];
                colorCount = (colorCount === colors.length - 1) ? 0 : colorCount + 1;
                context.fillRect(segment.x * squareHeight + translation, 
                    segment.y * squareHeight + translation, snakeWidth, snakeWidth);
            }
        } else if (this._color === Colors.RANDOM) {
            let count = 0;
            for (let segment of this._segments) {
                const frac = count / ((this._segments.length - 1) || 1);
                count++;
                let color = {r: 0, g: 0, b: 0};
                for (let c in this._colors) {
                    color[c] = this._colors[c][0] + Math.round(frac * (this._colors[c][1] - this._colors[c][0]));
                }
                context.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                context.fillRect(segment.x * squareHeight + translation, 
                    segment.y * squareHeight + translation, snakeWidth, snakeWidth);
            }
        }
        else {
            context.fillStyle = this._color;
            for (let segment of this._segments) {
                context.fillRect(segment.x * squareHeight + translation, segment.y * squareHeight + translation, snakeWidth, snakeWidth);
            }
        }
    }

    private _checkFood() {
        if (this._head.x === food.x && this._head.y === food.y) {
            this.score++;
            game.foodEaten = true;
            this._segmentsToAdd += growthPerFood;
        }
    }

    public checkForGameOver() {
        if (this._head.x < 0 || this._head.x > gridWidth || this._head.y < 0 || this._head.y > gridHeight) {
            game.gameOver(this._playerNum);
        }
        for (let snake of snakes) {
            for (let segment of snake._segments) {
                if (this._head !== segment && this._head.x === segment.x && this._head.y === segment.y) {
                    game.gameOver(this._playerNum);
                }
            }
        }
    }

    private get _head() {
        return this._segments[0];
    }

    public move() {
        const newHead = {
            x: this._head.x + ((this.newDirection % 2 === 1) ? this.newDirection - 2 : 0),
            y: this._head.y + ((this.newDirection % 2 === 0) ? this.newDirection - 1 : 0)
        };
        this.direction = this.newDirection;
        if (!!this.queuedDirection) {
            if (this.direction % 2 !== this.queuedDirection % 2) {
                this.newDirection = this.queuedDirection;
            }
            this.queuedDirection = null;
        }
        this._segments.unshift(newHead);
        removeCoord(game.freeSpots, newHead);
        this._checkFood();
        if (this._segmentsToAdd > 0) {
            this._segmentsToAdd--;
        } else {
            game.freeSpots.push(this._segments.pop());
        }
    }
}





























class Game {
    
    private _playerNum: number;
    private _paused = false;
    private _gameLoop: (timestamp: number) => void;
    private _loopId: number;
    private _lastTimeStamp: number;
    private _difficulty: number;
    private _gameOver: boolean;
    public foodEaten: boolean;
    public freeSpots: Coord[];
    private _losers: number[];
    
    constructor() {
        this._gameLoop = (timestamp) => {
            if (!this._lastTimeStamp || (timestamp - this._lastTimeStamp) > this._difficulty) {
                this._lastTimeStamp = timestamp;
                this._drawGrid();
                for (let snake of snakes) {
                    snake.move();
                    snake.draw(); 
                }
                for (let snake of snakes) {
                    snake.checkForGameOver();
                }
                if (this._gameOver) {
                    //do stuff
                    return;
                }
                if (this.foodEaten) {
                    this._spawnFood();
                }
                const translation = gridLineWidth * 2;
                const foodWidth = squareHeight - 4 * gridLineWidth;
                context.fillStyle = Colors.FOOD;
                context.fillRect(food.x * squareHeight + translation, food.y * squareHeight + translation, foodWidth, foodWidth);
            }
            if (!this._paused && !this._gameOver) {
                this._loopId = requestAnimationFrame(this._gameLoop);
            }
        }
    }

    private _spawnFood() {
        this.foodEaten = false;
        if (this.freeSpots.length === 0) {
            this.gameOver(-1);
            return;
        }
        food = this.freeSpots[Math.floor(Math.random() * this.freeSpots.length)];
    }

    public gameOver(playerNum: number) {
        this._gameOver = true;
        this._losers.push(playerNum);
        this.pause(true);
    }
    
    public startGame(options: {playerNum: number, difficulty: number, gridSize: number}) {
        this._losers = [];
        this._gameOver = false;
        this._playerNum = options.playerNum;
        this._difficulty = difficulties[options.difficulty];
        gridWidth = gridWidths[options.gridSize];
        gridHeight = gridWidth * 2 / 3;
        this.freeSpots = [];
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                this.freeSpots.push({x, y});
            }
        }
        growthPerFood = gridWidth / 6;
        snakes = [new Snake(1, {left: 37, up: 38, right: 39,  down: 40}, Colors.RANDOM)];
        if (options.playerNum === 2) {
            snakes.push(new Snake(2, {left: 65, up: 87, right: 68,  down: 83}, Colors.RAINBOW));
        }
        this._spawnFood();
        this.startAnimation();
    }
    
    public startAnimation() {
        this._loopId = requestAnimationFrame(this._gameLoop);
    }

    public stopAnimation() {
        cancelAnimationFrame(this._loopId);
        this._lastTimeStamp = null;
    }
    
    public pause(pause: boolean = !this._paused) {
        if (pause) {
            if (!this._paused) {
                this.stopAnimation();
                this._drawGrid();
            } else {
                return;
            }
        } else if (this._paused) {
            this.startAnimation();
        }
        this._paused = pause;
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
        for (let i = 0; i <= gridHeight; i ++) {
            drawLine(0, i * squareHeight, context.canvas.width, i * squareHeight);
        }
        for (let i = 0; i <= gridWidth; i ++) {
            drawLine(i * squareHeight, 0, i * squareHeight, context.canvas.height);
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
}