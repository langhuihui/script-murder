import EventEmitter from 'eventemitter3';
import { NetworkClient } from '../core/network';
import { GameState, AnyGamePhase } from '../types';
export declare class GameManager extends EventEmitter {
    private network;
    private phases;
    state: GameState;
    constructor(network: NetworkClient, phases?: AnyGamePhase[]);
    startGame(initialPhase?: AnyGamePhase): Promise<void>;
    nextPhase(targetPhase?: AnyGamePhase): Promise<void>;
    submitClue(clueId: string): Promise<void>;
    private getNextPhase;
    private updatePhase;
}
