import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, signal } from '@angular/core';
import { SocketService } from '../services/socket.service';
import { FormsModule, NgModel } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { log } from 'node:console';

export interface ChatMessage {
  type: 'message' | 'join' | 'leave';
  user: string;
  text?: string;
  timestamp: number;
}
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})

export class ChatComponent implements OnInit {
  messages = signal<ChatMessage[]>([]); // Your messages signal
  newMessage = '';
  username = '';
  tempUsername = '';
  isTyping = false; // Flag to track if user is typing
  typingTimeout: any; // Timeout for typing detection

  @ViewChild('chatWindow') chatWindow!: ElementRef;

  constructor(
    private socketService: SocketService,
    private _cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Connect to socket
    this.socketService.connect();

    // Send join event after connecting
    this.socketService.onOpen(() => {
      this.sendJoin();
    });

    // Listen for incoming messages
    this.socketService.messages$.subscribe((raw) => {
      try {
        const msg: ChatMessage = JSON.parse(raw);
        this.messages.update((msgs) => [...msgs, msg]);
        this.scrollToBottom(); // Scroll to the bottom when new messages come in
      } catch (e) {
        console.warn('Invalid message received', raw);
      }
    });
  }

  ngAfterViewInit(): void {
    // After view is initialized, ensure chat window exists and scroll to bottom
    setTimeout(() => {
      this.scrollToBottom();
    });
  }

  sendJoin() {
    this.socketService.sendMessage(
      JSON.stringify({ type: 'join', user: this.username, timestamp: Date.now() })
    );
  }

  // Detect if the user is typing, to avoid auto-scrolling while typing
  onInput() {
    this.isTyping = true;

    // Reset typing status after a short delay
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
    }, 1000); // Set a 1-second timeout after typing stops
  }

  ngAfterViewChecked() {
    // Only scroll to the bottom if the user is not typing
    if (!this.isTyping) {
      this.scrollToBottom();
    }
  }

  send() {
    if (this.newMessage.trim()) {
      const msg: ChatMessage = {
        type: 'message',
        user: this.username,
        text: this.newMessage.trim(),
        timestamp: Date.now(),
      };
      this.socketService.sendMessage(JSON.stringify(msg));
      this.newMessage = ''; // Clear the input
    }
  }

  scrollToBottom() {
    // Use setTimeout to ensure the scroll happens after the view updates
    setTimeout(() => {
      if (this.chatWindow?.nativeElement) {
        const el = this.chatWindow.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100); // Small delay to let the DOM update first
  }

  trackByTimestamp(index: number, msg: ChatMessage) {
    return msg.timestamp;
  }

  setUsername() {
    this.username = this.tempUsername.trim() || 'Anonymous';
    this.sendJoin();
  }
}