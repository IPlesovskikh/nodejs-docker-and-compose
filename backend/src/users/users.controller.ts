import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './user.entity';
import { AuthUser } from '../common/decorators/user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUserDto } from './dto/find-users.dto';
import { WishesService } from '../wishes/wishes.service';
import { plainToClass } from 'class-transformer';
import { Wish } from '../wishes/wish.entity';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private readonly wishesService: WishesService,
  ) {}

  @Get('me')
  async findOwner(@AuthUser() user: User): Promise<User> {
    return this.usersService.findOne({
      where: { id: user.id },
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

  @Patch('me')
  async updateOwner(
    @AuthUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateOne({ id: user.id }, updateUserDto);
  }

  @Get(':username')
  async getUser(@AuthUser() user: User, @Param('username') username: string) {
    return this.usersService.findOne({
      where: { username: username },
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

  @Post('find')
  searchUsers(@Body() query: FindUserDto) {
    return this.usersService.findMany(query);
  }

  @Get('me/wishes')
  async getWishes(@AuthUser() user: User) {
    const userId = user.id;
    const wishes = await this.wishesService.findUserWishes(userId);
    return wishes.map((wish) => plainToClass(Wish, wish));
  }

  @Get(':username/wishes')
  async getUserWishes(@Param('username') username: string) {
    const userId = (
      await this.usersService.findOne({
        where: { username: username },
        select: { id: true },
      })
    ).id;
    console.log(userId);
    return this.wishesService.findUserWishes(userId);
  }
}
