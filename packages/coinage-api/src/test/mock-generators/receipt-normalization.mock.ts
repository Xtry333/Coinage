import { Category, TransferTypeEnum } from '../../app/entities/Category.entity';
import { Container } from '../../app/entities/Container.entity';
import { Contractor } from '../../app/entities/Contractor.entity';
import { Item } from '../../app/entities/Item.entity';
import { ItemsWithContainers } from '../../app/entities/views/ItemsWithContainers.view';

export function makeCategory(id: number, name: string, type = TransferTypeEnum.OUTCOME): Category {
    const c = new Category();
    c.id = id;
    c.name = name;
    c.type = type;
    return c;
}

export function makeContractor(id: number, name: string): Contractor {
    const c = new Contractor();
    c.id = id;
    c.name = name;
    c.isActive = true;
    return c;
}

export function makeItem(id: number, name: string, opts?: { brand?: string; categoryId?: number; containerSize?: number; containerSizeUnit?: string }): Item {
    const i = new Item();
    i.id = id;
    i.name = name;
    i.brand = opts?.brand ?? null;
    i.categoryId = opts?.categoryId ?? null;
    i.containerSize = opts?.containerSize ?? null;
    i.containerSizeUnit = opts?.containerSizeUnit ?? null;
    return i;
}

export function makeContainer(id: number, name: string, opts?: { volume?: number; volumeUnit?: string; weight?: number; weightUnit?: string; itemCount?: number }): Container {
    const c = new Container();
    c.id = id;
    c.name = name;
    c.volume = opts?.volume ?? null;
    c.volumeUnit = opts?.volumeUnit ?? null;
    c.weight = opts?.weight ?? null;
    c.weightUnit = opts?.weightUnit ?? null;
    c.itemCount = opts?.itemCount ?? null;
    return c;
}

export function makeItemContainerPair(
    itemId: number,
    containerId: number,
    containerName: string,
    opts?: { volume?: number; volumeUnit?: string; weight?: number; weightUnit?: string; itemCount?: number },
): ItemsWithContainers {
    const p = new ItemsWithContainers();
    p.itemId = itemId;
    p.itemName = 'Item ' + itemId;
    p.itemBrand = null;
    p.itemCategoryId = null;
    p.itemContainerSize = null;
    p.itemContainerSizeUnit = null;
    p.itemCreatedDate = new Date();
    p.itemUpdatedDate = new Date();
    p.containerId = containerId;
    p.containerName = containerName;
    p.containerVolume = opts?.volume ?? null;
    p.containerVolumeUnit = opts?.volumeUnit ?? null;
    p.containerWeight = opts?.weight ?? null;
    p.containerWeightUnit = opts?.weightUnit ?? null;
    p.containerItemCount = opts?.itemCount ?? null;
    return p;
}
