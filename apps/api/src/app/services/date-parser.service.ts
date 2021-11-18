import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DateParserService {
    public formatMySql(date: Date) {
        return date.toISOString().slice(0, 10);
    }
}
