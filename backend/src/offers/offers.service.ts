import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Offer } from './offer.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Wish } from '../wishes/wish.entity';
import { plainToClass } from 'class-transformer';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wish)
    private wishRepository: Repository<Wish>,
    private dataSource: DataSource,
  ) {}

  async create(createOfferDto: CreateOfferDto, user: User): Promise<Offer> {
    const { amount, hidden, itemId } = createOfferDto;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const currentUser = await queryRunner.manager.findOne(User, {
        where: { id: user.id },
      });

      const wish = await queryRunner.manager.findOne(Wish, {
        where: { id: itemId },
        relations: ['owner'],
      });
      if (!currentUser || !wish) {
        throw new NotFoundException('User or Wish not found');
      }

      if (wish.owner.id === currentUser.id) {
        throw new ForbiddenException('Вы не можете скидывать себе на подарок');
      }
      const totalRaised = Number(wish.raised) + Number(amount);

      if (totalRaised > wish.price) {
        throw new ForbiddenException('Собранная сумма превышает желаемую цену');
      }
      if (totalRaised < 0) {
        throw new ForbiddenException(
          'Привлеченная сумма не может быть менее 0',
        );
      }
      if (amount <= 0) {
        throw new ForbiddenException('Сумма не может быть меньше или равна 0');
      }

      wish.raised = totalRaised;
      await queryRunner.manager.save(wish);

      const offer = new Offer();
      offer.amount = amount;
      offer.hidden = hidden || false;
      offer.user = currentUser;
      offer.item = wish;

      const savedOffer = await queryRunner.manager.save(offer);

      await queryRunner.commitTransaction();
      return savedOffer;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    const offers = await this.offerRepository.find({
      relations: ['item', 'user'],
    });
    return offers.map((offer) => plainToClass(Offer, offer));
  }

  findOne(id: number) {
    const offer = this.offerRepository.findOne({
      where: { id },
      relations: ['item', 'user'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return plainToClass(Offer, offer);
  }
}
