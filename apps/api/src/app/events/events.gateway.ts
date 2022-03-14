import { Logger } from '@nestjs/common';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: true,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server!: Server;

    private clients: Socket[] = [];

    private logger: Logger = new Logger('EventsGateway');

    @SubscribeMessage('events')
    findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
        this.logger.debug(`Find all: ${data}`);
        return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })));
    }

    @SubscribeMessage('identity')
    async identity(@MessageBody() data: number): Promise<number> {
        this.logger.debug(`Identity: ${data}`);
        return data;
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.clients = this.clients.filter((c) => c.id !== client.id);
    }

    handleConnection(client: Socket) {
        this.clients.push(client);
        this.logger.log(`Client connected: ${client.id}`);
        client.emit('debug', { msg: 'On Connected', clients: this.clients.length });
    }
}
