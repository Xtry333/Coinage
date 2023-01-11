import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CoinageLocalStorageService {
    public static readonly STORAGE_EVENT = 'storage';

    private readonly localStorage: Storage;

    public static readonly KEY_BOOLEAN_TEMPLATE = (key: string) => `${key}-b`;
    public static readonly KEY_NUMBER_TEMPLATE = (key: string) => `${key}-n`;
    public static readonly KEY_STRING_TEMPLATE = (key: string) => `${key}-s`;
    public static readonly KEY_OBJECT_TEMPLATE = (key: string) => `${key}-o`;
    public static readonly KEY_ARRAY_TEMPLATE = (key: string) => `${key}-a`;

    public constructor() {
        this.localStorage = window.localStorage;
    }

    public attachEventListener(listener: (event: StorageEvent) => void): void {
        window.addEventListener(CoinageLocalStorageService.STORAGE_EVENT, listener);
    }

    public setBoolean(key: string, value: boolean | undefined): void {
        if (value !== undefined) {
            this.localStorage.setItem(CoinageLocalStorageService.KEY_BOOLEAN_TEMPLATE(key), value.toString());
        } else {
            this.localStorage.removeItem(CoinageLocalStorageService.KEY_BOOLEAN_TEMPLATE(key));
        }
    }

    public getBoolean(key: string): boolean | undefined {
        const n = this.localStorage.getItem(CoinageLocalStorageService.KEY_BOOLEAN_TEMPLATE(key));
        if (n !== null) {
            return Boolean(n);
        }
        return undefined;
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
        return undefined;
    }

    public setString(key: string, value: string | undefined): void {
        if (value !== undefined) {
            this.localStorage.setItem(CoinageLocalStorageService.KEY_STRING_TEMPLATE(key), value);
        } else {
            this.localStorage.removeItem(CoinageLocalStorageService.KEY_STRING_TEMPLATE(key));
        }
    }

    public getString(key: string): string | undefined {
        return this.localStorage.getItem(CoinageLocalStorageService.KEY_STRING_TEMPLATE(key)) ?? undefined;
    }

    public setObject<T>(key: string, object: T | undefined): void {
        if (object !== undefined) {
            const serializedObject = JSON.stringify(object);
            this.localStorage.setItem(CoinageLocalStorageService.KEY_OBJECT_TEMPLATE(key), serializedObject);
        } else {
            this.localStorage.removeItem(CoinageLocalStorageService.KEY_OBJECT_TEMPLATE(key));
        }
        return undefined;
    }

    public getObject<T>(key: string, constructor?: (v: string) => T): T | undefined {
        const objStr = this.localStorage.getItem(CoinageLocalStorageService.KEY_OBJECT_TEMPLATE(key));
        if (objStr) {
            if (constructor) {
                return constructor(JSON.parse(objStr));
            }
            return JSON.parse(objStr);
        }
        return undefined;
    }
}
