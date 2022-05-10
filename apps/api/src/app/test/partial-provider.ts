import { Provider, Type } from '@nestjs/common';

export type PartialProvider<T> = Provider<Partial<T>> & {
    provide: Type<T>;
    useValue: Partial<T>;
};
