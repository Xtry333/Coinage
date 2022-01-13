import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountBalanceService {
    public formatMySql(date: Date) {
        return date.toISOString().slice(0, 10);
    }
}
