import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { User } from '../entities/User.entity';
import { BaseDao } from './base.bao';

@Injectable()
export class UserDao extends BaseDao {
    public constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {
        super();
    }

    public async getById(id: number): Promise<User> {
        const user = await this.userRepository.findOneBy({ id: Equal(id) });

        return this.validateNotNullById(User.name, id, user);
    }
}
