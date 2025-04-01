import { Module } from '@nestjs/common';
import { WishesService } from './wishes.service';
import { WishesController } from './wishes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wish } from './wish.entity';
import { Offer } from '../offers/offer.entity';
import { Wishlist } from '../wishlists/wishlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wish, Offer, Wishlist])],
  controllers: [WishesController],
  providers: [WishesService],
  exports: [WishesService],
})
export class WishesModule {}
