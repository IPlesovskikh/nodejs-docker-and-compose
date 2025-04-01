import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Wishlist } from '../wishlists/wishlist.entity';
import { Offer } from '../offers/offer.entity';
import { Wish } from '../wishes/wish.entity';
import { AuthModule } from '../auth/auth.module';
import { WishesModule } from '../wishes/wishes.module';
import { WishesService } from '../wishes/wishes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wishlist, Offer, Wish]),
    forwardRef(() => AuthModule),
    forwardRef(() => WishesModule),
  ],
  providers: [UsersService, WishesService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
