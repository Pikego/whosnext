import { Injectable } from '@angular/core';
import { filter, map, Observable, retry } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { environment } from '../../environments/environment';

export interface WsMessage<T = unknown> {
  type: string;
  payload: T;
}

@Injectable({
  providedIn: 'root',
})
export class WsService {
  private readonly wsUrl = environment.ws;
  private socket$?: WebSocketSubject<WsMessage>;

  constructor() {}

  connect(roomId: string): void {
    console.log(`WebSocket room ${roomId}`);
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
    console.log(`WebSocket connecting to ${this.wsUrl}`);
    this.socket$ = webSocket<WsMessage>({
      url: this.wsUrl,
      openObserver: {
        next: () => {
          console.log(`WebSocket connected, joining room ${roomId}`);
          this.send('JOIN', { roomId });
        },
      },
      closeObserver: {
        next: () => console.log('WebSocket connection closed'),
      },
    });
    this.socket$.subscribe({
      error: (err) => console.error('WebSocket error:', err),
    });
  }

  send(type: string, payload: unknown = {}): void {
    if (this.socket$) {
      this.socket$.next({ type, payload });
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }

  on<T>(type: string): Observable<T> {
    if (!this.socket$) {
      console.warn('WebSocket is not connected. Returning empty stream.');
      // Return a stream that errors or completes immediately if not connected,
      // or allows subscription but won't emit until connected?
      // Since connect() is explicit, we assume the caller connects first.
      // But to be safe, we can throw or just wait.
      // Given the flow, let's assume valid usage.
      throw new Error('WebSocket not connected');
    }

    return this.socket$.pipe(
      retry({ delay: 3000 }),
      filter((message) => message.type === type),
      map((message) => message.payload as T)
    );
  }

  close(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
  }
}
