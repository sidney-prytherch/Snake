var Colors;
(function (Colors) {
    Colors["RED"] = "#511313";
    Colors["ORANGE"] = "#54391e";
    Colors["YELLOW"] = "#4f4416";
    Colors["GREEN"] = "#0f401f";
    Colors["BLUE"] = "#171438";
    Colors["PURPLE"] = "#220032";
    Colors["RANDOM"] = "RANDOM";
    Colors["RAINBOW"] = "RAINBOW";
})(Colors || (Colors = {}));
let canvas;
let context;
let foodCoord;
let game;
let gridWidth;
let gridHeight;
let squareHeight;
let growthPerFood;
let gridLineWidth;
let isOnePlayer;
const heightToWidthRatio = 3 / 2;
const minPxlPadding = 10;
const canvasBorder = 4;
const paddingHeightPercent = .02;
const minMenuBarWidth = 200;
const menuBarWidthPercent = .2;
const difficulties = { 1: 400, 2: 300, 3: 200, 4: 150, 5: 100 };
const gridWidths = { 1: 12, 2: 18, 3: 24, 4: 30, 5: 36 };
const directions = { up: 0, left: 1, down: 2, right: 3 };
const backgroundColor = '#000000';
const gridLineColor = '#11293B';
const colors = [Colors.RED, Colors.ORANGE, Colors.YELLOW, Colors.GREEN, Colors.BLUE, Colors.PURPLE];
window.addEventListener('keydown', (event) => {
    if (event.keyCode === 49) {
        game._snakes[0].segmentsToAdd += growthPerFood; //TODO:remove
    }
    if (event.keyCode === 32) {
        game.pause();
    }
    else if (!game.paused) {
        game.checkKeyDown(event.keyCode);
    }
}, false);
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementsByTagName('canvas')[0];
    context = canvas.getContext('2d');
    game = new Game();
    game.startGame({ playerNum: 1, difficulty: 5, gridSize: 5 });
    isOnePlayer = true;
    game.recalculateAndDrawGrid();
}, false);
window.addEventListener('resize', () => {
    game.resize();
}, false);
window.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        game.pause(true);
    }
});
class Snake {
    constructor(playerNum, keyMap, colorOption) {
        this.segmentsToAdd = 0;
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
            this._segments = [{ x: 3 * gridWidth / 4 - 1, y: gridHeight / 4 }];
            this.direction = 1;
        }
        else {
            this._segments = [{ x: gridWidth / 4, y: 3 * gridHeight / 4 - 1 }];
            this.direction = 3;
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
    move() {
        this._segments.unshift({
            x: this._segments[0].x + ((this.direction % 2 === 1) ? this.direction - 2 : 0),
            y: this._segments[0].y + ((this.direction % 2 === 0) ? this.direction - 1 : 0)
        });
        if (this.segmentsToAdd > 0) {
            this.segmentsToAdd--;
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
            if (!this._lastTimeStamp || (timestamp - this._lastTimeStamp) > this._difficulty) {
                this._lastTimeStamp = timestamp;
                this._drawGrid();
                for (let snake of this._snakes) {
                    snake.move();
                    snake.draw();
                }
            }
            this._loopId = requestAnimationFrame(this._gameLoop);
        };
    }
    startGame(options) {
        this._playerNum = options.playerNum;
        this._difficulty = difficulties[options.difficulty];
        gridWidth = gridWidths[options.gridSize];
        gridHeight = gridWidth * 2 / 3;
        growthPerFood = gridWidth / 6;
        this._snakes = [new Snake(1, { left: 37, up: 38, right: 39, down: 40 }, Colors.RANDOM)];
        if (options.playerNum === 2) {
            this._snakes.push(new Snake(2, { left: 65, up: 87, right: 68, down: 83 }, Colors.RAINBOW));
        }
        this.startAnimation();
    }
    startAnimation() {
        this._loopId = requestAnimationFrame(this._gameLoop);
    }
    stopAnimation() {
        cancelAnimationFrame(this._loopId);
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
        if (!this._paused) {
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
        for (let i = 0; i <= context.canvas.height; i += squareHeight) {
            drawLine(0, Math.round(i), context.canvas.width, Math.round(i));
        }
        for (let i = 0; i <= context.canvas.width; i += squareHeight) {
            drawLine(i, 0, i, context.canvas.height);
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
    checkKeyDown(keyCode) {
        for (let snake of this._snakes) {
            for (let property in snake.keyMap) {
                if (keyCode === snake.keyMap[property]) {
                    if (snake.direction + 2 % 4 !== directions[property]) {
                        snake.direction = directions[property];
                    }
                    return;
                }
            }
        }
    }
}
