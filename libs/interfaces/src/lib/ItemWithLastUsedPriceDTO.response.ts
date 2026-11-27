import { DEFAULT_ITEM_KIND } from './ItemKindDTO';
import { TagDTO } from './TagDTO.response';

export class ItemWithLastUsedPriceDTO {
    public constructor(
        public id: number,
        public name: string,
        public containerSize: number | null,
        public containerSizeUnit: string | null,
        public lastUsedDate: Date | null,
        public lastUnitPrice: number | null,
        public categoryId: number,
        public tags: TagDTO[] = [],
        public kindCode: string = DEFAULT_ITEM_KIND,
    ) {}
}
