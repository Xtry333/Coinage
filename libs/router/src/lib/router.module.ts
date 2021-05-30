// import { Module } from '@nestjs/common';

// @Module({
//     controllers: [],
//     providers: [],
//     exports: [],
// })
export class ApiPathsModule {
    getTransfer(id: number): string {
        return this.getApiUrl() + `/transfer/get/${id}`;
    }

    getApiUrl(): string {
        return '/api';
    }
}
