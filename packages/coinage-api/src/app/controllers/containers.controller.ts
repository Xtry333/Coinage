import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';

import { BaseResponseDTO } from '@app/interfaces';

import { ContainerDao } from '../daos/container.dao';
import { Container } from '../entities/Container.entity';
import { AuthGuard } from '../services/auth.guard';

export interface ContainerDTO {
    id: number;
    name: string | null;
    weight: number | null;
    weightUnit: string | null;
    volume: number | null;
    volumeUnit: string | null;
    itemCount: number | null;
}

export interface CreateEditContainerDTO {
    id?: number;
    name?: string | null;
    weight?: number | null;
    weightUnit?: string | null;
    volume?: number | null;
    volumeUnit?: string | null;
    itemCount?: number | null;
}

@UseGuards(AuthGuard)
@Controller('containers')
export class ContainersController {
    private static INVALID_ID_MESSAGE = 'Invalid ID provided.';

    public constructor(private readonly containerDao: ContainerDao) {}

    @Get()
    public async getAllContainers(): Promise<ContainerDTO[]> {
        const containers = await this.containerDao.getAllContainers();
        return containers.map((container) => this.toContainerDTO(container));
    }

    @Get(':containerId')
    public async getContainerById(@Param('containerId') containerId: number): Promise<ContainerDTO> {
        if (!containerId || containerId < 1) {
            throw new BadRequestException(ContainersController.INVALID_ID_MESSAGE);
        }

        const container = await this.containerDao.getById(containerId);
        if (!container) {
            throw new NotFoundException('Container not found.');
        }

        return this.toContainerDTO(container);
    }

    @Post()
    public async createContainer(@Body() containerData: CreateEditContainerDTO): Promise<BaseResponseDTO> {
        const container = new Container();
        this.mapToEntity(container, containerData);

        const saved = await this.containerDao.save(container);
        return { insertedId: saved.id };
    }

    @Put(':containerId')
    public async updateContainer(@Param('containerId') containerId: number, @Body() containerData: CreateEditContainerDTO): Promise<BaseResponseDTO> {
        if (!containerId || containerId < 1) {
            throw new BadRequestException(ContainersController.INVALID_ID_MESSAGE);
        }

        const container = await this.containerDao.getById(containerId);
        if (!container) {
            throw new NotFoundException('Container not found.');
        }

        this.mapToEntity(container, containerData);

        const saved = await this.containerDao.save(container);
        return { insertedId: saved.id };
    }

    @Delete(':containerId')
    public async deleteContainer(@Param('containerId') containerId: number): Promise<BaseResponseDTO> {
        if (!containerId || containerId < 1) {
            throw new BadRequestException(ContainersController.INVALID_ID_MESSAGE);
        }

        const container = await this.containerDao.getById(containerId);
        if (!container) {
            throw new NotFoundException('Container not found.');
        }

        await this.containerDao.remove(container);
        return { insertedId: containerId };
    }

    private toContainerDTO(container: Container): ContainerDTO {
        return {
            id: container.id,
            name: container.name,
            weight: container.weight,
            weightUnit: container.weightUnit,
            volume: container.volume,
            volumeUnit: container.volumeUnit,
            itemCount: container.itemCount,
        };
    }

    private mapToEntity(container: Container, data: CreateEditContainerDTO): void {
        if (data.name !== undefined) container.name = data.name;
        if (data.weight !== undefined) container.weight = data.weight;
        if (data.weightUnit !== undefined) container.weightUnit = data.weightUnit;
        if (data.volume !== undefined) container.volume = data.volume;
        if (data.volumeUnit !== undefined) container.volumeUnit = data.volumeUnit;
        if (data.itemCount !== undefined) container.itemCount = data.itemCount;
    }
}
