import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { UsersModule } from '../users.module';
import { UsersService } from '../users.service';
import { User } from '../entities/users.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EVENT } from '@constants';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmConfigService } from '@database/typeorm-config.service';

describe('Users Integration', () => {
  let usersService: UsersService;
  let userRepository: Repository<User>;
  let eventEmitter: EventEmitter2;

  const testUser = {
    email: 'test@example.com',
    password: 'Test123!@#',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1990-01-01',
    location: 'Jakarta',
    timezone: 'Asia/Jakarta',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        EventEmitterModule.forRoot(),
        TypeOrmModule.forRootAsync({
          useClass: TypeOrmConfigService,
          dataSourceFactory: async (options) => {
            const dataSource = await new DataSource(options!).initialize();
            return dataSource;
          },
        }),
        UsersModule,
      ],
    }).compile();

    usersService = moduleRef.get<UsersService>(UsersService);
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  it('should create user and emit event', async () => {
    const eventSpy = jest.spyOn(eventEmitter, 'emit');
    const user = await usersService.create(testUser);

    expect(user).toBeDefined();
    expect(user.id).toBeDefined;
    expect(eventSpy).toHaveBeenCalledWith(
      EVENT.USER_CREATED,
      expect.any(Object),
    );
  });

  it('should update user and emit event', async () => {
    const eventSpy = jest.spyOn(eventEmitter, 'emit');
    const user = await usersService.create(testUser);
    const updateDto: UpdateUserDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      birthDate: '1990-01-01',
      location: 'Singapore',
      timezone: 'Asia/Singapore',
    };

    const updated = await usersService.update(user.id, updateDto);

    expect(updated.firstName).toBe('Jane');
    expect(eventSpy).toHaveBeenCalledWith(
      EVENT.USER_UPDATED,
      expect.any(Object),
    );
  });

  it('should delete user and emit event', async () => {
    const eventSpy = jest.spyOn(eventEmitter, 'emit');
    const user = await usersService.create(testUser);

    await usersService.remove(user.id);
    expect(eventSpy).toHaveBeenCalledWith(
      EVENT.USER_DELETED,
      expect.any(Object),
    );
  });

  it('should allow creating user with email from deleted user', async () => {
    // Create and delete first user
    const user1 = await usersService.create(testUser);
    await usersService.remove(user1.id);

    // Create second user with same email
    const user2 = await usersService.create(testUser);

    expect(user2).toBeDefined();
    expect(user2.email).toBe(testUser.email);
    expect(user2.id).not.toBe(user1.id);
  });

  it('should fail when trying to update non-existent id', async () => {
    const fakeId = '123e4567-e89b-12d3-a456-426614174000';
    const updateDto: UpdateUserDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      birthDate: '1990-01-01',
      location: 'Singapore',
      timezone: 'Asia/Singapore',
    };

    await expect(usersService.update(fakeId, updateDto)).rejects.toThrow();
  });

  it('should fail when trying to remove non-existent id', async () => {
    const fakeId = '123e4567-e89b-12d3-a456-426614174000';

    await expect(usersService.remove(fakeId)).rejects.toThrow();
  });
});
