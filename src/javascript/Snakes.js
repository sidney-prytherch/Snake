var Colors;
(function (Colors) {
    Colors["FOOD"] = "#683200";
    Colors["RED"] = "#511313";
    Colors["ORANGE"] = "#54391E";
    Colors["YELLOW"] = "#4F4416";
    Colors["GREEN"] = "#0F401F";
    Colors["BLUE"] = "#171438";
    Colors["PURPLE"] = "#220032";
    Colors["RANDOM"] = "RANDOM";
    Colors["RAINBOW"] = "RAINBOW";
})(Colors || (Colors = {}));
let canvas;
let menu;
let context;
let foodCoord;
let game;
let gridWidth;
let gridHeight;
let squareHeight;
let growthPerFood;
let gridLineWidth;
let isOnePlayer;
let snakes;
let food;
let snakeColors = { 1: Colors.RANDOM, 2: Colors.RANDOM };
let difficulty = 3;
let gridSize = 1;
let numberOfPlayers = 2;
const heightToWidthRatio = 3 / 2;
const minPxlPadding = 10;
const canvasBorder = 4;
const paddingHeightPercent = .02;
const minMenuBarWidth = 200;
const menuBarWidthPercent = .2;
const difficulties = { 1: 1000, 2: 300, 3: 200, 4: 150, 5: 100 };
const gridWidths = { 1: 12, 2: 18, 3: 24, 4: 30, 5: 36 };
const directions = { up: 0, left: 1, down: 2, right: 3 };
const backgroundColor = '#000000';
const gridLineColor = '#11293B';
const colors = [Colors.RED, Colors.ORANGE, Colors.YELLOW, Colors.GREEN, Colors.BLUE, Colors.PURPLE];
function removeCoord(coords, element) {
    for (let i = 0; i < coords.length; i++) {
        if (coords[i].x === element.x && coords[i].y === element.y) {
            coords.splice(i, 1);
            return;
        }
    }
}
function setUpMenu() {
    menu.style.height = parseInt(canvas.style.height, 10) - 2 * squareHeight - gridLineWidth / 2 + 'px';
    menu.style.width = parseInt(canvas.style.width, 10) - gridLineWidth / 2 + 'px';
    menu.style.top = parseInt(canvas.style.top, 10) + 2 * squareHeight + canvasBorder + 'px';
    menu.style.left = parseInt(canvas.style.left, 10) + canvasBorder + 'px';
}
window.addEventListener('keydown', (event) => {
    if (event.keyCode === 49) {
        snakes[0]._segmentsToAdd += growthPerFood; //TODO:remove
    }
    if (event.keyCode === 32) {
        if (game.hasStarted) {
            game.pause();
        }
        else {
            game.startGame();
        }
    }
    else if (!game.paused) {
        for (let snake of snakes) {
            for (let property in snake.keyMap) {
                if (event.keyCode === snake.keyMap[property]) {
                    if (snake.direction % 2 !== directions[property] % 2) {
                        snake.newDirection = directions[property];
                        snake.queuedDirection = null;
                    }
                    else {
                        snake.queuedDirection = directions[property];
                    }
                    return;
                }
            }
        }
    }
}, false);
window.addEventListener('DOMContentLoaded', () => {
    menu = document.getElementById('menu');
    canvas = document.getElementsByTagName('canvas')[0];
    context = canvas.getContext('2d');
    game = new Game();
    game.init();
    game.makeFakeSnakes();
    setUpMenu();
    //game.startGame(gameSettings);
}, false);
window.addEventListener('resize', () => {
    game.resize();
    if (!game.hasStarted) {
        for (let snake of snakes) {
            snake.draw();
        }
        setUpMenu();
    }
}, false);
window.addEventListener('visibilitychange', function () {
    if (document.hidden && game.hasStarted) {
        game.pause(true);
    }
});
class Snake {
    constructor(playerNum, keyMap, colorOption, isFake = false) {
        this._isFake = isFake;
        this._segmentsToAdd = (this._isFake) ? growthPerFood : 0;
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
            this._segments = (!this._isFake) ? [{ x: 5 * gridWidth / 6 - 1, y: gridHeight / 4 }] : [{ x: gridWidth - 1, y: 0 }];
            this.newDirection = this.direction = 1;
        }
        else {
            this._segments = (!this._isFake) ? [{ x: gridWidth / 6, y: 3 * gridHeight / 4 - 1 }] : [{ x: 0, y: 1 }];
            this.newDirection = this.direction = 3;
        }
        if (!this._isFake) {
            removeCoord(game.freeSpots, this._head);
        }
    }
    draw() {
        const translation = gridLineWidth / 2;
        const snakeWidth = squareHeight - gridLineWidth;
        if (this._color === Colors.RAINBOW) {
            let colorCount = 0;
            for (let segment of this._segments) {
                context.fillStyle = colors[colorCount];
                colorCount = (colorCount === colors.length - 1) ? 0 : colorCount + 1;
                context.fillRect(segment.x * squareHeight + translation, segment.y * squareHeight + translation, snakeWidth, snakeWidth);
            }
        }
        else if (this._color === Colors.RANDOM) {
            let count = 0;
            for (let segment of this._segments) {
                const frac = count / ((this._segments.length - 1) || 1);
                count++;
                let color = { r: 0, g: 0, b: 0 };
                for (let c in this._colors) {
                    color[c] = this._colors[c][0] + Math.round(frac * (this._colors[c][1] - this._colors[c][0]));
                }
                context.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                context.fillRect(segment.x * squareHeight + translation, segment.y * squareHeight + translation, snakeWidth, snakeWidth);
            }
        }
        else {
            context.fillStyle = this._color;
            for (let segment of this._segments) {
                context.fillRect(segment.x * squareHeight + translation, segment.y * squareHeight + translation, snakeWidth, snakeWidth);
            }
        }
    }
    _checkFood() {
        if (this._head.x === food.x && this._head.y === food.y) {
            this.score++;
            game.foodEaten = true;
            this._segmentsToAdd += growthPerFood;
        }
    }
    checkForGameOver() {
        if (this._head.x < 0 || this._head.x >= gridWidth || this._head.y < 0 || this._head.y >= gridHeight) {
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
    get _head() {
        return this._segments[0];
    }
    move() {
        const newHead = {
            x: this._head.x + ((this.newDirection % 2 === 1) ? this.newDirection - 2 : 0),
            y: this._head.y + ((this.newDirection % 2 === 0) ? this.newDirection - 1 : 0)
        };
        this.direction = this.newDirection;
        if (!this._isFake) {
            if (!!this.queuedDirection) {
                if (this.direction % 2 !== this.queuedDirection % 2) {
                    this.newDirection = this.queuedDirection;
                }
                this.queuedDirection = null;
            }
            this._segments.unshift(newHead);
            removeCoord(game.freeSpots, newHead);
            this._checkFood();
        }
        else {
            if (newHead.x === 0 && newHead.y === 0) {
                this.newDirection = directions['down'];
            }
            else if (newHead.x === 0 && newHead.y === 1) {
                this.newDirection = directions['right'];
            }
            else if (newHead.x === gridWidth - 1 && newHead.y === 1) {
                this.newDirection = directions['up'];
            }
            else if (newHead.x === gridWidth - 1 && newHead.y === 0) {
                this.newDirection = directions['left'];
            }
            this._segments.unshift(newHead);
        }
        if (this._segmentsToAdd > 0) {
            this._segmentsToAdd--;
        }
        else if (!this._isFake) {
            game.freeSpots.push(this._segments.pop());
        }
        else {
            this._segments.pop();
        }
    }
}
class Game {
    constructor() {
        this._paused = false;
        this._gameLoop = (timestamp) => {
            if (!this._lastTimeStamp) {
                this._lastTimeStamp = timestamp;
                for (let snake of snakes) {
                    snake.draw();
                }
                if (this._firstAnimtionsFrame) {
                    this._firstAnimtionsFrame = false;
                    this._spawnFood();
                }
                this._drawFood();
            }
            else if ((timestamp - this._lastTimeStamp) > this._difficulty) {
                this._lastTimeStamp = timestamp;
                this._drawGrid();
                for (let snake of snakes) {
                    snake.move();
                }
                for (let snake of snakes) {
                    snake.checkForGameOver();
                }
                if (!this._gameOver) {
                    for (let snake of snakes) {
                        snake.draw();
                    }
                }
                if (this._gameOver) {
                    //do stuff
                    return;
                }
                if (this.foodEaten) {
                    this._spawnFood();
                }
                this._drawFood();
            }
            if (!this._paused) {
                this._loopId = requestAnimationFrame(this._gameLoop);
            }
        };
        this._fakeLoop = (timestamp) => {
            if (!this._lastTimeStamp) {
                this._lastTimeStamp = timestamp;
                for (let snake of snakes) {
                    snake.draw();
                }
            }
            else if ((timestamp - this._lastTimeStamp) > this._difficulty) {
                this._lastTimeStamp = timestamp;
                this._drawGrid();
                for (let snake of snakes) {
                    snake.move();
                    snake.draw();
                }
            }
            this._loopId = requestAnimationFrame(this._fakeLoop);
        };
    }
    makeFakeSnakes() {
        snakes = [new Snake(1, { left: null, up: null, right: null, down: null }, snakeColors[1], true)];
        if (numberOfPlayers === 2) {
            snakes.push(new Snake(2, { left: null, up: null, right: null, down: null }, snakeColors[2], true));
        }
        this._loopId = requestAnimationFrame(this._fakeLoop);
    }
    init() {
        this.hasStarted = false;
        this.setDifficulty();
        this.setGridSize();
    }
    _spawnFood() {
        this.foodEaten = false;
        if (this.freeSpots.length === 0) {
            this.gameOver(-1);
            return;
        }
        food = this.freeSpots[Math.floor(Math.random() * this.freeSpots.length)];
    }
    _drawFood() {
        const translation = gridLineWidth * 2;
        const foodWidth = squareHeight - 4 * gridLineWidth;
        context.fillStyle = Colors.FOOD;
        context.fillRect(food.x * squareHeight + translation, food.y * squareHeight + translation, foodWidth, foodWidth);
    }
    gameOver(playerNum) {
        this._gameOver = true;
        this._losers.push(playerNum);
        this.pause(true);
    }
    setDifficulty() {
        this._difficulty = difficulties[difficulty];
    }
    setGridSize() {
        gridWidth = gridWidths[gridSize];
        gridHeight = gridWidth * 2 / 3;
        growthPerFood = gridWidth / 6;
        this.recalculateAndDrawGrid();
    }
    startGame() {
        this.stopAnimation();
        this._drawGrid();
        menu.style.zIndex = '0';
        canvas.style.zIndex = '1';
        this.hasStarted = true;
        this._losers = [];
        this._gameOver = false;
        this.freeSpots = [];
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                this.freeSpots.push({ x, y });
            }
        }
        snakes = [new Snake(1, { left: 37, up: 38, right: 39, down: 40 }, snakeColors[1])];
        if (numberOfPlayers === 2) {
            snakes.push(new Snake(2, { left: 65, up: 87, right: 68, down: 83 }, snakeColors[2]));
        }
        this._spawnFood();
        this.startAnimation(true);
    }
    startAnimation(initialStart = false) {
        if (initialStart) {
            this._firstAnimtionsFrame = true;
        }
        this._loopId = requestAnimationFrame(this._gameLoop);
    }
    stopAnimation() {
        cancelAnimationFrame(this._loopId);
        this._lastTimeStamp = null;
    }
    pause(pause = !this._paused) {
        if (pause) {
            if (!this._paused) {
                this.stopAnimation();
                this._drawGrid();
            }
            else {
                return;
            }
        }
        else if (this._paused) {
            this.startAnimation();
        }
        this._paused = pause;
    }
    resize() {
        if (!this._paused && game.hasStarted) {
            this.pause(true);
        }
        this.recalculateAndDrawGrid();
    }
    recalculateAndDrawGrid() {
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
    _drawGrid() {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.lineWidth = gridLineWidth;
        context.strokeStyle = gridLineColor;
        for (let i = 0; i <= gridHeight; i++) {
            drawLine(0, i * squareHeight, context.canvas.width, i * squareHeight);
        }
        for (let i = 0; i <= gridWidth; i++) {
            drawLine(i * squareHeight, 0, i * squareHeight, context.canvas.height);
        }
        function drawLine(x1, y1, x2, y2) {
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
        }
    }
    get paused() {
        return this._paused;
    }
}
