
import { _decorator, Component, Node, Prefab, instantiate, Vec3, systemEvent, SystemEvent, EventMouse } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = Field
 * DateTime = Sun Nov 21 2021 13:03:19 GMT+0300 (Москва, стандартное время)
 * Author = Alibek_Alim_
 * FileBasename = Field.ts
 * FileBasenameNoExtension = Field
 * URL = db://assets/Scripts/Field.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */
type TileType = {
    isCheckedOutNeighboring: boolean,
    node: Node
} 

@ccclass('Field')
export class Field extends Component {

    private columnsAmount: number = 8;
    private rowsAmount: number = 8;
    private firstColumnPositionByX: number = -179;
    private tileSize: number = 51;
    private fieldHeight: number = 420;
    private matrix: TileType[][] = [];
    private minNumberOfTilesForBlast: number = 2;

    @property({type: Prefab})
    private greenPrefab: Prefab | null = null;
    @property({type: Prefab})
    private bluePrefab: Prefab | null = null;
    @property({type: Prefab})
    private yellowPrefab: Prefab | null = null;
    @property({type: Prefab})
    private redPrefab: Prefab | null = null;
    @property({type: Prefab})
    private purplePrefab: Prefab | null = null;

    private tilePrefabs: Prefab[] | null[] = [];

    onLoad() {
        this.tilePrefabs = [
            this.greenPrefab, this.bluePrefab, this.yellowPrefab, this.purplePrefab, this.redPrefab
        ]
    }

    start () {
        if (this.tilePrefabs.length && !this.tilePrefabs.find(prfb => prfb === null)) {
           this.createMatrix(); 
        }
    }

    createMatrix() {
        for (let i = 0; i < this.columnsAmount; i++) {

            let column: TileType[] = [];
            for (let j = 0; j < this.rowsAmount; j++) {
                const tileObj = this.createTile();
                column.push(tileObj);
                this.addTileNode(tileObj, i, j);
            }
            this.matrix.push(column);
        }
        console.log(this.matrix);
    }

    fillMatrix() {
        for (let i = 0; i < this.columnsAmount; i++) {
            const column = this.matrix[i];

            for (let j = column.length; j < this.rowsAmount; j++) {
                const tileObj = this.createTile();
                column.push(tileObj);
                this.addTileNode(tileObj, i, j);
            }
        }
    }

    createTile() {
        const randomPrefabIndex = Math.floor(Math.random() * this.tilePrefabs.length);
        const tileNode = instantiate(this.tilePrefabs[randomPrefabIndex])
        return {
            isCheckedOutNeighboring: false,
            node: tileNode
        }
    }

    addTileNode(tileObj: TileType, colIndex: number, rowIndex: number) {

        setTimeout(() => {
            this.node.addChild(tileObj.node); 
        }, 100); 
        
        tileObj.node.setPosition(new Vec3(
            this.firstColumnPositionByX + this.tileSize * colIndex, 
            this.fieldHeight/2 + this.tileSize*rowIndex,
        ));

        const onTileNodeClick = (event: EventMouse) => { 
            this.onTileClick(tileObj, event.getButton());
        }
        tileObj.node.on(SystemEvent.EventType.MOUSE_UP, onTileNodeClick);
    }

    onTileClick(tileObj: TileType, mouseKey: number) {
        switch(mouseKey) {
            case 0 :
                this.checkNeighbors(tileObj);
                break;
            case 2 : 
                // вызов метода перестановки плиток
                break;
            default: break;
        }
    }

    checkNeighbors(tileObj: TileType) {
        const tileNodeName = tileObj.node.name;
        const {col, row} = this.getTilePosition(tileObj);
        const sameTiles: TileType[] = [];
        
        const check = (col: number, row: number) => {
            const curTile = this.matrix[col][row];
            
            if (curTile.isCheckedOutNeighboring) return;

            sameTiles.push(curTile);
            curTile.isCheckedOutNeighboring = true;
            
            if (this.matrix[col][row-1]?.node.name === tileNodeName) {
                check(col, row-1);
            }
            if (this.matrix[col][row+1]?.node.name === tileNodeName) {
                check(col, row+1);
            }
            if (this.matrix[col-1]?.[row].node.name === tileNodeName) {
                check(col-1, row);
            }
            if (this.matrix[col+1]?.[row].node.name === tileNodeName) {
                check(col+1, row);
            }
        }
        
        check(col, row);
        if (sameTiles.length < this.minNumberOfTilesForBlast) {
            sameTiles.forEach(tile => tile.isCheckedOutNeighboring = false);
            return;
        }

        this.blastTiles(sameTiles);
        
    }

    getTilePosition(tileObj: TileType) {
        let pos: {col: number, row: number} = null;
        for (let i = 0; (i < this.matrix.length && !pos); i++) {

            for (let j = 0; j < this.rowsAmount && !pos; j++) {

                if (this.matrix[i][j].node === tileObj.node) {
                    pos = {col: i, row: j}
                    console.log('pos', pos);
                }
            }
        }
        return pos;
    }

    blastTiles(sameTiles: TileType[]) {
        sameTiles.forEach(tile => {
            tile.node.destroy();
        });
        this.matrix = this.matrix.map(col => {
            return col.filter(tile => !tile.isCheckedOutNeighboring);
        })
        this.fillMatrix();
        console.log(this.matrix);
    }


    // update (deltaTime: number) {
    //     // [4]

    // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.3/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.3/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.3/manual/en/scripting/life-cycle-callbacks.html
 */
