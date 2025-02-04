import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { EVENT, SALT_ROUNDS } from '@constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserDeletedEvent } from './events/user-deleted.event';
import { UserCreatedEvent } from './events/user-created.event';
import { UserUpdatedEvent } from './events/user-updated.event';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(createUserDto.password);

    const user = this.userRepository.create({ ...createUserDto, passwordHash });
    const savedUser = await this.userRepository.save(user);

    this.eventEmitter.emit(
      EVENT.USER_CREATED,
      new UserCreatedEvent(savedUser.id, savedUser),
    );

    return savedUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const oldUser = await this.userRepository.findOne({ where: { id } });
    if (!oldUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = {
      ...oldUser,
      ...updateUserDto,
    };

    const savedUser = await this.userRepository.save(updatedUser);

    this.eventEmitter.emit(
      EVENT.USER_UPDATED,
      new UserUpdatedEvent(id, oldUser, savedUser),
    );

    return savedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.softDelete(user.id);

    this.eventEmitter.emit(EVENT.USER_DELETED, new UserDeletedEvent(id));
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
