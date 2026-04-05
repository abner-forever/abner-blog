import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../entities/user.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'blog',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
});

async function createAdmin() {
  await dataSource.initialize();

  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  const email = process.argv[4] || 'admin@example.com';

  const userRepo = dataSource.getRepository(User);

  // 检查用户是否已存在
  const existingUser = await userRepo.findOne({ where: { username } });

  if (existingUser) {
    console.log(`用户 ${username} 已存在，正在更新为管理员...`);
    await userRepo.update(existingUser.id, { role: UserRole.ADMIN });
    console.log(`✅ 用户 ${username} 已设置为管理员`);
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    await userRepo.save({
      username,
      password: hashedPassword,
      email,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    console.log(`✅ 管理员账号创建成功: ${username} / ${password}`);
  }

  await dataSource.destroy();
}

createAdmin().catch(console.error);
