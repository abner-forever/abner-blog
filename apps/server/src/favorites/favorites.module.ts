import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service';
import {
  FavoritesController,
  UserFavoritesController,
} from './favorites.controller';
import { Favorite } from '../entities/favorite.entity';
import { Blog } from '../entities/blog.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Blog, User])],
  controllers: [FavoritesController, UserFavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
