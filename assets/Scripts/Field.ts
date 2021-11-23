
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

    start () {
        console.log(this.firstColumnPositionByX)
        if (this.tilePrefabs.length && !this.tilePrefabs.find(prfb => prfb === null)) {
           this.fillMatrix(); 
        }
    }

    fillMatrix() {

        for (let i = 0; i < this.columnsAmount; i++) {
            const column: TileType[] = this.matrix[i] || [];

            for (let j = column.length; j < this.rowsAmount; j++) {
                const tileObj = this.generateTile(null);
                column.push(tileObj);
                this.addTileNode(tileObj, i, j);
            }

            if (!this.matrix[i]) {
                this.matrix[i] = column;
            }
        }
    }

    generateTile(prefabName: string | null) {
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
            console.log(event.target["_id"]);
        }
        tileObj.node.on(SystemEvent.EventType.MOUSE_UP, onTileNodeClick);
    }

    onTileClick(tileObj: TileType, mouseKey: number) {
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
    }

    shuffleMatrix() {

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
                const newTile = this.generateTile(this.matrix[i][j].node.name);
                const oldTile = this.matrix[i][j];
                this.matrix[i][j] = newTile;
                oldTile.node.destroy();

                this.addTileNode(newTile, i, j); 
               
            }
        }
    }


    // update (deltaTime: number) {
    //     // [4]

    // }
}
