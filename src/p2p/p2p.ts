import Peer, { type DataConnection } from "peerjs";

export { DataConnection }

export async function startServer<MessageType>(config?: {
    onClientConnect?: (clientConnection: DataConnection) => void,
    onClientDisconnect?: (clientConnection: DataConnection) => void,
    onReceiveMessage?: (clientConnection: DataConnection, message: MessageType) => void,
}): Promise<Server<MessageType>> {
    let server = new Server()

    server.onClientConnect = config?.onClientConnect
    server.onClientDisconnect = config?.onClientDisconnect
    server.onReceiveMessage = config?.onReceiveMessage

    await server.start()

    return server
}

export class Server<MessageType> {
    id: string
    private peer: Peer
    private clientsConnections: Map<string, DataConnection>
    constructor() {
        this.clientsConnections = new Map()
    }
    /**
     * 
     * @returns id del server o error
     */
    async start(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.peer = new Peer()
            this.peer.on('open', (server_id) => {
                console.info(`${server_id}: Server started`)
                this.id = server_id
                resolve(server_id)
                this.peer.on('connection', (clientConnection) => this.clientConnected(clientConnection))
            })
            this.peer.on('error', (error) => {
                console.error(`Couldn't start server: ${error}`)
                reject(error)
            })
        })
    }
    private clientConnected(clientConnection: DataConnection) {
        console.info(`${this.peer.id}: Client ${clientConnection.peer} connected`)
        this.clientsConnections.set(clientConnection.peer, clientConnection)
        this.onClientConnect?.(clientConnection)
        clientConnection.on('data', (message: MessageType) => {
            console.info(`${this.peer.id}: clientConnection ${clientConnection.peer} sent message [${message}]`)
            this.onReceiveMessage?.(clientConnection, message)
        })
        clientConnection.on('close', () => this.clientDisconnected(clientConnection))
        clientConnection.on('iceStateChanged', (state: RTCIceConnectionState) => {
            switch (state) {
                case "disconnected":
                    this.clientDisconnected(clientConnection)
                    break;

                default:
                    break;
            }
        })
    }
    private clientDisconnected(clientConnection: DataConnection) {
        if (!this.clientsConnections.has(clientConnection.peer))
            return
        this.clientsConnections.delete(clientConnection.peer)
        console.info(`${this.peer.id}: Client ${clientConnection.peer} disconnected`)
        this.onClientDisconnect?.(clientConnection)
    }
    // Events
    onClientConnect: (clientConnection: DataConnection) => void
    onClientDisconnect: (clientConnection: DataConnection) => void
    onReceiveMessage: (clientConnection: DataConnection, message: MessageType) => void
    // Actions
    sendMessageToAllClients(message: MessageType) {
        this.clientsConnections.forEach(clientConnection => {
            clientConnection.send(message)
        });
    }
    sendMessageToClient(message: MessageType, client_id: string) {
        let clientConnection = this.clientsConnections.get(client_id)
        clientConnection.send(message)
    }
    getClients(): Map<string, DataConnection> {
        return this.clientsConnections
    }
}

export async function startClient<MessageType>(server_id: string, config?: {
    onReceiveMessage?: (message: MessageType) => void
}): Promise<Client<MessageType>> {
    let client = new Client()

    client.onReceiveMessage = config?.onReceiveMessage

    await client.connect(server_id)

    return client
}

export class Client<MessageType> {
    private peer: Peer
    private serverConnection: DataConnection
    async connect(server_id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.peer = new Peer()
            this.peer.on('open', () => {
                this.serverConnection = this.peer.connect(server_id)
                this.serverConnection.on('open', () => {
                    console.info(`CLIENT: Conection with ${server_id} established`)
                    resolve()
                    this.serverConnection.on('data', (message: MessageType) => this.onReceiveMessage?.(message))
                })
                this.serverConnection.on('error', (error) => {
                    console.error(`CLIENT: Couldn't connect to server: ${error}`)
                    reject(error)
                })
            })
            this.peer.on('error', (error) => {
                console.error(`CLIENT: Couldn't create client: ${error}`)
                reject(error)
            })
        })
    }
    // Events
    onReceiveMessage: (message: MessageType) => void
    // Actions
    sendMessage(message: MessageType) {
        this.serverConnection.send(message)
    }
    disconnect() {
        this.serverConnection.close();
        this.peer.disconnect();
    }
}