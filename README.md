# Library Management System

The data layer for a library's book catalog, built with NestJS, Prisma and PostgreSQL (hosted on Neon). The required files and their code are shown below, and each one is also in the repository at the path given.

## api/prisma/schema.prisma

Defines the `Role` enum, `User`, `Genre`, `Book` (with a `genreId` foreign key and `@relation`) and `Review`.

    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    enum Role {
      PATRON
      LIBRARIAN
    }

    model User {
      id        Int      @id @default(autoincrement())
      email     String   @unique
      name      String
      role      Role     @default(PATRON)
      createdAt DateTime @default(now())
      reviews   Review[]
    }

    model Genre {
      id    Int    @id @default(autoincrement())
      name  String @unique
      books Book[]
    }

    model Book {
      id              Int      @id @default(autoincrement())
      title           String
      author          String
      isbn            String   @unique
      publishedYear   Int
      copiesAvailable Int      @default(1)
      genreId         Int
      genre           Genre    @relation(fields: [genreId], references: [id])
      reviews         Review[]
      createdAt       DateTime @default(now())

      @@index([genreId])
    }

    model Review {
      id        Int      @id @default(autoincrement())
      bookId    Int
      userId    Int
      rating    Int
      comment   String?
      createdAt DateTime @default(now())
      book      Book     @relation(fields: [bookId], references: [id])
      user      User     @relation(fields: [userId], references: [id])

      @@unique([bookId, userId])
    }

## api/src/prisma/prisma.service.ts

Extends `PrismaClient`, implements `OnModuleInit` and calls `this.$connect()` inside `onModuleInit()`.

    import { Injectable, OnModuleInit } from '@nestjs/common';
    import { PrismaClient } from '@prisma/client';

    @Injectable()
    export class PrismaService extends PrismaClient implements OnModuleInit {
      async onModuleInit() {
        await this.$connect();
      }
    }

## api/.env.example

A placeholder only. The real `.env` is never committed.

    DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

## Schema Decisions

**Book references Genre instead of embedding it.** Each `Book` stores a `genreId` foreign key that points to one row in the `Genre` table, instead of carrying a copy of the genre inside the book.

- **One source of truth.** A genre's name lives in one row, so renaming "Technology" is one update. Embedded copies could drift apart.
- **Genres exist on their own.** A genre can be created and kept even when it has no books.
- **Integrity from the database.** The foreign key stops a book pointing to a genre that does not exist.
- **Fast queries.** "All books in a genre" filters on `genreId`, and `@@index([genreId])` keeps it fast.

Other decisions: `Role` is an enum so only `PATRON` or `LIBRARIAN` is allowed; `User.email` and `Book.isbn` are `@unique`; `@@unique([bookId, userId])` allows one review per user per book.

## api/prisma/seed.ts

Inserts 4 genres (Fiction, Science, History, Technology), 16 books spread across them (4 per genre), and 2 users. The core of the script:

    await prisma.genre.createMany({
      data: genreNames.map((name) => ({ name })),
    });

    await prisma.book.createMany({
      data: books.map(([title, author, publishedYear, genre], index) => ({
        title,
        author,
        publishedYear,
        isbn: `978-0-000-${String(index + 1).padStart(4, '0')}-0`,
        copiesAvailable: 3,
        genreId: genreIdByName[genre],
      })),
    });

## Setup

1. `cd api` then `npm install`
2. Copy `.env.example` to `.env` and put your PostgreSQL connection string in `DATABASE_URL`.
3. `npx prisma migrate dev` creates the tables (the SQL is in `api/prisma/migrations`).
4. `npx prisma db seed` inserts the sample data.

## Prisma vs a document database

In a document database such as MongoDB, my first instinct would be to put the genre inside each book document. In Prisma I had to define the relationship first, and the schema, foreign key and migration made me think about how the data connects before I wrote any of it. Seeding also felt different, because I had to create the genres first so each book had a real `genreId`.