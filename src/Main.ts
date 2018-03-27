import Game from './Game';

type Direction = 'up' | 'right' | 'left' | 'down';

export let canvas: HTMLCanvasElement;
export let context: CanvasRenderingContext2D;
let foodCoord: {x: number, y: number};
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
    context.fillStyle = 'black';
    context.fillRect(0,0,context.canvas.width, context.canvas.height);
    game.resize();
});