import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from '../../../entities/blog.entity';
import { BlogManageQueryDto, AdminUpdateBlogDto } from '../dto/blog-manage.dto';

interface CountResultItem {
  blogId: number;
  count: string;
}

interface BlogWithAuthor {
  id: number;
  title: string;
  summary: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: number;
    username: string;
  };
}

@Injectable()
export class AdminBlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  async getBlogs(query: BlogManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const { keyword, isPublished, sortBy, sortOrder } = query;

    const baseQb = this.blogRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.author', 'author')
      .select([
        'blog.id',
        'blog.title',
        'blog.summary',
        'blog.isPublished',
        'blog.viewCount',
        'blog.createdAt',
        'blog.updatedAt',
        'author.id',
        'author.username',
      ]);

    if (keyword) {
      baseQb.where('blog.title LIKE :keyword OR blog.summary LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }
    if (isPublished !== undefined) {
      baseQb.andWhere('blog.isPublished = :isPublished', { isPublished });
    }

    const orderField = sortBy ? `blog.${sortBy}` : 'blog.createdAt';
    const orderDirection = sortOrder || 'DESC';
    baseQb.orderBy(orderField, orderDirection);

    const list = await baseQb.getMany();
    const blogIds = list.map((b) => b.id);

    if (blogIds.length === 0) {
      return { list: [], total: 0 };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [likeCounts, commentCounts, favoriteCounts] = await Promise.all([
      blogIds.length
        ? this.blogRepository.manager.query(`
        SELECT blogId, COUNT(*) as count FROM \`like\` WHERE blogId IN (${blogIds.join(',')}) GROUP BY blogId
      `)
        : [],
      blogIds.length
        ? this.blogRepository.manager.query(`
        SELECT blogId, COUNT(*) as count FROM comment WHERE blogId IN (${blogIds.join(',')}) GROUP BY blogId
      `)
        : [],
      blogIds.length
        ? this.blogRepository.manager.query(`
        SELECT blogId, COUNT(*) as count FROM favorite WHERE blogId IN (${blogIds.join(',')}) GROUP BY blogId
      `)
        : [],
    ]);

    const likeMap = new Map<number, number>(
      (likeCounts as CountResultItem[]).map((l) => [
        l.blogId,
        parseInt(l.count),
      ]),
    );
    const commentMap = new Map<number, number>(
      (commentCounts as CountResultItem[]).map((c) => [
        c.blogId,
        parseInt(c.count),
      ]),
    );
    const favoriteMap = new Map<number, number>(
      (favoriteCounts as CountResultItem[]).map((f) => [
        f.blogId,
        parseInt(f.count),
      ]),
    );

    const start = (pageNum - 1) * sizeNum;
    const paginatedList = list.slice(start, start + sizeNum);

    return {
      list: paginatedList.map((blog) => {
        const author = blog.author as BlogWithAuthor['author'] | undefined;
        return {
          id: blog.id,
          title: blog.title,
          summary: blog.summary,
          isPublished: blog.isPublished,
          viewCount: blog.viewCount,
          likeCount: likeMap.get(blog.id) || 0,
          commentCount: commentMap.get(blog.id) || 0,
          favoriteCount: favoriteMap.get(blog.id) || 0,
          authorUsername: author?.username,
          authorId: author?.id,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        };
      }),
      total: list.length,
    };
  }

  async getBlogById(id: number) {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!blog) {
      throw new NotFoundException('博客不存在');
    }
    return blog;
  }

  async updateBlog(id: number, dto: AdminUpdateBlogDto) {
    const blog = await this.getBlogById(id);
    Object.assign(blog, dto);
    return this.blogRepository.save(blog);
  }

  async deleteBlog(id: number) {
    const blog = await this.getBlogById(id);
    await this.blogRepository.remove(blog);
  }

  async toggleBlogPublish(id: number, isPublished: boolean) {
    const blog = await this.getBlogById(id);
    blog.isPublished = isPublished;
    return this.blogRepository.save(blog);
  }
}
