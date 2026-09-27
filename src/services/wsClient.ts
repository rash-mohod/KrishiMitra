type SocketEventCallback = (data: any) => void;

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

class RealtimeChatClient {
  private source: EventSource | null = null;
  private listeners: Map<string, Set<SocketEventCallback>> = new Map();
  private reconnectTimer: number | null = null;
  private explicitlyClosed = false;
  private activeRoomId: string | null = null;
  private typingTimeout: number | null = null;
  public isConnected = false;

  public connect() {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('km_auth_token') || sessionStorage.getItem('km_auth_token');
    if (!token || this.source) return;

    this.explicitlyClosed = false;
    const url = `${API_URL}/chat/stream?token=${encodeURIComponent(token)}`;
    try {
      const source = new EventSource(url);
      this.source = source;
      source.onopen = () => {
        this.isConnected = true;
        this.emitLocal('connection_change', { connected: true });
      };
      source.onerror = () => {
        this.isConnected = false;
        this.emitLocal('connection_change', { connected: false });
        source.close();
        this.source = null;
        if (!this.explicitlyClosed) this.scheduleReconnect();
      };
      ['message:new', 'message:edited', 'message:deleted', 'message:reaction', 'typing:start', 'typing:stop', 'presence:update'].forEach(event => {
        source.addEventListener(event, (message: MessageEvent) => {
          try { this.emitLocal(event, JSON.parse(message.data)); } catch { /* ignore malformed event */ }
        });
      });
    } catch {
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.explicitlyClosed = true;
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.source?.close();
    this.source = null;
    this.isConnected = false;
    this.emitLocal('connection_change', { connected: false });
  }

  private scheduleReconnect() {
    if (this.explicitlyClosed || this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  public joinConversation(conversationId: string) {
    this.activeRoomId = conversationId;
  }

  public leaveConversation(conversationId: string) {
    if (this.activeRoomId === conversationId) this.activeRoomId = null;
  }

  // Typing is intentionally local-only until a message is sent. This avoids
  // creating a second realtime transport just for ephemeral typing signals.
  public sendTyping(_conversationId: string) {
    if (this.typingTimeout) window.clearTimeout(this.typingTimeout);
  }

  public stopTyping(_conversationId: string) {
    if (this.typingTimeout) {
      window.clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  public on(event: string, callback: SocketEventCallback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: SocketEventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private emitLocal(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try { callback(data); } catch (err) { console.error(`[RealtimeChatClient] ${event}`, err); }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`km_ws_${event}`, { detail: data }));
    }
  }
}

export const wsClient = new RealtimeChatClient();
