<script lang="ts">
    import type { DataConnection } from "peerjs";
    import { Client, Server, startClient, startServer } from "./p2p/p2p";

    type MessageType = string;

    let server_id: string;
    let client: Client<MessageType>;
    let server: Server<MessageType>;

    async function crearServer() {
        server = await startServer<MessageType>({
            onClientConnect: (client: DataConnection) => {
                let cantidad_clientes = server.getClients().size;
                server.sendMessageToAllClients(
                    `${client.peer} se ha unido, hay ${cantidad_clientes} conectados`
                );
            },
            onClientDisconnect: (client: DataConnection) => {
                let cantidad_clientes = server.getClients().size;
                server.sendMessageToAllClients(
                    `${client.peer} se ha desconectado, hay ${cantidad_clientes} conectados`
                );
            },
            onReceiveMessage: (client: DataConnection, message: string) => {
                server.sendMessageToAllClients(`${message}`);
            },
        });
        server_id = server.id;

        await conectarAServer();
    }

    let message: MessageType = "";
    let message_history: Array<MessageType> = [];
    async function conectarAServer() {
        client = await startClient<MessageType>(server_id, {
            onReceiveMessage: (message) => {
                message_history.push(message);
                message_history = message_history;
            },
        });
    }

    function enviarMensaje() {
        client.sendMessage(message);
        message = "";
    }
</script>

{#if server !== undefined || client !== undefined}
    <p>Connectado al servidor: <b>{server_id}</b></p>
{/if}

{#if server === undefined && client === undefined}
    <div style="display: flex; align-items: center;">
        <div>
            <button on:click={crearServer}>Crear Servidor</button>
        </div>
        <p style="padding: 0px 16px">O</p>
        <div>
            <input bind:value={server_id} />
            <button on:click={conectarAServer}>Conectar Servidor</button>
        </div>
    </div>
{/if}

{#if client !== undefined}
    <form
        style="padding-bottom: 16px;"
        on:submit|preventDefault={enviarMensaje}
    >
        <input bind:value={message} placeholder="Enviar mensaje" />
    </form>
{/if}

{#each message_history as msg}
    <p>{msg}</p>
{/each}
