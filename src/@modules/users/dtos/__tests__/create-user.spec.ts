import { validate } from 'class-validator';
import { CreateUserDto } from '../create-user.dto';
import { plainToInstance } from 'class-transformer';

describe('CreateUserDto', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'Test123!@#',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1990-01-01',
    location: 'Jakarta',
    timezone: 'Asia/Jakarta',
  };

  it('should validate valid user data', async () => {
    const dto = plainToInstance(CreateUserDto, validUserData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate email format', async () => {
    const dto = plainToInstance(CreateUserDto, {
      ...validUserData,
      email: 'invalid-email',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should validate password complexity', async () => {
    const dto = plainToInstance(CreateUserDto, {
      ...validUserData,
      password: 'simple',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('should validate timezone', async () => {
    const dto = plainToInstance(CreateUserDto, {
      ...validUserData,
      timezone: 'Invalid/Timezone',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isValidTimezone');
  });

  it('should require all fields', async () => {
    const dto = plainToInstance(CreateUserDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(7);
  });
});
