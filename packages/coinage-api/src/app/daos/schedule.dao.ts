import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { Schedule } from '../entities/Schedule.entity';
import { Writeable } from '../types/Writeable.type';
import { BaseDao } from './base.dao';

@Injectable()
export class ScheduleDao extends BaseDao {
    public constructor(@InjectRepository(Schedule) private readonly scheduleRepository: Repository<Schedule>) {
        super();
    }

    public async getAll(): Promise<Schedule[]> {
        return await this.scheduleRepository.find();
    }

    public async getById(id: number): Promise<Schedule> {
        const schedule = await this.scheduleRepository.findOneBy({ id: Equal(id) });
        return this.validateNotNullById(Schedule.name, id, schedule);
    }

    public async save(schedule: Writeable<Schedule>): Promise<Schedule> {
        return await this.scheduleRepository.save(schedule);
    }

    public async deleteById(id: number): Promise<void> {
        await this.scheduleRepository.delete({ id: Equal(id) });
    }

    public async findByName(name: string): Promise<Schedule[]> {
        return await this.scheduleRepository.find({
            where: { name },
        });
    }

    public async getActiveSchedules(): Promise<Schedule[]> {
        return await this.scheduleRepository.find({
            relations: ['transfers'],
        });
    }
}
