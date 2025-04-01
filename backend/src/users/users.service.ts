import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { FindOneOptions, Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword } from '../auth/hash/hash';
import { FindUserDto } from './dto/find-users.dto';
import { Wish } from '../wishes/wish.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wish)
    private readonly wishRepository: Repository<Wish>,
  ) {}

  async signup(createUserDto: CreateUserDto): Promise<User> {
    const { email, username, password } = createUserDto;

    const existingUserByEmail = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUserByEmail) {
      throw new ConflictException(
        'Пользователь с таким email уже зарегистрирован',
      );
    }

    const existingUserByUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUserByUsername) {
      throw new ConflictException(
        'Пользователь с таким username уже зарегистрирован',
      );
    }

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashPassword(password),
    });
    return this.userRepository.save(user);
  }

  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(userData);
    return this.userRepository.save(newUser);
  }

  async findOne(query: FindOneOptions<User>) {
    return this.userRepository.findOne(query);
  }

  async findMany(query: FindUserDto): Promise<User[]> {
    return this.userRepository.find({
      where: [{ username: query.query }, { email: query.query }],
      select: {
        email: true,
        username: true,
        id: true,
        about: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: number): Promise<User> {
    return this.userRepository.findOneBy({ id });
  }

  async updateOne(query: Partial<User>, newData: Partial<User>): Promise<User> {
    if (newData.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: newData.email },
      });
      if (existingUser && existingUser.id !== query.id) {
        throw new BadRequestException(
          'Пользователь с таким email уже зарегистрирован',
        );
      }
    }

    if (newData.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: newData.username },
      });
      if (existingUser && existingUser.id !== query.id) {
        throw new BadRequestException(
          'Пользователь с таким username уже зарегистрирован',
        );
      }
    }
    if (newData.password) {
      newData.password = hashPassword(newData.password);
    }
    await this.userRepository.update(query, newData);
    return this.userRepository.findOne({ where: query });
  }

  async removeOne(query: Partial<User>): Promise<void> {
    await this.userRepository.delete(query);
  }
}
