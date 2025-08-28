export interface ScheduleDTO {
    id: number;
    name: string;
    recurrence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
    startDate: Date;
    count: number;
    transferCount?: number;
}

export interface CreateScheduleDTO {
    name: string;
    recurrence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
    startDate: Date;
    count: number;
    metadata?: { [key: string]: string | number | undefined };
}
