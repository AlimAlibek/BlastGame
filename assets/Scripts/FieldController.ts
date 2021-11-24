
import { _decorator, Component, Node, Prefab, instantiate, Vec3, systemEvent, SystemEvent, EventMouse } from 'cc';
const { ccclass, property } = _decorator;


type TileType = {
    isCheckedOutNeighboring: boolean,
    node: Node
} 


@ccclass('FieldController')
export class FieldController extends Component {
   
    private isPlaying: boolean = false;

    private tileSize: number = 50;
    private sideSpace: number = 1;
    private fieldHeight: number = 440;
    private fieldWidth: number = 440;
    private columnsAmount: number = Math.floor(this.fieldWidth/this.tileSize);
    private rowsAmount: number = Math.floor(this.fieldHeight/this.tileSize);
    private firstColumnPositionByX = (this.fieldWidth/2 - this.fieldWidth % this.tileSize/2 - this.tileSize/2 + this.sideSpace*this.columnsAmount/2) * -1;
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

    setIsPlaying(status: boolean) {
        if (status) {
            this.fillMatrix();
            this.isPlaying = true;
        } else {
            this.isPlaying = false;
        }
    }

    fillMatrix() {

        for (let i = 0; i < this.columnsAmount; i++) {
            const column: TileType[] = this.matrix[i] || [];

            for (let j = column.length; j < this.rowsAmount; j++) {
                const tileObj = this.generateTileObj(null);
                column.push(tileObj);
                this.addTileNode(tileObj, i, j);
            }

            if (!this.matrix[i]) {
                this.matrix[i] = column;
            }
        }
    }

    generateTileObj(prefabName: string | null) {
        let tileNode: Node = null;
        
        if (prefabName) {
            const prefab: Prefab = this.tilePrefabs.find(prfb => prfb.data.name === prefabName)
            if (prefab) {
             tileNode = instantiate(prefab);   
            }
        } else {
            const randomPrefabIndex = Math.floor(Math.random() * this.tilePrefabs.length);
            tileNode = instantiate(this.tilePrefabs[randomPrefabIndex]);
        }   

        return {
            isCheckedOutNeighboring: false,
            node: tileNode
        }

    }

    addTileNode(tileObj: TileType, colIndex: number, rowIndex: number) {

        tileObj.node.setPosition(new Vec3(
            this.firstColumnPositionByX + (this.tileSize + this.sideSpace) * colIndex + this.sideSpace, 
            this.fieldHeight/2 + this.tileSize*rowIndex,
        ));

        setTimeout(() => {
            this.node.addChild(tileObj.node); 
        }, 100); 
        
        const onTileNodeClick = (event: EventMouse) => { 
            this.onTileClick(tileObj, event.getButton());
        }
        tileObj.node.on(SystemEvent.EventType.MOUSE_UP, onTileNodeClick);
    }

    onTileClick(tileObj: TileType, mouseKey: number) {
        if (!this.isPlaying) {
            return;
        }

        switch(mouseKey) {
            case 0 :
                this.checkNeighbors(tileObj);
                break;
            case 2 : 
                this.shuffleMatrix();
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
        this.node.emit("TurnEnd", sameTiles.length);
    }

    shuffleMatrix() {
    // Перемешивает уже имеющиеся на поле плитки.
    // Возможно стоит оптимизировать, но метод вызывается довольно редко, 
    //   поэтому пока оставлю 
        for (let i = this.matrix.length - 1; i > 0; i-- ) {
            let tmpCol = this.matrix[i];
            let rndColI = Math.floor(Math.random() * (i + 1));

            for (let j = tmpCol.length - 1; j > 0; j-- ) {
                const tmpTile = tmpCol[j];
                const rndRowIndex = Math.floor(Math.random() * (j + 1));
                tmpCol[j] = tmpCol[rndRowIndex];
                tmpCol[rndRowIndex] = tmpTile;
            }

            this.matrix[i] = this.matrix[rndColI];
            this.matrix[rndColI] = tmpCol;
        }
        
        for (let i = 0; i < this.columnsAmount; i++) {

            for (let j = 0; j < this.rowsAmount; j++) {   
                const newTile = this.generateTileObj(this.matrix[i][j].node.name);
                const oldTile = this.matrix[i][j];
                this.matrix[i][j] = newTile;
                oldTile.node.destroy();

                this.addTileNode(newTile, i, j); 
               
            }
        }
    }

}
