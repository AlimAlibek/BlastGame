
import { _decorator, Component, Node, Label } from 'cc';
import {FieldController} from './FieldController';
const { ccclass, property } = _decorator;


@ccclass('Manager')
export class Manager extends Component {

    private turns: number = 10;
    private score: number = 0;
    private scoreForWin: number = 50;
    private restOfTurns: number = this.turns;

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
    
    start () {  
        this.onGameInit();
        this.fieldController?.node.on("TurnEnd", this.onTurnEnd, this);
    }

    onGameInit() {
        this.finishMenu.active = false;
        this.startMenu.active = true;

        this.score = 0;
        this.restOfTurns = this.turns;
        
        this.updateCounter();
        this.fieldController.setIsPlaying(false);
    }

    onGamePlay() {
        this.startMenu.active = false;
        this.fieldController.setIsPlaying(true);
    }

    onGameFinish(isWin: boolean) {
        this.fieldController.setIsPlaying(false);

        this.finishMenu.active = true;
        if (isWin) {
            this.finishMenuLabel.string = "победа!!!"
        } else {
            this.finishMenuLabel.string = `
                \n не получилось набрать 
                \n ${this.scoreForWin} очков за 
                \n ${this.turns} ходов
            `
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
            this.onGameFinish(true);
        } else if (this.restOfTurns === 0) {
            this.onGameFinish(false);
        }
    }

    updateCounter() {
        this.turnsLabel.string = this.restOfTurns.toString();
        this.scoreLabel.string = this.score.toString();
    }



}


