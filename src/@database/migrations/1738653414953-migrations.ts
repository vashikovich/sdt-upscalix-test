import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1738653414953 implements MigrationInterface {
    name = 'Migrations1738653414953'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "birth_date" date NOT NULL, "location" character varying NOT NULL, "timezone" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_EMAIL" ON "user" ("email") WHERE (deleted_at IS NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_EMAIL"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
