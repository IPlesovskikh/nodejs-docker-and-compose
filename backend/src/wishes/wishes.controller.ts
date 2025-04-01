import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { AuthUser } from '../common/decorators/user.decorator';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { plainToClass } from 'class-transformer';
import { Wish } from './wish.entity';

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createWish(
    @AuthUser() user: User,
    @Body() createWishDto: CreateWishDto,
  ) {
    await this.wishesService.createWish(user, createWishDto);
    return {};
  }

  @Get('last')
  async findLastWishes(@Query('limit') limit: number) {
    const parsedLimit = limit ? parseInt(String(limit), 10) : 40;
    const wishes = await this.wishesService.findLastWishes(parsedLimit);
    return wishes.map((wish) => plainToClass(Wish, wish));
  }

  @Get('top')
  async findTopWishes(@Query('limit') limit: number) {
    const parsedLimit = limit ? parseInt(String(limit), 10) : 20;
    const wishes = await this.wishesService.findTopWishes(parsedLimit);
    return wishes.map((wish) => plainToClass(Wish, wish));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const wish = this.wishesService.findOne(+id);
    return plainToClass(Wish, wish);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWishDto: UpdateWishDto,
    @AuthUser() user: User,
  ) {
    const userId = user.id;
    return this.wishesService.updateOne(+id, updateWishDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number, @AuthUser() user: User) {
    const userId = user.id;
    await this.wishesService.removeOne(id, userId);
    return { message: 'Wish deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/copy')
  async copy(@Param('id') id: number, @AuthUser() user: User) {
    return await this.wishesService.copyWish(id, user);
  }
}
