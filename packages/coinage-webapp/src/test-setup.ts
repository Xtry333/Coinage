/**
 * Global test setup for coinage-webapp
 *
 * This file provides common mocking and configuration for all Angular tests.
 * It automatically adds necessary providers and imports to avoid repetition
 * across individual test files.
 */

import 'jest-preset-angular/setup-env/zone';
import 'reflect-metadata';
import 'zone.js';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CurrencyPipe } from './app/pipes/currency.pipe';
import { NullTransformPipe } from './app/pipes/null-transform.pipe';
import { PlnCurrencyPipe } from './app/pipes/pln-currency.pipe';

declare global {
    function spyOn(obj: any, method: string): any;
}

(global as any).spyOn = function (obj: any, method: string) {
    return jest.spyOn(obj, method);
};

class MockSocket {
    connect = jest.fn(() => ({ subscribe: jest.fn() }));
    emit = jest.fn();
    fromEvent = jest.fn(() => ({ subscribe: jest.fn() }));
    removeListener = jest.fn();
    on = jest.fn();
    ioSocket = { id: 'test' };
}

jest.mock('ngx-socket-io', () => ({
    Socket: MockSocket,
    SocketIoModule: {},
    SocketIoConfig: {},
}));

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

class MockCoinageStorageService {
    get = jest.fn(() => null);
    set = jest.fn();
    remove = jest.fn();
    clear = jest.fn();
    attachEventListener = jest.fn();
    detachEventListener = jest.fn();
    getObject = jest.fn(() => null);
    getBoolean = jest.fn(() => false);
    getString = jest.fn(() => null);
    getNumber = jest.fn(() => 0);
    setObject = jest.fn();
    setBoolean = jest.fn();
    setString = jest.fn();
    setNumber = jest.fn();
    getAll = jest.fn(() => ({}));
    has = jest.fn(() => false);
    static KEY_OBJECT_TEMPLATE = (key: string) => key;
}

const PIPES = [CurrencyPipe, PlnCurrencyPipe, NullTransformPipe];

const originalConfigureTestingModule = TestBed.configureTestingModule;

TestBed.configureTestingModule = function (this: any, moduleDef: any) {
    if (!moduleDef.imports) {
        moduleDef.imports = [];
    }
    if (!moduleDef.providers) {
        moduleDef.providers = [];
    }
    if (!moduleDef.schemas) {
        moduleDef.schemas = [];
    }

    if (!moduleDef.schemas.includes(CUSTOM_ELEMENTS_SCHEMA)) {
        moduleDef.schemas.push(CUSTOM_ELEMENTS_SCHEMA);
    }

    const hasHttpClient = moduleDef.imports?.some((m: any) => m === HttpClientTestingModule || m?.name === 'HttpClientTestingModule');
    if (!hasHttpClient) {
        moduleDef.imports.push(HttpClientTestingModule);
    }

    const hasRouterTesting = moduleDef.imports?.some((m: any) => m === RouterTestingModule || m?.name === 'RouterTestingModule');
    if (!hasRouterTesting) {
        moduleDef.imports.push(RouterTestingModule);
    }

    const hasFormsModule = moduleDef.imports?.some((m: any) => m === FormsModule || m?.name === 'FormsModule');
    if (!hasFormsModule) {
        moduleDef.imports.push(FormsModule);
    }

    const hasReactiveFormsModule = moduleDef.imports?.some((m: any) => m === ReactiveFormsModule || m?.name === 'ReactiveFormsModule');
    if (!hasReactiveFormsModule) {
        moduleDef.imports.push(ReactiveFormsModule);
    }

    if (!moduleDef.declarations) {
        moduleDef.declarations = [];
    }
    for (const pipe of PIPES) {
        const hasPipe = moduleDef.declarations.some((d: any) => d === pipe || d?.name === pipe.name);
        if (!hasPipe) {
            moduleDef.declarations.push(pipe);
        }
    }

    const hasStorageMock = moduleDef.providers?.some((p: any) => p?.provide?.name === 'CoinageStorageService' || p?.provide === 'CoinageStorageService');
    if (!hasStorageMock) {
        try {
            const CoinageStorageService = require('./app/core/services/storage-service/coinage-storage.service').CoinageStorageService;
            if (CoinageStorageService) {
                moduleDef.providers.push({
                    provide: CoinageStorageService,
                    useClass: MockCoinageStorageService,
                });
            }
        } catch (e) {
            // Service not available, skip
        }
    }

    const hasSocketMock = moduleDef.providers?.some((p: any) => p?.provide?.name === 'Socket');
    if (!hasSocketMock) {
        try {
            const { Socket } = require('ngx-socket-io');
            if (Socket) {
                moduleDef.providers.push({
                    provide: Socket,
                    useClass: MockSocket,
                });
            }
        } catch (e) {
            // Socket not available, skip
        }
    }

    const hasWindowServiceMock = moduleDef.providers?.some((p: any) => p?.provide?.name === 'WindowService');
    if (!hasWindowServiceMock) {
        try {
            const WindowService = require('./app/core/services/window-service/window-service.service').WindowService;
            if (WindowService) {
                moduleDef.providers.push({
                    provide: WindowService,
                    useValue: { getWindow: () => ({ location: { href: '' } }) },
                });
            }
        } catch (e) {
            // WindowService not available, skip
        }
    }

    return originalConfigureTestingModule.call(this, moduleDef);
} as typeof TestBed.configureTestingModule;
