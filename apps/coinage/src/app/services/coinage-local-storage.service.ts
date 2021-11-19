import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CoinageLocalStorageService {
    private readonly localStorage: Storage;

    public static readonly KEY_NUMBER_TEMPLATE = (key: string) => `${key}-n`;
    public static readonly KEY_STRING_TEMPLATE = (key: string) => `${key}-s`;
    public static readonly KEY_OBJECT_TEMPLATE = (key: string) => `${key}-o`;
    public static readonly KEY_ARRAY_TEMPLATE = (key: string) => `${key}-a`;

    constructor() {
        this.localStorage = window.localStorage;
    }

    public setNumber(key: string, value: number | undefined): void {
        if (value !== undefined) {
            this.localStorage.setItem(CoinageLocalStorageService.KEY_NUMBER_TEMPLATE(key), value.toString());
        } else {
            this.localStorage.removeItem(CoinageLocalStorageService.KEY_NUMBER_TEMPLATE(key));
        }
    }

    public getNumber(key: string): number | undefined {
        const n = this.localStorage.getItem(CoinageLocalStorageService.KEY_NUMBER_TEMPLATE(key));
        if (n !== null) {
            return Number(n);
        }
    }

    public setString(key: string, value: string): void {
        if (value !== undefined) {
            this.localStorage.setItem(CoinageLocalStorageService.KEY_STRING_TEMPLATE(key), value);
        } else {
            this.localStorage.removeItem(CoinageLocalStorageService.KEY_STRING_TEMPLATE(key));
        }
    }

    public getString(key: string): string | undefined {
        return this.localStorage.getItem(CoinageLocalStorageService.KEY_STRING_TEMPLATE(key)) ?? undefined;
    }

    public setObject<T>(key: string, object: T): void {
        if (object !== undefined) {
            const serializedObject = JSON.stringify(object);
            this.localStorage.setItem(CoinageLocalStorageService.KEY_OBJECT_TEMPLATE(key), serializedObject);
        } else {
            this.localStorage.removeItem(CoinageLocalStorageService.KEY_STRING_TEMPLATE(key));
        }
    }

    public getObject<T>(key: string, constructor?: (v: string) => T): T | undefined {
        const objStr = this.localStorage.getItem(CoinageLocalStorageService.KEY_OBJECT_TEMPLATE(key));
        if (objStr) {
            if (constructor) {
                return constructor(JSON.parse(objStr));
            }
            return JSON.parse(objStr);
        }
    }
}
