import { User } from '../entities/users.entity';

export class UserDeletedEvent {
  constructor(
    public readonly id: string,
    public readonly user: User,
  ) {}
}
