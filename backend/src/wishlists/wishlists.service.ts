import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from './wishlist.entity';
import { In, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Wish } from '../wishes/wish.entity';
import { plainToClass } from 'class-transformer';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wish)
    private wishRepository: Repository<Wish>,
  ) {}

  async create(
    createWishlistDto: CreateWishlistDto,
    user: User,
  ): Promise<Wishlist> {
    const { name, image, itemsId } = createWishlistDto;
    const currentUser = await this.userRepository.findOne({
      where: { id: user.id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wishes = await this.wishRepository.find({
      where: { id: In(itemsId) },
    });
    if (wishes.length !== itemsId.length) {
      throw new BadRequestException('Some wishes not found');
    }

    const wishlist = new Wishlist();
    wishlist.name = name;
    wishlist.description = '';
    wishlist.image = image || '';
    wishlist.owner = currentUser;
    wishlist.items = wishes;

    return this.wishlistRepository.save(wishlist);
  }

  async findAll(id: number) {
    const wishlists = await this.wishlistRepository.find({
      where: { owner: { id } },
      relations: ['owner', 'items'],
    });
    return wishlists.map((wishlist) => plainToClass(Wishlist, wishlist));
  }

  findOne(id: number) {
    const wishlist = this.wishlistRepository.findOne({
      where: { id },
      relations: ['owner', 'items'],
    });

    return plainToClass(Wishlist, wishlist);
  }

  async update(
    id: number,
    updateWishlistDto: UpdateWishlistDto,
    userId: number,
  ): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id },
      relations: ['owner', 'items'],
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    if (wishlist.owner.id !== userId) {
      throw new BadRequestException('You can only update your own wishlists');
    }

    const { name, description, image, itemsId } = updateWishlistDto;

    if (name) wishlist.name = name;
    if (description) wishlist.description = description;
    if (image) wishlist.image = image;

    if (itemsId) {
      const wishes = await this.wishRepository.find({
        where: { id: In(itemsId) },
      });
      if (wishes.length !== itemsId.length) {
        throw new BadRequestException('Some wishes not found');
      }
      wishlist.items = wishes;
    }

    const updatedWishlist = await this.wishlistRepository.save(wishlist);

    return plainToClass(Wishlist, updatedWishlist);
  }

  async removeOne(id: number, userId: number): Promise<void> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException('You can only delete your own wishlists');
    }

    await this.wishlistRepository.delete({ id });
  }
}
