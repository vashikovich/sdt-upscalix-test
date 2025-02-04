import { validate } from 'class-validator';
import { UpdateUserDto } from '../update-user.dto';
import { plainToInstance } from 'class-transformer';

describe('UpdateUserDto', () => {
  const validUpdateData = {
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1990-01-01',
    location: 'Jakarta',
    timezone: 'Asia/Jakarta',
  };

  it('should validate valid data', async () => {
    const dto = plainToInstance(UpdateUserDto, validUpdateData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should not allow partial updates', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      firstName: 'John',
      lastName: 'Doe',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(3); // missing birthDate, location, timezone
    expect(errors.map((e) => e.property)).toEqual(
      expect.arrayContaining(['birthDate', 'location', 'timezone']),
    );
  });

  it('should validate timezone', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      ...validUpdateData,
      timezone: 'Invalid/Timezone',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isValidTimezone');
  });
});
