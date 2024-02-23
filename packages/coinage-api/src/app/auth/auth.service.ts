import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserDao } from '../daos/user.dao';
import { User } from '../entities/User.entity';

interface JwtPayload {
    username: string;
    sub: number;
}

@Injectable()
export class AuthService {
    public constructor(private readonly jwtService: JwtService, private readonly userDao: UserDao) {}

    public async validateUser(token: string): Promise<User | undefined> {
        try {
            const payload: JwtPayload = this.jwtService.verify(token);
            const user = await this.userDao.getByUsername(payload.username);
            return user;
        } catch (error) {
            console.error('Error:', error);
            return undefined;
        }
    }

    public async loginUser(username: string, password: string): Promise<string> {
        const user = await this.userDao.getByUsername(username);

        if (user.password === undefined || user.password !== password) {
            throw new Error('Invalid password.');
        }

        const payload: JwtPayload = { sub: user.id, username: user.name };
        return this.jwtService.signAsync(payload);
    }
}
