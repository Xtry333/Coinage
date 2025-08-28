import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import { BaseResponseDTO } from '@app/interfaces';

import { ScheduleDao } from '../daos/schedule.dao';
import { Schedule } from '../entities/Schedule.entity';
import { User } from '../entities/User.entity';
import { AuthGuard, RequestingUser } from '../services/auth.guard';

export interface CreateScheduleDTO {
    name: string;
    recurrence: string;
    startDate: Date;
    count: number;
    metadata?: { [key: string]: string | number | undefined };
}

export interface ScheduleDTO {
    id: number;
    name: string;
    recurrence: string;
    startDate: Date;
    count: number;
    transferCount?: number;
}

@UseGuards(AuthGuard)
@Controller('schedules')
export class SchedulesController {
    public constructor(private readonly scheduleDao: ScheduleDao) {}

    @Get('all')
    public async getAllSchedules(): Promise<ScheduleDTO[]> {
        const schedules = await this.scheduleDao.getAll();
        return schedules.map((schedule) => this.mapToDTO(schedule));
    }

    @Get(':id')
    public async getScheduleById(@Param('id') id: number): Promise<ScheduleDTO> {
        const schedule = await this.scheduleDao.getById(id);
        return this.mapToDTO(schedule);
    }

    @Post('create')
    public async createSchedule(@RequestingUser() user: User, @Body() createScheduleDTO: CreateScheduleDTO): Promise<BaseResponseDTO> {
        const schedule = new Schedule();
        schedule.name = createScheduleDTO.name;
        schedule.recurrence = createScheduleDTO.recurrence as any;
        schedule.startDate = createScheduleDTO.startDate;
        schedule.count = createScheduleDTO.count;
        schedule.metadata = createScheduleDTO.metadata || {};

        const saved = await this.scheduleDao.save(schedule);
        return { insertedId: saved.id };
    }

    @Delete(':id')
    public async deleteSchedule(@Param('id') id: number): Promise<BaseResponseDTO> {
        await this.scheduleDao.deleteById(id);
        return { message: 'Schedule deleted successfully' };
    }

    private mapToDTO(schedule: Schedule): ScheduleDTO {
        return {
            id: schedule.id,
            name: schedule.name,
            recurrence: schedule.recurrence,
            startDate: schedule.startDate,
            count: schedule.count,
            transferCount: 0, // Will be populated later if needed
        };
    }
}
