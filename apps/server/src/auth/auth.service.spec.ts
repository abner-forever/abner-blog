import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { TencentCaptchaService } from './tencent-captcha.service';

describe('AuthService', () => {
  let service: AuthService;

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
    role: UserRole.USER,
    resume: null,
  };

  const mockUsersService = {
    validateUser: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockMailService = {
    sendVerificationCode: jest.fn(),
    sendResetPasswordLink: jest.fn(),
  };

  const mockRedisService = {
    storeToken: jest.fn(),
  };

  const mockTencentCaptchaService = {
    verifyTicket: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: TencentCaptchaService,
          useValue: mockTencentCaptchaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when validation succeeds', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'password123';
      mockUsersService.validateUser.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(username, password);

      // Assert
      expect(mockUsersService.validateUser).toHaveBeenCalledWith(
        username,
        password,
      );
      expect(result).toBeDefined();
      expect(result.username).toBe(mockUser.username);
      expect(result.email).toBe(mockUser.email);
    });

    it('should return null when validation fails', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'wrongpassword';
      mockUsersService.validateUser.mockRejectedValue(
        new Error('Invalid credentials'),
      );

      // Act
      const result = await service.validateUser(username, password);

      // Assert
      expect(mockUsersService.validateUser).toHaveBeenCalledWith(
        username,
        password,
      );
      expect(result).toBeNull();
    });

    it('should return null when user service returns null', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'password123';
      mockUsersService.validateUser.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(username, password);

      // Assert
      expect(mockUsersService.validateUser).toHaveBeenCalledWith(
        username,
        password,
      );
      expect(result).toBeNull();
    });
  });

  describe('generateToken', () => {
    it('should return access token and user info', async () => {
      const mockToken = 'mock.jwt.token';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.generateToken(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.id,
      });
      expect(result.access_token).toBe(mockToken);
      expect(result.user).toMatchObject({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      });
      expect('password' in (result.user as object)).toBeFalsy();
    });
  });
});
