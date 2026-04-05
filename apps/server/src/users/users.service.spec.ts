import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { UserResume } from '../entities/user-resume.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;

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

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockResumeRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(UserResume),
          useValue: mockResumeRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const username = 'newuser';
      const password = 'password123';
      const email = 'new@example.com';
      const hashedPassword = 'hashedpassword123';

      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue({
        ...mockUser,
        username,
        email,
        password: hashedPassword,
      });
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        username,
        email,
        password: hashedPassword,
      });

      // Act
      const result = await service.create(username, password, email);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [{ username }, { email }],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username,
          password: hashedPassword,
          email,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          nickname: expect.any(String),
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.username).toBe(username);
      expect(result.email).toBe(email);
    });

    it('should throw ConflictException when username already exists', async () => {
      // Arrange
      const username = 'existinguser';
      const password = 'password123';
      const email = 'new@example.com';

      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(username, password, email)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [{ username }, { email }],
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const username = 'newuser';
      const password = 'password123';
      const email = 'existing@example.com';

      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(username, password, email)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
      // Arrange
      const username = 'testuser';
      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByUsername(username);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const username = 'nonexistentuser';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByUsername(username)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const id = 1;
      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById(id);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const id = 999;
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'password123';
      mockRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validateUser(username, password);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const username = 'nonexistentuser';
      const password = 'password123';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateUser(username, password)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when password is invalid', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'wrongpassword';
      mockRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.validateUser(username, password)).rejects.toThrow(
        NotFoundException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const userId = 1;
      const updateDto: UpdateProfileDto = {
        email: 'updated@example.com',
        avatar: 'new-avatar.jpg',
      };
      const updatedUser = { ...mockUser, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateProfile(userId, updateDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateDto,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = 999;
      const updateDto: UpdateProfileDto = {
        email: 'updated@example.com',
      };

      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
