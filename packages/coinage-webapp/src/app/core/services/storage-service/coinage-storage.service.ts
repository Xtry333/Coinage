import { Injectable } from '@angular/core';

import { StorageScope } from './storage-scope.enum';

@Injectable()
export class CoinageStorageService {
    public static readonly STORAGE_EVENT = 'storage';

    private readonly localStorage: Storage;
    private readonly sessionStorage: Storage;

    public static readonly KEY_BOOLEAN_TEMPLATE = (key: string) => `${key}-b`;
    public static readonly KEY_NUMBER_TEMPLATE = (key: string) => `${key}-n`;
    public static readonly KEY_STRING_TEMPLATE = (key: string) => `${key}-s`;
    public static readonly KEY_OBJECT_TEMPLATE = (key: string) => `${key}-o`;
    public static readonly KEY_ARRAY_TEMPLATE = (key: string) => `${key}-a`;

    public constructor() {
        this.localStorage = window.localStorage;
        this.sessionStorage = window.sessionStorage;
    }

    public attachEventListener(listener: (event: StorageEvent) => void): void {
        window.addEventListener(CoinageStorageService.STORAGE_EVENT, listener);
    }

    public setBoolean(key: string, value: boolean | undefined, scope: StorageScope = StorageScope.Persistent): void {
        if (value !== undefined) {
            this.getScopedStorage(scope).setItem(CoinageStorageService.KEY_BOOLEAN_TEMPLATE(key), value.toString());
        } else {
            this.getScopedStorage(scope).removeItem(CoinageStorageService.KEY_BOOLEAN_TEMPLATE(key));
        }
    }

    public getBoolean(key: string, scope: StorageScope = StorageScope.Persistent): boolean | undefined {
        const n = this.getScopedStorage(scope).getItem(CoinageStorageService.KEY_BOOLEAN_TEMPLATE(key));
        if (n !== null) {
            return Boolean(n);
        }
        return undefined;
    }

    public setNumber(key: string, value: number | undefined, scope: StorageScope = StorageScope.Persistent): void {
        if (value !== undefined) {
            this.getScopedStorage(scope).setItem(CoinageStorageService.KEY_NUMBER_TEMPLATE(key), value.toString());
        } else {
            this.getScopedStorage(scope).removeItem(CoinageStorageService.KEY_NUMBER_TEMPLATE(key));
        }
    }

    public getNumber(key: string, scope: StorageScope = StorageScope.Persistent): number | undefined {
        const n = this.getScopedStorage(scope).getItem(CoinageStorageService.KEY_NUMBER_TEMPLATE(key));
        if (n !== null) {
            return Number(n);
        }
        return undefined;
    }

    public setString(key: string, value: string | undefined, scope: StorageScope = StorageScope.Persistent): void {
        if (value !== undefined) {
            this.getScopedStorage(scope).setItem(CoinageStorageService.KEY_STRING_TEMPLATE(key), value);
        } else {
            this.getScopedStorage(scope).removeItem(CoinageStorageService.KEY_STRING_TEMPLATE(key));
        }
    }

    public getString(key: string, scope: StorageScope = StorageScope.Persistent): string | undefined {
        return this.getScopedStorage(scope).getItem(CoinageStorageService.KEY_STRING_TEMPLATE(key)) ?? undefined;
    }

    public setObject<T>(key: string, object: T | undefined, scope: StorageScope = StorageScope.Persistent): void {
        if (object !== undefined) {
            const serializedObject = JSON.stringify(object);
            this.getScopedStorage(scope).setItem(CoinageStorageService.KEY_OBJECT_TEMPLATE(key), serializedObject);
        } else {
            this.getScopedStorage(scope).removeItem(CoinageStorageService.KEY_OBJECT_TEMPLATE(key));
        }
        return undefined;
    }

    public getObject<T>(key: string, scope: StorageScope = StorageScope.Persistent, constructor?: (v: string) => T): T | undefined {
        const objStr = this.getScopedStorage(scope).getItem(CoinageStorageService.KEY_OBJECT_TEMPLATE(key));
        if (objStr) {
            if (constructor) {
                return constructor(JSON.parse(objStr));
            }
            return JSON.parse(objStr);
        }
        return undefined;
    }

    private getScopedStorage(scope: StorageScope): Storage {
        switch (scope) {
            case StorageScope.Persistent:
                return this.localStorage;
            case StorageScope.Session:
                return this.sessionStorage;
        }
    }
}
