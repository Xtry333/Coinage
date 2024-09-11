import { Type } from '@angular/core';
import { Route } from '@angular/router';

type MappedParams<T extends UrlParams> = {
    [K in keyof T]: T[K] extends 'string' ? string : T[K] extends 'number' ? number : never;
};

type QueryKeyTypes = 'string' | 'number';

export interface UrlParams {
    [key: string]: QueryKeyTypes;
}

export class CoinageRoute<T extends UrlParams> {
    private route: Route;
    private queryKeys?: T;
    public constructor(
        readonly path: string,
        component: Type<any>,
        routeParams?: Omit<Route, 'path' | 'component'>,
        queryKeys?: T,
    ) {
        this.route = {
            ...routeParams,
            component,
            path,
        };

        if (queryKeys) {
            this.queryKeys = queryKeys;
        }
    }

    public getRoute(): Route {
        return this.route;
    }

    public getUrl(params: T extends undefined ? undefined : MappedParams<NonNullable<T>>): string {
        if (!this.queryKeys || !params) {
            return this.path;
        }
        let url = this.path;
        for (const key in this.queryKeys) {
            url = url.replace(`:${key}`, String(params[key]));
        }
        return url;
    }
}
