class MySocket {
  // singlton
  private static instance: MySocket;
  private socket: WebSocket;
  private isConnected: boolean = false;
  private constructor() {
    this.socket = new WebSocket("ws://localhost:8080");
    this.socket.onopen = () => {
      this.isConnected = true;
    };
    this.socket.onclose = () => {
      this.isConnected = false;
    };
  }
  public static getInstance(): MySocket {
    if (!MySocket.instance) {
      MySocket.instance = new MySocket();
    }
    return MySocket.instance;
  }
  public getSocket(): WebSocket {
    return this.socket;
  }
  public getStatus(): boolean {
    return this.isConnected;
  }
}
export default MySocket;
