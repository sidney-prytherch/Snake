
type KeyMap = {up: number, right: number, down: number, left: number};

export default class Snake {
    
    public playerNum: number
    public keyMap: KeyMap;
    private _headColor: string;
    private _segments: number;
    private _colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
    
    constructor(playerNum: number, keyMap: KeyMap) {
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
