import { Component, OnInit } from '@angular/core';
import { CoinageSocketService } from '../../services/coinage-socket.service';
import { WebSocketService } from '../../services/web-socket.service';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
    public messages: {
        message: string;
        sender: string;
        date: string;
    }[] = [];

    public chatMessageInput = '';

    public constructor(private readonly socketService: WebSocketService) {}

    public ngOnInit(): void {
        this.socketService.emit('chatLog', {}).then((data: any) => {
            this.messages = data.map((d: any) => ({
                message: d.message,
                sender: d.user,
                date: d.date,
            }));
        });
        this.socketService.on('chatMessageServer').subscribe((data: any) => {
            if (data.message !== undefined) {
                this.messages.push({
                    message: data.message,
                    sender: data.user,
                    date: data.date,
                });
            }
        });
    }

    public sendMessage() {
        if (this.chatMessageInput !== '') {
            this.socketService.emit('chatMessage', { message: this.chatMessageInput });
            this.chatMessageInput = '';
        }
    }
}
