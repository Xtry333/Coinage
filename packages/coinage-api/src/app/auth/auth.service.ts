import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UserDao } from '../daos/user.dao';
import { User } from '../entities/User.entity';

interface JwtPayload {
    username: string;
    sub: number;
}

@Injectable()
export class AuthService {
    public constructor(
        private readonly jwtService: JwtService,
        private readonly userDao: UserDao,
    ) {}

    public async validateUser(token: string): Promise<User | undefined> {
        try {
            const payload: JwtPayload = this.jwtService.verify(token);
            const user = await this.userDao.getByUsername(payload.username);
            return user;
        } catch {
            return undefined;
        }
    }

    public async loginUser(username: string, password: string): Promise<string> {
        const user = await this.userDao.getByUsername(username);

        if (user === undefined || user.password === undefined) {
            throw new Error('Invalid credentials.');
        }

        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        const isValid = isHashed ? await bcrypt.compare(password, user.password) : user.password === password;

        if (!isValid) {
            throw new Error('Invalid credentials.');
        }

        const payload: JwtPayload = { sub: user.id, username: user.name };
        return this.jwtService.signAsync(payload);
    }

    public static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
    }
}
