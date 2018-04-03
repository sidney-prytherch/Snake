var Colors;
(function (Colors) {
    Colors["FOOD"] = "#683200";
    Colors["GRIDLINE"] = "#11293B";
    Colors["BACKGROUND"] = "#000000";
    Colors["BODY"] = "#1B3E58";
    Colors["RED"] = "#B30000";
    Colors["ORANGE"] = "#B36B00";
    Colors["YELLOW"] = "#B3B300";
    Colors["GREEN"] = "#33CC00";
    Colors["BLUE"] = "#0000B3";
    Colors["PURPLE"] = "#4D0099";
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
let snakes;
let food;
let snakeColors = { 1: Colors.RANDOM, 2: Colors.RANDOM };
let difficulty = 3;
let gridSize = 1;
let numberOfPlayers = 1;
const minCanvasHeight = 460;
const heightToWidthRatio = 3 / 2;
const minPxlPadding = 10;
const canvasBorder = 4;
const paddingHeightPercent = .02;
const minMenuBarWidth = 200;
const menuBarWidthPercent = .2;
const difficulties = { 1: 350, 2: 260, 3: 190, 4: 140, 5: 110 };
const gridWidths = { 1: 12, 2: 18, 3: 24, 4: 30, 5: 36 };
const directions = { up: 0, left: 1, down: 2, right: 3 };
const rainbowColors = [Colors.RED, Colors.ORANGE, Colors.YELLOW, Colors.GREEN, Colors.BLUE, Colors.PURPLE];
function removeCoord(coords, element) {
    for (let i = 0; i < coords.length; i++) {
        if (coords[i].x === element.x && coords[i].y === element.y) {
            coords.splice(i, 1);
            return;
        }
    }
}
function hexToRgb(hex) {
    hex = hex.substr(1);
    return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
    };
}
function setUpMenu() {
    const canvasHeight = parseInt(canvas.style.height, 10);
    const largestSquareHeight = canvasHeight / (gridWidths[1] / heightToWidthRatio);
    const menuHeight = canvasHeight - 2 * largestSquareHeight;
    menu.style.height = menuHeight + 'px';
    menu.style.width = parseInt(canvas.style.width, 10) + 'px';
    menu.style.top = parseInt(canvas.style.top, 10) + 2 * largestSquareHeight + canvasBorder + 'px';
    menu.style.left = parseInt(canvas.style.left, 10) + canvasBorder + 'px';
    const divs = menu.getElementsByTagName('div');
    for (let div of divs) {
        div.style.height = menuHeight / divs.length + 'px';
    }
    if (numberOfPlayers == 1) {
        divs[divs.length - 1].style.visibility = 'hidden';
        divs[divs.length - 2].style.visibility = 'hidden';
    }
    else {
        divs[divs.length - 1].style.visibility = 'visible';
        divs[divs.length - 2].style.visibility = 'visible';
    }
}
function setUpButtons() {
    const playerNumButtons = document.getElementsByClassName('playerNum');
    for (let playerNumButton of playerNumButtons) {
        playerNumButton.addEventListener('click', () => {
            const previousNumberOfPlayers = numberOfPlayers;
            numberOfPlayers = parseInt(playerNumButton.innerHTML);
            if (previousNumberOfPlayers !== numberOfPlayers) {
                setUpMenu();
                game.makeSnakes();
            }
        });
    }
    const difficultyButtons = document.getElementsByClassName('difficulty');
    for (let difficultyButton of difficultyButtons) {
        difficultyButton.addEventListener('click', () => {
            const previousDifficulty = difficulty;
            difficulty = parseInt(difficultyButton.innerHTML);
            if (previousDifficulty !== difficulty) {
                game.setDifficulty();
                game.makeSnakes();
            }
        });
    }
    const gridSizeButtons = document.getElementsByClassName('gridSize');
    for (let gridSizeButton of gridSizeButtons) {
        gridSizeButton.addEventListener('click', () => {
            const previousGridSize = gridSize;
            gridSize = parseInt(gridSizeButton.innerHTML);
            if (previousGridSize !== gridSize) {
                game.setGridSize();
                setUpMenu();
                game.makeSnakes();
            }
        });
    }
    for (let i = 1; i <= 2; i++) {
        const playerButtonOptions = document.getElementById('player' + i + 'ColorOptions');
        const playerColorButtons = playerButtonOptions.getElementsByTagName('button');
        for (let playerColorButton of playerColorButtons) {
            playerColorButton.addEventListener('click', () => {
                const color = playerColorButton.innerHTML.toUpperCase();
                const previousColor = snakeColors[i];
                snakeColors[i] = Colors[color];
                if (color === 'RANDOM') {
                    snakes[i - 1].resetFakeSnakeColor();
                }
                else if (previousColor === snakeColors[i]) {
                    return;
                }
                game.makeSnakes();
            });
        }
    }
}
window.addEventListener('keydown', (event) => {
    if (event.keyCode === 32) {
        event.preventDefault();
        if (game.hasStarted) {
            game.pause();
        }
        else {
            game.startGame();
        }
    }
    else if (!game.paused && game.hasStarted) {
        for (let i = 0; i < numberOfPlayers; i++) {
            for (let property in snakes[i].keyMap) {
                if (event.keyCode === snakes[i].keyMap[property]) {
                    if (snakes[i].direction % 2 !== directions[property] % 2) {
                        snakes[i].newDirection = directions[property];
                        snakes[i].queuedDirection = null;
                    }
                    else {
                        snakes[i].queuedDirection = directions[property];
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
    setUpMenu();
    setUpButtons();
}, false);
window.addEventListener('resize', () => {
    game.resize();
    if (!game.hasStarted) {
        for (let i = 0; i < numberOfPlayers; i++) {
            snakes[i].draw();
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
    constructor(playerNum) {
        this.keyMap = playerNum === 1 ? { left: 37, up: 38, right: 39, down: 40 } : { left: 65, up: 87, right: 68, down: 83 };
        this._playerNum = playerNum;
        this.resetFakeSnakeStats();
        this.resetFakeSnakeColor();
        this.resetFakeSnakePosition();
    }
    init() {
        this._isFake = false;
        this._segmentsToAdd = 0;
        if (this._playerNum === 1) {
            this._segments = [{ x: 5 * gridWidth / 6 - 1, y: gridHeight / 4 }];
            this.newDirection = this.direction = 1;
        }
        else {
            this._segments = [{ x: gridWidth / 6, y: 3 * gridHeight / 4 - 1 }];
            this.newDirection = this.direction = 3;
        }
        removeCoord(game.freeSpots, this._head);
    }
    resetFakeSnakeColor() {
        if (snakeColors[this._playerNum] === Colors.RANDOM) {
            this._colors = {
                r: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)],
                g: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)],
                b: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]
            };
        }
    }
    resetFakeSnakePosition() {
        if (this._playerNum === 1) {
            this._segments = [{ x: gridWidth - 1, y: 0 }];
            this.newDirection = this.direction = 1;
        }
        else {
            this._segments = [{ x: 0, y: 1 }];
            this.newDirection = this.direction = 3;
        }
        this._segmentsToAdd = growthPerFood;
    }
    resetFakeSnakeStats() {
        this.score = 0;
        this._isFake = true;
    }
    draw() {
        const translation = gridLineWidth / 2;
        const snakeWidth = squareHeight - gridLineWidth;
        if (snakeColors[this._playerNum] === Colors.RAINBOW) {
            let count = 0;
            const denominator = (this._segments.length - 1) || 1;
            for (let segment of this._segments) {
                let color = { r: 0, g: 0, b: 0 };
                if (denominator < 5) {
                    color = hexToRgb(rainbowColors[count]);
                    count++;
                }
                else {
                    const numerator = count * 5;
                    count++;
                    const offset = Math.floor(numerator / denominator);
                    if (offset === 5) {
                        color = hexToRgb(rainbowColors[offset]);
                    }
                    else {
                        const frac = numerator / denominator - offset;
                        const rgbColor1 = hexToRgb(rainbowColors[offset]);
                        const rgbColor2 = hexToRgb(rainbowColors[offset + 1]);
                        for (let c in color) {
                            color[c] = rgbColor1[c] + Math.round(frac * (rgbColor2[c] - rgbColor1[c]));
                        }
                    }
                }
                context.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                context.fillRect(segment.x * squareHeight + translation, segment.y * squareHeight + translation, snakeWidth, snakeWidth);
            }
        }
        else if (snakeColors[this._playerNum] === Colors.RANDOM) {
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
            context.fillStyle = snakeColors[this._playerNum];
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
        for (let i = 0; i < numberOfPlayers; i++) {
            for (let segment of snakes[i]._segments) {
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
            x: this._head.x + (this.newDirection % 2 === 1 ? this.newDirection - 2 : 0),
            y: this._head.y + (this.newDirection % 2 === 0 ? this.newDirection - 1 : 0)
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
        snakes = [new Snake(1), new Snake(2)];
        this._gameLoop = (timestamp) => {
            if (!this._lastTimeStamp) {
                this._lastTimeStamp = timestamp;
                for (let i = 0; i < numberOfPlayers; i++) {
                    snakes[i].draw();
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
                for (let i = 0; i < numberOfPlayers; i++) {
                    snakes[i].move();
                }
                for (let i = 0; i < numberOfPlayers; i++) {
                    snakes[i].checkForGameOver();
                }
                if (this._gameOver) {
                    game._resetGame();
                    return;
                }
                for (let i = 0; i < numberOfPlayers; i++) {
                    snakes[i].draw();
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
                for (let i = 0; i < numberOfPlayers; i++) {
                    snakes[i].draw();
                }
            }
            else if ((timestamp - this._lastTimeStamp) > this._difficulty) {
                this._lastTimeStamp = timestamp;
                this._drawGrid();
                for (let i = 0; i < numberOfPlayers; i++) {
                    snakes[i].move();
                    snakes[i].draw();
                }
            }
            this._loopId = requestAnimationFrame(this._fakeLoop);
        };
    }
    _resetGame() {
        this.stopAnimation();
        const messageElement = document.getElementById('options');
        if (numberOfPlayers === 1) {
            messageElement.innerHTML = '<p>You died. Your score was ' + snakes[0].score + '.</p>';
        }
        else {
            const message = '<p>' + (this._losers.length === 1 ? 'P' + this._losers[0] + ' died.' : 'Both snakes died.');
            messageElement.innerHTML = message + ' P1 got ' + snakes[0].score + ' and P2 got ' + snakes[1].score + '.</p>';
        }
        for (let snake of snakes) {
            snake.resetFakeSnakeStats();
        }
        menu.style.zIndex = '1';
        canvas.style.zIndex = '0';
        game.init();
    }
    makeSnakes() {
        game.stopAnimation();
        for (let i = 0; i < numberOfPlayers; i++) {
            snakes[i].resetFakeSnakePosition();
        }
        this._loopId = requestAnimationFrame(this._fakeLoop);
    }
    init() {
        this.hasStarted = false;
        this.setDifficulty();
        this.setGridSize();
        game.makeSnakes();
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
    }
    setDifficulty() {
        this._difficulty = difficulties[difficulty];
    }
    setGridSize() {
        gridWidth = gridWidths[gridSize];
        gridHeight = gridWidth / heightToWidthRatio;
        growthPerFood = gridWidth / 6;
        this.recalculateAndDrawGrid();
    }
    startGame() {
        this.stopAnimation();
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
        snakes[0].init();
        if (numberOfPlayers === 2) {
            snakes[1].init();
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
        this._drawGrid();
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
        const availHeight = window.innerHeight - 2 * (minPadding + canvasBorder);
        const availWidth = window.innerWidth - 2 * (minPadding + canvasBorder);
        context.canvas.height = Math.max(minCanvasHeight, Math.floor(Math.min(availHeight, availWidth / heightToWidthRatio)));
        context.canvas.width = Math.floor(context.canvas.height * heightToWidthRatio);
        canvas.style.height = context.canvas.height + 'px';
        canvas.style.width = context.canvas.width + 'px';
        canvas.style.top = Math.floor((window.innerHeight - context.canvas.height) / 2 - canvasBorder) + 'px';
        canvas.style.left = Math.floor((window.innerWidth - context.canvas.width) / 2 - canvasBorder) + 'px';
        squareHeight = context.canvas.height / gridHeight;
        gridLineWidth = Math.max(1, squareHeight / 10);
        this._drawGrid();
    }
    _drawGrid() {
        context.fillStyle = Colors.BACKGROUND;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.lineWidth = gridLineWidth;
        context.strokeStyle = Colors.GRIDLINE;
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
