
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
    colIndex: number,
    rowIndex: number,
    isCheckedOutNeighboring: boolean,
    tileNode: Node
} 

@ccclass('Field')
export class Field extends Component {

    private columnsAmount: number = 8;
    private rowsAmount: number = 8;
    private firstColumnPositionByX: number = -179;
    private tileWidth: number = 51;
    private matrix: TileType[][] = [];



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
           this.fillMatrix(); 
        }
    }

    fillMatrix() {
        for (let i = 0; i < this.columnsAmount; i++) {

            let column: TileType[] = [];
            for (let j = 0; j < this.rowsAmount; j++) {

                const randomIndex = Math.floor(Math.random() * this.tilePrefabs.length);
                const tileNode = this.createTileNode(randomIndex);

                const tileObj : TileType = {
                    colIndex: i,
                    rowIndex: j,
                    isCheckedOutNeighboring: false,
                    tileNode
                }
                column.push(tileObj);
                this.addTile(tileObj);
            }
            this.matrix.push(column);
        }
        console.log(this.matrix);
    }
    createTileNode(prefabIndex: number) {
        const tileNode = instantiate(this.tilePrefabs[prefabIndex])
        return tileNode
    }

    addTile(tileObj: TileType) {
        this.node.addChild(tileObj.tileNode);
        tileObj.tileNode.setPosition(new Vec3(this.firstColumnPositionByX + this.tileWidth * tileObj.colIndex, 400));
        const onTileNodeClick = (event: EventMouse) => { 
            this.onTileClick(tileObj, event.getButton());
        }
        tileObj.tileNode.on(SystemEvent.EventType.MOUSE_UP, onTileNodeClick);
    }

    onTileClick(tileObj: TileType, mouseKey: number) {
        switch(mouseKey) {
            case 0 :
                this.checkNeighbors(tileObj);
                break;
            default: break;
        }
    }

    checkNeighbors(tileObj: TileType) {

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
