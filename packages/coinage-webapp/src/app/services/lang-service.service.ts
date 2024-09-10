import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

interface KeyStringVal {
    [key: string]: KeyStringVal;
}

@Injectable({
    providedIn: 'root',
})
export class LangService {
    private lang: KeyStringVal = {};

    public constructor(private readonly http: HttpClient) {
        lastValueFrom(http.get<KeyStringVal>('/assets/lang/messages-en.json')).then((lang) => (this.lang = lang));
    }

    public getString(path: string): string {
        const split = path.split('.');

        const currentPath = [];
        let retObj = this.lang;

        for (const key of split) {
            if (typeof retObj === 'object' && key in retObj) {
                currentPath.push(key);
                retObj = retObj[key];
            } else {
                throw new Error(`Key ${path} does not exist in ${currentPath.join('.')}.`);
            }
        }

        return retObj as unknown as string;
    }
}
