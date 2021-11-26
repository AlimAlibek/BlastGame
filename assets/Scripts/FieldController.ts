
import { _decorator, Component, Node, Prefab, instantiate, Vec3, SystemEvent, EventMouse, Animation } from 'cc';
const { ccclass, property } = _decorator;


type TileType = {
    colIndex: number,
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
    private checkingIsPossibilityToBlast: boolean = false;

    private minNumberOfBlastedTilesForSuperTile: number = 4;
    private isSuperTile: {colIndex: number, rowIndex: number} | null = null;

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

    @property({type: Prefab})
    private superPrefab: Prefab | null = null;

    onLoad() {
        this.tilePrefabs = [
            this.greenPrefab, 
            this.bluePrefab, 
            this.yellowPrefab, 
            this.purplePrefab, 
            this.redPrefab
        ]
    }

    public setIsPlaying(status: boolean) {
        if (status) {
            this.fillMatrix();
            this.isPlaying = true;
        } else {
            // this.clearMatrix();
            this.isPlaying = false;
        }
    }

    private fillMatrix() {

        for (let i = 0; i < this.columnsAmount; i++) {
            const column: TileType[] = this.matrix[i] || [];

            for (let j = column.length; j < this.rowsAmount; j++) {
                let tileObj: TileType = this.generateTileObj(i);
 
                column.push(tileObj);

                this.setTilePosition(tileObj, j)
                this.addTileNode(tileObj);
            }

            if (!this.matrix[i]) {
            // если игра только стартовала массив column добавляется в матрицу,
            // иначе переменная column и так ссылается на уже имеющийся в матрице массив
                this.matrix[i] = column;
            }
        }
        
        if (this.isSuperTile) {
            this.generateSuperTile();
        }

        if (this.checkingIsPossibilityToBlast) {
            this.checkPossibilityToBlast();
        }
    }

    public clearMatrix() {
        for (let i = 0; i < this.matrix.length; i++) {
            for (let j = 0; j < this.matrix[0].length; j++) {
                this.matrix[i][j].node.destroy();
            }
        }
        this.matrix = [];
    };

    private generateTileObj(colIndex: number): TileType {
        let tileNode: Node = null;
    
        const randomPrefabIndex = Math.floor(Math.random() * this.tilePrefabs.length);
        tileNode = instantiate(this.tilePrefabs[randomPrefabIndex]); 

        return {
            colIndex, // - индекс столбца для оптимизации поиска в матрице. 
            // индекс по строке не добавил, так как тайлы падают сверху вниз 
            // и потребуется лишний код для постаянной актуализации
            //  который, думаю, не будет оптимальнее линейного поиска

            isCheckedOutNeighboring: false, // - свойство используется при рекурсивном 
            // обходе матрицы для проверке прилигающих плиток

            node: tileNode
        }

    }

    private addTileNode(tileObj: TileType) {
        
        setTimeout(() => {
            this.node.addChild(tileObj.node); 
        }, 100); 
        
        tileObj.node.on(SystemEvent.EventType.MOUSE_UP, (event: EventMouse) => {

            if (event.getButton() === 0) {
                this.onTileClick(tileObj);
            }
        });
    }

  

    private setTilePosition(tileObj: TileType, rowIndex: number) {
    
        tileObj.node.setPosition(new Vec3(
            this.firstColumnPositionByX + (this.tileSize + this.sideSpace) * tileObj.colIndex + this.sideSpace, 
            this.fieldHeight/2 + this.tileSize*rowIndex,
        ));
    }

    private onTileClick(tileObj: TileType) {
        if (!this.isPlaying) {
            return;
        }

        const sameTiles = this.checkNeighbors(tileObj);

        if (sameTiles.length >= this.minNumberOfBlastedTilesForSuperTile) {
            this.setSuperTile(tileObj);
        }

        if (sameTiles.length < this.minNumberOfTilesForBlast) {
            this.resetCheckedTiles(sameTiles);
        } else {
            this.blastTiles(sameTiles); 
        }
        
    }

    private checkNeighbors(tileObj: TileType) {
    // возвращает массив одинаковых прилигающих к tileObj плиток

        const tileNodeName = tileObj.node.name;
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
        check(tileObj.colIndex, this.getTileRowIndex(tileObj));

        return sameTiles;
    }

    private resetCheckedTiles(tiles: TileType[]) {
        tiles.forEach(tile => tile.isCheckedOutNeighboring = false);
    }

    private getTileRowIndex(tileObj: TileType) {
        const col = this.matrix[tileObj.colIndex];

        for (let i = 0; i < col.length; i++) {

            if (col[i].node === tileObj.node) {
                return i 
            }
        }
    }

    private blastTiles(sameTiles: TileType[]) {
        sameTiles.forEach(tile => {
            tile.node.getComponent(Animation)?.play();
            setTimeout(() => {
                tile.node.destroy();
            }, 200);
        });
        // после удаления узлов плиток из поля, так же удаляются
        // их объекты из матрицы 
        this.matrix = this.matrix.map(col => {
            return col.filter(tile => !tile.isCheckedOutNeighboring);
        })
        
        setTimeout(() => {
            // после чего метод fillMatrix заполняет не полные столбцы
            this.fillMatrix();

            // событие для счётчика в менеджере
            this.node.emit("TurnEnd", sameTiles.length);

        }, 200);
        
    }

    private setSuperTile(tileObj: TileType | null) {
    // если this.superTile будет содержать объект с координатами,
    // то после заполнении матрицы будет вызываться this.generateSuperTile
        if (tileObj) {
            this.isSuperTile = {
                colIndex: tileObj.colIndex,
                rowIndex: this.getTileRowIndex(tileObj)
            } 
        } else {
            this.isSuperTile = null;
        }

    }

    private generateSuperTile() {
        
        const {colIndex, rowIndex} = this.isSuperTile;
        const superTileObj = this.matrix[colIndex][rowIndex];

        superTileObj.node.name = "super";
        superTileObj.node.addChild(instantiate(this.superPrefab));

        // отменяется стандартное поведение плитки по клику
        superTileObj.node.off(SystemEvent.EventType.MOUSE_UP);

        superTileObj.node.on(SystemEvent.EventType.MOUSE_UP, () => {
        // супер тайл сжигает весь столбец 
            const thisCol = this.matrix[superTileObj.colIndex]
            this.matrix[superTileObj.colIndex] = []
            this.blastTiles(thisCol);
        })

        this.setSuperTile(null);
    }

    public shuffleMatrix() {
    // Перемешивает уже имеющиеся на поле плитки.
    // Возможно стоит оптимизировать, но метод вызывается довольно редко, 
    //   поэтому пока оставлю 

        if (!this.isPlaying) {
            return;
        }
        for (let i = this.matrix.length - 1; i > 0; i-- ) {
            let tmpCol = this.matrix[i];
            let rndColI = Math.floor(Math.random() * (i + 1));
            let rndCol = this.matrix[rndColI];

            for (let j = rndCol.length - 1; j > 0; j-- ) {
                const tmpTile = rndCol[j];
                const rndRowIndex = Math.floor(Math.random() * (j + 1));

                rndCol[j] = rndCol[rndRowIndex];
                rndCol[rndRowIndex] = tmpTile;

            }
            this.matrix[i] = rndCol;
            this.matrix[rndColI] = tmpCol;
        }

        for (let i = 0; i < this.columnsAmount; i++) {
            for (let j = 0; j < this.rowsAmount; j++) {   
                const tile = this.matrix[i][j];
               
                tile.colIndex = i; // актуальный номер столбца 
                this.setTilePosition(tile, j);  
            }
        }
        
        if (this.checkingIsPossibilityToBlast) {
            this.checkPossibilityToBlast();
        }
    }

    public setCheckingIsPossibilityToBlast(isChecking: boolean) {
        // если checkingIsPossibilityToBlast === true, то после каждого хода 
        // будет выполнятся проверка на возможность дальнейших ходов 
        this.checkingIsPossibilityToBlast = isChecking;
        if (isChecking) {
           this.checkPossibilityToBlast(); 
        }
        
    }

    private checkPossibilityToBlast() {
    // проверка на возможность дальнейших ходов
        let isPossible: boolean = false;

        for (let i = 0; (i < this.matrix.length && !isPossible); i++) {

            for (let j = 0; j < this.rowsAmount && !isPossible; j++) {

                const sameTiles = this.checkNeighbors(this.matrix[i][j])
                if (sameTiles.length >= this.minNumberOfTilesForBlast) {
                    isPossible = true;
                }   
                this.resetCheckedTiles(sameTiles);
            }
        }
        
        if (!isPossible) {
            // событие для сообщения менеджеру об отсутствии возможных ходов
            this.node.emit('ThereIsNoPossibilityToBlast')
        }
    }

}
