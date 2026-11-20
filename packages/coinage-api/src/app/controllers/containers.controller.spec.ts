import { ContainersController } from './containers.controller';
import { ContainerDao } from '../daos/container.dao';
import { ItemsWithContainersDao } from '../daos/itemsWithContainers.dao';
import { SharedContainersService } from '../services/shared-containers.service';

describe('ContainersController legacy compatibility', () => {
    it('does not substitute packaging names or composite totals for shared container definitions', async () => {
        const getById = jest.fn().mockResolvedValue({
            id: 7,
            name: 'Legacy can',
            weight: null,
            weightUnit: null,
            volume: 250,
            volumeUnit: 'ml',
            itemCount: 1,
        });
        const controller = new ContainersController(
            { getById } as unknown as ContainerDao,
            {
                getContainersUsedWithItem: jest.fn().mockResolvedValue([
                    { containerId: 7, containerName: 'Own can name', containerVolume: 0.25 },
                    { containerId: 7, containerName: 'Own box name', containerVolume: 6 },
                    { containerId: null, containerName: 'Pallet', containerVolume: 60 },
                ]),
            } as unknown as ItemsWithContainersDao,
            {} as SharedContainersService,
        );
        expect(await controller.getContainersUsedWithItem(1)).toEqual([
            {
                id: 7,
                name: 'Legacy can',
                weight: null,
                weightUnit: null,
                volume: 250,
                volumeUnit: 'ml',
                itemCount: 1,
            },
        ]);
        expect(getById).toHaveBeenCalledTimes(1);
    });
});
