import Peer, { type DataConnection } from "peerjs";

export async function startServer<MessageType>(config?: {
    onClientConnect?: (client: DataConnection) => void,
    onClientDisconnect?: (client: DataConnection) => void,
    onReceiveMessage?: (client: DataConnection, message: MessageType) => void,
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
    private clients: Map<string, DataConnection>
    constructor() {
        this.clients = new Map()
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
                this.peer.on('connection', (client) => this.clientConnected(client))
                this.peer.on('disconnected', (client_id) => this.clientDisconnected(client_id))
            })
            this.peer.on('error', (error) => {
                console.error(`Couldn't start server: ${error}`)
                reject(error)
            })
        })
    }
    private clientConnected(client: DataConnection) {
        console.info(`${this.peer.id}: Client ${client.peer} connected`)
        this.clients.set(client.peer, client)
        this.onClientConnect?.(client)
        client.on('data', (message: MessageType) => {
            console.info(`${this.peer.id}: Client ${client.peer} sent message [${message}]`)
            this.onReceiveMessage?.(client, message)
        })
    }
    private clientDisconnected(client_id: string) {
        let client = this.clients.get(client_id)
        console.info(`${this.peer.id}: Client ${client.peer} disconnected`)
        this.onClientDisconnect?.(client)
        this.clients.delete(client_id)
    }
    // Events
    onClientConnect: (client: DataConnection) => void
    onClientDisconnect: (client: DataConnection) => void
    onReceiveMessage: (client: DataConnection, message: MessageType) => void
    // Actions
    sendMessageToAllClients(message: MessageType) {
        this.clients.forEach(client => {
            client.send(message)
        });
    }
    sendMessageToClient(message: MessageType, client_id: string) {
        let client = this.clients.get(client_id)
        client.send(message)
    }
    getClients(): Map<string, DataConnection> {
        return this.clients
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
    private server: DataConnection
    async connect(server_id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.peer = new Peer()
            this.peer.on('open', () => {
                this.server = this.peer.connect(server_id)
                this.server.on('open', () => {
                    console.info(`CLIENT: Conection with ${server_id} established`)
                    resolve()
                    this.server.on('data', (message: MessageType) => this.onReceiveMessage?.(message))
                })
                this.server.on('error', (error) => {
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
    onReceiveMessage: (message: MessageType) => void
    sendMessage(message: MessageType) {
        this.server.send(message)
    }
}