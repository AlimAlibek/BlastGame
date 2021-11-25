
import { _decorator, Component, Node, Label } from 'cc';
import {FieldController} from './FieldController';
const { ccclass, property } = _decorator;

enum GameResult {
    WIN,
    LOS_ENDED_TURNS,
    LOS_NO_POSSIBILITY
}

@ccclass('Manager')
export class Manager extends Component {

    private turns: number = 10;
    private score: number = 0;
    private scoreForWin: number = 50;
    private restOfTurns: number = this.turns;

    private numberOfShuffles: number = 3;
    private restNumberOfShuffles: number = this.numberOfShuffles;

    @property({type: FieldController})
    private fieldController: FieldController = null;
    @property({type: Label})
    private turnsLabel: Label = null;
    @property({type: Label})
    private scoreLabel: Label = null;

    @property({type: Node})
    private startMenu: Node = null;
    @property({type: Node})
    private finishMenu: Node = null;
    @property({type: Label})
    private finishMenuLabel: Label = null;

    @property({type: Label})
    private shuffleButtonScore: Label = null;
    
    start () {  
        this.onGameInit();
        this.fieldController?.node.on("TurnEnd", this.onTurnEnd, this);
    }

    onGameInit() {
        this.finishMenu.active = false;
        this.startMenu.active = true;

        this.score = 0;
        this.restOfTurns = this.turns;
        this.restNumberOfShuffles = this.numberOfShuffles;
        
        this.updateCounter();
        this.fieldController.setCheckingIsPossibilityToBlast(false);
        this.fieldController.setIsPlaying(false);
    }

    onGamePlay() {
        this.startMenu.active = false;
        this.fieldController.setIsPlaying(true);
    }

    onGameFinish(result: GameResult) {
        this.fieldController.setIsPlaying(false);

        this.finishMenu.active = true;

        switch(result) {
            case GameResult.WIN :
               this.finishMenuLabel.string = "победа!!!";
               break;

            case GameResult.LOS_ENDED_TURNS :
                this.finishMenuLabel.string = `
                    \n не получилось набрать 
                    \n ${this.scoreForWin} очков за 
                    \n ${this.turns} ходов
                `;
                break;

            case GameResult.LOS_NO_POSSIBILITY :
                this.finishMenuLabel.string = `
                    \n нет возможных ходов 
                    \n и лимит перемешиваний 
                    \n исчерпан 
                `;
                break;

            default: break;
        }

    }

    onStartClick() {
        this.onGamePlay();
    }

    onRestartClick() {
        this.onGameInit();
        this.onGamePlay();
    }


    onTurnEnd(numberOfBlastedTiles: number) {
        this.restOfTurns --;
        this.score += numberOfBlastedTiles;

        this.updateCounter();
        this.checkCurrentGameProgress();
    }

    checkCurrentGameProgress() {
        if (this.score >= this.scoreForWin) {
            this.onGameFinish(GameResult.WIN);
        } else if (this.restOfTurns === 0) {
            this.onGameFinish(GameResult.LOS_ENDED_TURNS);
        }
    }

    updateCounter() {
        this.turnsLabel.string = this.restOfTurns.toString();
        this.scoreLabel.string = this.score.toString();
        this.shuffleButtonScore.string = this.restNumberOfShuffles.toString();
    }

    onShuffleClick() {
        if (this.restNumberOfShuffles > 0) {
            this.fieldController.shuffleMatrix();
            this.restNumberOfShuffles--;
            this.updateCounter();
        }

        if (this.restNumberOfShuffles === 0) {
        // проверка возможных ходов включается когда заканчивается 
        // лимит перемешиваний
            this.checkPossibility();
        }
    }

    checkPossibility() {
        const onEndedPossibilitys = () => {
            this.onGameFinish(GameResult.LOS_NO_POSSIBILITY);
        }
        this.fieldController.node.on("ThereIsNoPossibilityToBlast", onEndedPossibilitys)

        this.fieldController.setCheckingIsPossibilityToBlast(true);
    }
}


