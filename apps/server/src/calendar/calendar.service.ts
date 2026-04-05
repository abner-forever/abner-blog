import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';
import { CalendarEvent } from '../entities/calendar-event.entity';
import { CreateCalendarEventDto } from './dto/calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/calendar-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private calendarRepository: Repository<CalendarEvent>,
  ) {}

  async create(
    createEventDto: CreateCalendarEventDto,
    userId: number,
  ): Promise<CalendarEvent> {
    const event = this.calendarRepository.create({
      ...createEventDto,
      startDate: new Date(createEventDto.startDate),
      endDate: createEventDto.endDate
        ? new Date(createEventDto.endDate)
        : undefined,
      user: { id: userId },
    });
    return this.calendarRepository.save(event);
  }

  async findAll(
    userId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<CalendarEvent[]> {
    const where: FindOptionsWhere<CalendarEvent> = { user: { id: userId } };

    if (startDate && endDate) {
      where.startDate = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.startDate = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.startDate = LessThanOrEqual(new Date(endDate));
    }

    return this.calendarRepository.find({
      where,
      order: {
        startDate: 'ASC',
      },
    });
  }

  async findOne(id: number, userId: number): Promise<CalendarEvent> {
    const event = await this.calendarRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!event) {
      throw new NotFoundException('日程不存在');
    }

    if (event.user.id !== userId) {
      throw new ForbiddenException('您没有权限访问此日程');
    }

    return event;
  }

  async update(
    id: number,
    updateEventDto: UpdateCalendarEventDto,
    userId: number,
  ): Promise<CalendarEvent> {
    await this.findOne(id, userId);

    const updateData: Partial<CalendarEvent> = {
      ...updateEventDto,
    } as unknown as Partial<CalendarEvent>;
    if (updateEventDto.startDate) {
      updateData.startDate = new Date(updateEventDto.startDate);
    }
    if (updateEventDto.endDate) {
      updateData.endDate = new Date(updateEventDto.endDate);
    }

    await this.calendarRepository.update(id, updateData);
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const event = await this.findOne(id, userId);
    await this.calendarRepository.remove(event);
  }

  async toggleComplete(id: number, userId: number): Promise<CalendarEvent> {
    const event = await this.findOne(id, userId);
    event.completed = !event.completed;
    return this.calendarRepository.save(event);
  }
}
