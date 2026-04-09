import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from './services/mail.service';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { TencentCaptchaService } from './services/tencent-captcha.service';

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

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '30d';
      return undefined;
    }),
  };

  const mockMailService = {
    sendVerificationCode: jest.fn(),
    sendResetPasswordLink: jest.fn(),
  };

  const mockRedisService = {
    storeRefreshSession: jest.fn(),
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
        { provide: ConfigService, useValue: mockConfigService },
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

  describe('generateTokenPair', () => {
    it('should return access, refresh tokens and user info', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('mock.access.jwt')
        .mockReturnValueOnce('mock.refresh.jwt');

      const result = await service.generateTokenPair(mockUser);

      expect(mockJwtService.sign).toHaveBeenNthCalledWith(1, {
        sub: mockUser.id,
        username: mockUser.username,
        typ: 'access',
      });
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          sub: mockUser.id,
          username: mockUser.username,
          typ: 'refresh',
          jti: expect.any(String) as string,
        }),
        { expiresIn: '30d' },
      );
      expect(result.access_token).toBe('mock.access.jwt');
      expect(result.refresh_token).toBe('mock.refresh.jwt');
      expect(result.user).toMatchObject({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      });
      expect('password' in (result.user as object)).toBeFalsy();
      expect(mockRedisService.storeRefreshSession).toHaveBeenCalled();
    });
  });
});
