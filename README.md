# Websockets entre navegadores sin Backend

Este proyecto esta orientado a implementar un sistema de comunicacion entre navegadores ideal para videojuegos en tiempo real sin un servidor Backend.

La idea es que los usuarios tienen dos opciones:
* Conectarse a un servidor usando una ID.
* Crear un servidor en su propio navegador y compartir su ID para que otros se unan.

Entonces el procesamiento de un servidor se lo dejamos al navegador del usuario.

## Quickstart

```console
npm install
npm run dev
```

## Como se usa y planes a futuro

### Crear un servidor
```typescript
import { startServer } from "./p2p/p2p";

type MessageType = string

let server = await startServer<MessageType>()
server.sendMessageToAllClients('Hola mundo!')
```
### Conectarse a un servidor
```typescript
import { startClient } from "./p2p/p2p";

type MessageType = string

let server_id = '<server peer id>'
let client = await startClient<MessageType>(server_id)
client.sendMessage('Hola server!')
```

`startServer` y `startClient` aceptan parametro opcional `config` que permite personalizar los eventos del servidor y de los clientes
```typescript
import { startServer } from "./p2p/p2p";

let server = await startServer<MessageType>({
    onClientConnect: (client) => {},
    onClientDisconnect: (client) => {},
    onReceiveMessage: (client, message: MessageType) => {},
})
```
```typescript
import { startClient } from "./p2p/p2p";

let server_id = '<server peer id>'
let client = await startClient<MessageType>(server_id, {
    onReceiveMessage: (message) => {},
})
```
### `MessageType`

Se utiliza para definir el tipo de mensajes que se enviaran entre los clientes y el servidor.

Con esto no solo se pueden enviar `string` si no que cualquier estructura.


```typescript
import { startServer } from "./p2p/p2p";

type ChatMensaje = {
    autor?: string,
    cuerpo: string,
    timestamp: Date
}

let server = await startServer<ChatMensaje>()
server.sendMessageToAllClients({
    autor: 'SERVER',
    cuerpo: 'Bienvenidos, clientes!',
    timestamp: new Date(),
})
```
