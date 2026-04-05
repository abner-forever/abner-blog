import { DataSource } from 'typeorm';
import { Topic } from '../entities/topic.entity';

const defaultTopics = [
  {
    name: '前端开发',
    description: 'HTML、CSS、JavaScript、React、Vue 等前端技术讨论',
    icon: '💻',
  },
  {
    name: '后端开发',
    description: 'Node.js、Java、Python、Go 等后端技术讨论',
    icon: '⚙️',
  },
  {
    name: '移动开发',
    description: 'iOS、Android、Flutter、React Native 等移动开发',
    icon: '📱',
  },
  {
    name: '数据库',
    description: 'MySQL、PostgreSQL、MongoDB、Redis 等数据库技术',
    icon: '🗄️',
  },
  {
    name: '职场生活',
    description: '职场经验、面试技巧、工作感悟',
    icon: '💼',
  },
  {
    name: '开源项目',
    description: '开源项目分享、开源贡献经验',
    icon: '🌟',
  },
  {
    name: '技术问答',
    description: '技术问题求助与解答',
    icon: '❓',
  },
  {
    name: '学习资源',
    description: '优质学习资源推荐',
    icon: '📚',
  },
];

async function initTopics() {
  const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'blog',
    entities: [Topic],
    synchronize: false,
  });

  try {
    await AppDataSource.initialize();
    console.log('数据库连接成功');

    const topicRepository = AppDataSource.getRepository(Topic);

    for (const topicData of defaultTopics) {
      // 检查话题是否已存在
      const existingTopic = await topicRepository.findOne({
        where: { name: topicData.name },
      });

      if (!existingTopic) {
        const topic = topicRepository.create(topicData);
        await topicRepository.save(topic);
        console.log(`✓ 创建话题: ${topicData.name}`);
      } else {
        console.log(`- 话题已存在: ${topicData.name}`);
      }
    }

    console.log('\n话题初始化完成！');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

void initTopics();
