import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateWishDto } from './dto/update-wish.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Wish } from './wish.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateWishDto } from './dto/create-wish.dto';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishRepository: Repository<Wish>,
  ) {}

  async createWish(user: User, wish: CreateWishDto): Promise<Wish> {
    const newWish = this.wishRepository.create({ ...wish, owner: user });
    return this.wishRepository.save(newWish);
  }

  async findLastWishes(limit = 40): Promise<Wish[]> {
    return this.wishRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      relations: ['owner'],
    });
  }

  async findTopWishes(limit = 20): Promise<Wish[]> {
    return this.wishRepository.find({
      order: {
        copied: 'DESC',
      },
      take: limit,
      relations: ['owner'],
    });
  }

  async findUserWishes(userId: number): Promise<Wish[]> {
    return this.wishRepository.find({
      where: { owner: { id: userId } },
      relations: ['owner'],
    });
  }

  findOne(id: number): Promise<Wish> {
    return this.wishRepository.findOne({ where: { id }, relations: ['owner'] });
  }

  async updateOne(id: number, updateWishDto: UpdateWishDto, userId: number) {
    const wish = await this.wishRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!wish) {
      throw new NotFoundException('Wish not found');
    }
    if (wish.owner.id !== userId) {
      throw new ForbiddenException('You are not allowed to update this wish');
    }
    return this.wishRepository.update({ id }, { ...updateWishDto });
  }

  async removeOne(id: number, userId: number): Promise<any> {
    const wish = await this.wishRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!wish) {
      throw new NotFoundException('Wish not found');
    }

    if (wish.owner.id !== userId) {
      throw new ForbiddenException('You are not allowed to delete this wish');
    }

    return this.wishRepository.delete(id);
  }

  async copyWish(id: number, user: User): Promise<{ id: number }> {
    const wish = await this.findOne(id);

    if (!wish) {
      throw new NotFoundException('Wish not found');
    }

    if (wish.owner.id === user.id) {
      throw new ForbiddenException('You cannot copy your own wish');
    }

    const totalCopies = wish.copied + 1;

    await this.wishRepository.update({ id }, { copied: totalCopies });

    const newWish = this.wishRepository.create({
      ...wish,
      owner: user,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      raised: 0,
    });
    await this.wishRepository.save(newWish);
    return { id: newWish.id };
  }
}
