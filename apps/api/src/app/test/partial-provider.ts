import { Provider } from '@nestjs/common';

export type PartialProvider<Type> = Provider<Partial<Type>>;
