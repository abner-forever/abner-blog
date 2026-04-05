import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { Blog } from '../entities/blog.entity';
import { Like } from '../entities/like.entity';
import { Favorite } from '../entities/favorite.entity';
import { ViewLog } from '../entities/view-log.entity';
import { Comment } from '../entities/comment.entity';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { SearchBlogDto } from './dto/search-blog.dto';

describe('BlogsService', () => {
  let service: BlogsService;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    nickname: '昵称',
    email: 'test@example.com',
    password: 'hashedpassword',
    avatar: null,
    bio: null,
    status: UserStatus.ACTIVE,
    usernameChangeCount: 0,
    usernameChangeDate: new Date(),
    loginFailureCount: 0,
    lastLoginAt: null,
    lastLoginIp: null,
    lockedUntil: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    verificationCode: null,
    verificationCodeExpires: null,
    blogs: [],
    comments: [],
    todos: [],
    likes: [],
    favorites: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    resume: null,
    role: UserRole.ADMIN,
  };

  const mockBlog: Blog = {
    id: 1,
    title: 'Test Blog',
    content: 'Test content',
    author: mockUser,
    comments: [],
    likes: [],
    favorites: [],
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    summary: '',
    tags: [],
    isPublished: false,
    cover: null,
    mdTheme: null,
  };

  const createQueryBuilderMock = () => {
    const chain = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    return chain;
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn().mockImplementation(createQueryBuilderMock),
  };

  const mockLikeRepo = {
    createQueryBuilder: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
    delete: jest.fn().mockResolvedValue(undefined),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
  };
  const mockFavRepo = {
    createQueryBuilder: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
    delete: jest.fn().mockResolvedValue(undefined),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
  };
  const mockViewLogRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((dto: object) => dto),
    save: jest.fn().mockResolvedValue({}),
  };
  const mockCommentRepo = {
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogsService,
        { provide: getRepositoryToken(Blog), useValue: mockRepository },
        { provide: getRepositoryToken(Like), useValue: mockLikeRepo },
        { provide: getRepositoryToken(Favorite), useValue: mockFavRepo },
        { provide: getRepositoryToken(ViewLog), useValue: mockViewLogRepo },
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepo },
      ],
    }).compile();

    service = module.get<BlogsService>(BlogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new blog successfully', async () => {
      // Arrange
      const createBlogDto: CreateBlogDto = {
        title: 'New Blog',
        content: 'New content',
        summary: '',
        tags: [],
      };
      const userId = 1;
      const expectedBlog = {
        ...mockBlog,
        ...createBlogDto,
        author: { id: userId },
      };

      mockRepository.create.mockReturnValue(expectedBlog);
      mockRepository.save.mockResolvedValue(expectedBlog);

      // Act
      const result = await service.create(createBlogDto, userId);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createBlogDto,
        author: { id: userId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedBlog);
      expect(result).toEqual(expectedBlog);
    });
  });

  describe('findAll', () => {
    it('should return paginated blogs without filters', async () => {
      const searchDto: SearchBlogDto = { page: 1, pageSize: 10 };
      const result = await service.findAll(searchDto);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('blog');
      expect(result).toEqual({
        list: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });
    });

    it('should return paginated blogs with search filter', async () => {
      const searchDto: SearchBlogDto = {
        page: 1,
        pageSize: 10,
        search: 'test',
      };
      const result = await service.findAll(searchDto);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('blog');
      expect(result.list).toEqual([]);
    });

    it('should return paginated blogs with isAuthor filter', async () => {
      const searchDto: SearchBlogDto = {
        page: 1,
        pageSize: 10,
        isAuthor: true,
      };
      const userId = 1;
      const result = await service.findAll(searchDto, userId);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('blog');
      expect(result.list).toEqual([]);
    });

    it('should calculate total pages correctly', async () => {
      const searchDto: SearchBlogDto = { page: 1, pageSize: 5 };
      const total = 12;
      const qb = createQueryBuilderMock();
      qb.getManyAndCount.mockResolvedValue([[], total]);
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(searchDto);

      expect(result.totalPages).toBe(3);
      expect(result.total).toBe(12);
    });
  });

  describe('findOne', () => {
    it('should return blog when found', async () => {
      const id = 1;
      const userId = 1;
      mockRepository.findOne.mockResolvedValue({ ...mockBlog });

      const result = await service.findOne(id, userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['author'],
      });
      expect(result.author).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        nickname: mockUser.nickname,
        avatar: mockUser.avatar,
      });
      expect(result).toMatchObject({
        id: mockBlog.id,
        title: mockBlog.title,
        content: mockBlog.content,
        likesCount: 0,
        favoritesCount: 0,
        commentCount: 0,
        isLiked: false,
        isFavorited: false,
      });
    });

    it('should throw NotFoundException when blog not found', async () => {
      // Arrange
      const id = 999;
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['author'],
      });
    });
  });

  describe('update', () => {
    it('should update blog successfully when user is author', async () => {
      // Arrange
      const id = 1;
      const updateBlogDto: UpdateBlogDto = {
        title: 'Updated Title',
        content: 'Updated content',
      };
      const userId = 1;
      const updatedBlog = { ...mockBlog, ...updateBlogDto };

      mockRepository.findOne.mockResolvedValue(mockBlog);
      mockRepository.save.mockResolvedValue(updatedBlog);

      // Act
      const result = await service.update(id, updateBlogDto, userId);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['author'],
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockBlog,
        ...updateBlogDto,
      });
      expect(result).toEqual({
        ...updatedBlog,
        author: {
          id: mockUser.id,
          username: mockUser.username,
          nickname: mockUser.nickname,
          avatar: mockUser.avatar,
        },
      });
    });

    it('should throw ForbiddenException when user is not author', async () => {
      // Arrange
      const id = 1;
      const updateBlogDto: UpdateBlogDto = {
        title: 'Updated Title',
      };
      const userId = 2; // Different user

      mockRepository.findOne.mockResolvedValue(mockBlog);

      // Act & Assert
      await expect(service.update(id, updateBlogDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['author'],
      });
    });

    it('should throw NotFoundException when blog not found', async () => {
      // Arrange
      const id = 999;
      const updateBlogDto: UpdateBlogDto = {
        title: 'Updated Title',
      };
      const userId = 1;

      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(id, updateBlogDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove blog successfully when user is author', async () => {
      // Arrange
      const id = 1;
      const userId = 1;

      mockRepository.findOne.mockResolvedValue(mockBlog);
      mockRepository.remove.mockResolvedValue(undefined);

      // Act
      await service.remove(id, userId);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['author'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockBlog);
    });

    it('should throw ForbiddenException when user is not author', async () => {
      // Arrange
      const id = 1;
      const userId = 2; // Different user

      mockRepository.findOne.mockResolvedValue(mockBlog);

      // Act & Assert
      await expect(service.remove(id, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['author'],
      });
    });

    it('should throw NotFoundException when blog not found', async () => {
      // Arrange
      const id = 999;
      const userId = 1;

      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(id, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
