import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from './hash/hash';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne({
      select: { username: true, password: true, id: true },
      where: { username },
    });

    if (user && comparePassword(password, user.password)) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const { username, id } = user;

    return {
      access_token: await this.jwtService.signAsync({ username, id }),
    };
  }
}
