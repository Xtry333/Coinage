import { Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { AccountDao } from '../daos/account.dao';
import { UserDao } from '../daos/user.dao';
import { User } from '../entities/User.entity';

export interface ClientUser {
    socket: Socket;
    user: User | null;
}

@WebSocketGateway({
    cors: true,
    path: '/ws/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server!: Server;

    private clients: Socket[] = [];
    private activeClientUsers: ClientUser[] = [];

    private chatLog: any[] = [];
    private counter = 0;

    private logger: Logger = new Logger('EventsGateway');

    public constructor(private readonly userDao: UserDao) {}

    @SubscribeMessage('events')
    public findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
        this.logger.debug(`Find all`, data);
        return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })));
    }

    @SubscribeMessage('identity')
    public async identity(@MessageBody() data: number): Promise<number> {
        return data;
    }

    @Cron(CronExpression.EVERY_MINUTE)
    public pingClients() {
        this.server.emit('debug', { msg: 'Ping', clients: this.clients.length, date: new Date() });
    }

    public handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.clients = this.clients.filter((c) => c.id !== client.id);
    }

    public async handleConnection(client: Socket) {
        this.clients.push(client);
        this.activeClientUsers.push({
            socket: client,
            user: null,
        });
        this.logger.log(`Client connected: ${client.id}`);
        client.emit('debug', { msg: 'On Connected', clients: this.clients.length, connectionsCount: this.counter++ });
    }

    @Interval(3333)
    public pingAClients() {
        this.server.emit('hello', { msg: 'Ping', clients: this.clients.length, date: new Date(), username: 'Xtry333' });
    }

    @SubscribeMessage('login')
    public async clientAuth(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<any> {
        this.logger.debug(`Client Login`, data);
        const userId = data['userId'];

        const activeClient = this.activeClientUsers.find((c) => c.socket === client);
        if (activeClient) {
            activeClient.user = await this.userDao.getById(userId);
        }

        this.logger.log(`Logged user ${activeClient?.user?.name} in socket ${activeClient?.socket.id}!`);
        return {
            id: activeClient?.user?.id,
            name: activeClient?.user?.name,
            key: activeClient?.socket.handshake.auth,
        };
    }

    @SubscribeMessage('chatLog')
    public async onGetChatLog() {
        return this.chatLog;
    }

    @SubscribeMessage('chatMessage')
    public async onChatMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<void> {
        console.log(data);
        const message = data['message'];
        const userName = this.activeClientUsers.find((c) => c.socket === client)?.user?.name ?? 'Unknown';
        const chatLogMessage = { message, date: new Date(), user: userName };
        this.chatLog.push(chatLogMessage);
        this.server.emit('chatMessageServer', chatLogMessage);
        return;
    }
}
