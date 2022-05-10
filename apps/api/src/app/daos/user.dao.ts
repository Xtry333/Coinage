import { Injectable } from '@nestjs/common';
import { Equal, getConnection } from 'typeorm';
import { User } from '../entities/User.entity';

@Injectable()
export class UserDao {
    async getById(id: number): Promise<User | null> {
        return await getConnection()
            .getRepository(User)
            .findOne({ where: { id: Equal(id) } });
    }
}
