import EventEmitter from 'eventemitter3';
export declare class NetworkClient extends EventEmitter {
    private ws;
    private connected;
    private serverUrl;
    private pendingRequests;
    constructor(serverUrl: string);
    connect(): Promise<void>;
    disconnect(): void;
    send(event: string, data: any): Promise<any>;
}
