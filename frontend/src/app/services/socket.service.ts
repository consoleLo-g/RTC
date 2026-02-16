import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private ws!: WebSocket;
  private connected = false;
  private openCallbacks: (() => void)[] = [];

  messages$ = new Subject<string>();

  constructor(private zone: NgZone) { }

  onOpen(cb: () => void) {
    this.openCallbacks.push(cb);
  }

  connect() {
    if (this.connected) return;

    this.ws = new WebSocket(environment.wsUrl);

    this.ws.onopen = () => {
      this.connected = true;
      console.log('Connected to WebSocket');
      this.openCallbacks.forEach((cb) => cb());
    };

    this.ws.onmessage = (event) => {
      this.zone.run(() => {
        this.messages$.next(event.data);
      });
    };

    this.ws.onclose = () => {
      this.connected = false;
      console.log('WebSocket closed');
    };
  }


  sendMessage(msg: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    }
  }
}
export { environment };

