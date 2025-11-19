import EventEmitter from 'eventemitter3';
import { NetworkClient } from '../core/network';
import { GameState, GamePhase, AnyGamePhase } from '../types';

const DEFAULT_PHASES: AnyGamePhase[] = [
  GamePhase.IDLE,
  GamePhase.READING,
  GamePhase.SEARCH,
  GamePhase.DISCUSSION,
  GamePhase.VOTE,
  GamePhase.REVEAL,
];


export class GameManager extends EventEmitter {
  private network: NetworkClient;
  private phases: AnyGamePhase[];
  public state: GameState;

  constructor(network: NetworkClient, phases?: AnyGamePhase[]) {
    super();
    this.network = network;
    this.phases = phases && phases.length > 0 ? phases : DEFAULT_PHASES;
    // 初始状态
    this.state = {
      phase: this.phases[0],
      round: 0,
      cluesFound: [],
      votes: {}
    };
  }

  public async startGame(initialPhase?: AnyGamePhase): Promise<void> {
    await this.network.send('game:start', {});
    const nextPhase = initialPhase ?? this.getNextPhase();
    this.updatePhase(nextPhase);
  }

  public async nextPhase(targetPhase?: AnyGamePhase): Promise<void> {
    const nextPhase = targetPhase ?? this.getNextPhase();
    await this.network.send('game:phaseUpdate', { phase: nextPhase });
    this.updatePhase(nextPhase);
  }

  public async submitClue(clueId: string): Promise<void> {
    if (this.state.cluesFound.includes(clueId)) return;

    await this.network.send('game:clueFound', { clueId });
    this.state.cluesFound.push(clueId);
    this.emit('stateUpdate', this.state);
  }

  private getNextPhase(current: AnyGamePhase = this.state.phase): AnyGamePhase {
    const index = this.phases.indexOf(current);
    if (index === -1) {
      return this.phases[0];
    }
    const nextIndex = (index + 1) % this.phases.length;
    return this.phases[nextIndex];
  }


  // 内部更新状态并通知外部
  private updatePhase(phase: AnyGamePhase) {
    this.state.phase = phase;
    console.log(`[GameManager] Phase changed to: ${phase}`);
    this.emit('phaseChange', phase);
    this.emit('stateUpdate', this.state);
  }
}