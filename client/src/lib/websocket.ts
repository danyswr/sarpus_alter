import { queryClient } from './queryClient';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private token: string | null = null;
  private isConnecting = false;
  private messageQueue: any[] = [];
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Authenticate if token is available
        this.token = localStorage.getItem('token');
        if (this.token) {
          this.authenticate(this.token);
        }
        
        // Send queued messages
        this.messageQueue.forEach(message => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
          }
        });
        this.messageQueue = [];
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(data: any) {
    console.log('WebSocket message received:', data);
    
    switch (data.type) {
      case 'auth_success':
        console.log('WebSocket authentication successful');
        this.triggerEvent('auth_success', data);
        break;
        
      case 'auth_error':
        console.error('WebSocket authentication failed:', data.message);
        this.triggerEvent('auth_error', data);
        break;
        
      case 'new_post':
        console.log('New post received:', data.post);
        // Invalidate posts cache to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        this.triggerEvent('new_post', data);
        break;
        
      case 'post_updated':
        console.log('Post updated:', data.post);
        // Invalidate posts cache to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        this.triggerEvent('post_updated', data);
        break;
        
      case 'post_deleted':
        console.log('Post deleted via WebSocket:', data.postId);
        // Immediately and permanently remove post from cache
        queryClient.setQueryData(['google-posts'], (oldData: any) => {
          if (!oldData) return oldData;
          const filteredData = oldData.filter((post: any) => post.idPostingan !== data.postId);
          console.log(`Removed post ${data.postId}, remaining posts:`, filteredData.length);
          return filteredData;
        });
        this.triggerEvent('post_deleted', data);
        break;
        
      case 'post_interaction':
        console.log('Post interaction:', data);
        // Invalidate posts cache to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        this.triggerEvent('post_interaction', data);
        break;
        
      case 'user_online':
        console.log('User online:', data.username);
        this.triggerEvent('user_online', data);
        break;
        
      case 'user_offline':
        console.log('User offline:', data.username);
        this.triggerEvent('user_offline', data);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
        this.triggerEvent('unknown', data);
    }
  }

  private triggerEvent(eventType: string, data: any) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  public authenticate(token: string | undefined) {
    if (!token) return;
    
    this.token = token;
    localStorage.setItem('token', token);
    
    const message = {
      type: 'auth',
      token: token
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  public on(eventType: string, handler: Function) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  public off(eventType: string, handler: Function) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const wsClient = new WebSocketClient();

// Export types for better TypeScript support
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface PostUpdate {
  type: 'new_post' | 'post_updated' | 'post_deleted' | 'post_interaction';
  post?: any;
  postId?: string;
  timestamp: string;
  message: string;
}

export interface UserStatusUpdate {
  type: 'user_online' | 'user_offline';
  userId: string;
  username: string;
}