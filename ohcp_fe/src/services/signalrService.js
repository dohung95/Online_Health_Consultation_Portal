import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.listeners = new Map();
  }

  async startConnection() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR already connected');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, cannot connect to SignalR');
      return;
    }

    console.log('Starting SignalR connection with token:', token.substring(0, 20) + '...');

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7267/notificationHub', {
        accessTokenFactory: () => {
          const currentToken = localStorage.getItem('token');
          console.log('Providing token for SignalR connection');
          return currentToken;
        },
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          // Retry delays: 0s, 2s, 10s, 30s, then 60s
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          if (retryContext.previousRetryCount === 3) return 30000;
          return 60000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Handle reconnecting
    this.connection.onreconnecting(error => {
      console.log('SignalR reconnecting...', error);
    });

    // Handle reconnected
    this.connection.onreconnected(connectionId => {
      console.log('SignalR reconnected. ConnectionId:', connectionId);
    });

    // Handle closed
    this.connection.onclose(error => {
      console.log('SignalR connection closed', error);
      // Try to reconnect after 5 seconds
      setTimeout(() => this.startConnection(), 5000);
    });

    try {
      await this.connection.start();
      console.log('✅ SignalR connected successfully');
      
      // Re-register all listeners after connection
      this.listeners.forEach((callbacks, eventName) => {
        callbacks.forEach(callback => {
          this.connection.on(eventName, callback);
        });
      });
    } catch (err) {
      console.error('❌ Error starting SignalR connection:', err);
      console.error('Error details:', {
        message: err.message,
        statusCode: err.statusCode,
        errorType: err.constructor.name
      });
      
      // Don't retry if it's an authentication error
      if (err.statusCode === 401 || err.message?.includes('401')) {
        console.error('Authentication failed. Please check your token or login again.');
        return; // Stop retrying
      }
      
      // Retry after 5 seconds for other errors
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  async stopConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('SignalR connection stopped');
      } catch (err) {
        console.error('Error stopping SignalR connection:', err);
      }
    }
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      this.connection.on(eventName, callback);
    }
  }

  off(eventName, callback) {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(eventName);
      }
    }

    if (this.connection) {
      this.connection.off(eventName, callback);
    }
  }

  async invoke(methodName, ...args) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        return await this.connection.invoke(methodName, ...args);
      } catch (err) {
        console.error(`Error invoking ${methodName}:`, err);
        throw err;
      }
    } else {
      console.warn('SignalR not connected. Cannot invoke method:', methodName);
      throw new Error('SignalR connection not established');
    }
  }

  getConnectionState() {
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }
}

// Create singleton instance
const signalRService = new SignalRService();
export default signalRService;
