export interface ChatMessage {
    type: 'join' | 'message' | 'leave';
    user: string;
    text?: string | undefined;
    timestamp: number;
}
