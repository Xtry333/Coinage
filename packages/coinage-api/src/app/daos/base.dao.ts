import { NotFoundException } from '@nestjs/common';

interface TypeWithID {
    id: number;
}

export class BaseDao {
    public validateNotNullById<Type>(entityName: string, id: number, value: Type | null): Type {
        const capitalizedEntityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

        if (value === null) {
            throw new NotFoundException(`${capitalizedEntityName} with ID ${id} not found!`);
        }

        return value;
    }

    public validateExactAmountByIds<Type extends TypeWithID>(entityName: string, returnedEntities: Type[], requestedEntityIds: number[]): Type[] {
        const capitalizedEntityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

        const returnedIds = returnedEntities.map((e) => e.id);
        for (const id of requestedEntityIds) {
            if (returnedIds.find((eId) => eId === id) === undefined) {
                throw new NotFoundException(`${capitalizedEntityName} with ID ${id} missing in found ${returnedIds}!`);
            }
        }

        return returnedEntities;
    }
}
