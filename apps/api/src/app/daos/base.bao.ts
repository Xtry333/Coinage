import { NotFoundException } from '@nestjs/common';

export class BaseDao {
    public validateNotNullById<Type>(paramName: string, id: number, value: Type | null): Type {
        const capitalizedParamName = paramName.charAt(0).toUpperCase() + paramName.slice(1);

        if (value === null) {
            throw new NotFoundException(`${capitalizedParamName} with ID ${id} not found!`);
        }

        return value;
    }
}
