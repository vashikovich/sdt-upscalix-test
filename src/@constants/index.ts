export enum NODE_ENV {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production',
}

export const SALT_ROUNDS = 12;

export enum EVENT {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
}

export enum QUEUE {
  EMAIL = 'email',
  BIRTHDAY_CRM = 'birthday-crm',
}

export enum JOB {
  SEND_EMAIL = 'send-email',
  BIRTHDAY_CRM = 'birthday-crm',
}

export enum EMAIL_TEMPLATE {
  HAPPY_BIRTHDAY_CRM = 'happy-birthday-crm',
}
