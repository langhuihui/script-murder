import EventEmitter from 'eventemitter3';
import WebSocket from 'ws'; // Use 'ws' in Node environment, or native WebSocket in browser

export class NetworkClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private serverUrl: string;
  private pendingRequests: Map<string, (data: any) => void> = new Map();

  constructor(serverUrl: string) {
    super();
    this.serverUrl = serverUrl;
  }

  public async connect(): Promise<void> {
    console.log(`[Network] Connecting to ${this.serverUrl}...`);
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.connected = true;
        console.log('[Network] Connected.');
        this.emit('connect');
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data.toString());
        
        // Handle Response
        if (message.id && this.pendingRequests.has(message.id)) {
          const resolveReq = this.pendingRequests.get(message.id);
          if (resolveReq) resolveReq(message.data);
          this.pendingRequests.delete(message.id);
          return;
        }

        // Handle Server Push Event
        if (message.event) {
          this.emit(message.event, message.data);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[Network] Error:', err);
        reject(err);
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.emit('disconnect');
        console.log('[Network] Disconnected.');
      };
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.emit('disconnect');
  }

  public async send(event: string, data: any): Promise<any> {
    if (!this.connected || !this.ws) throw new Error('Network not connected');
    
    const requestId = Math.random().toString(36).substring(7);
    const payload = JSON.stringify({ id: requestId, event, data });
    
    console.log(`[Network] Sending [${event}]:`, data);
    this.ws.send(payload);

    return new Promise((resolve) => {
      // Timeout fallback could be added here
      this.pendingRequests.set(requestId, resolve);
    });
  }
}