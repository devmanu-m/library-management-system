# Library Management System

The data layer for a library's book catalog, built with NestJS, Prisma and PostgreSQL (hosted on Neon).

## Where the required files are

- [Prisma schema](api/prisma/schema.prisma): the `Role` enum (PATRON, LIBRARIAN), and the `User`, `Genre`, `Book` and `Review` models. `Book` has a `genreId` foreign key with `@relation`.
- [Seed script](api/prisma/seed.ts): inserts 4 genres and 16 books spread across them.
- [Migrations](api/prisma/migrations): the SQL that created the tables in the hosted database.
- [Prisma service](api/src/prisma/prisma.service.ts): extends `PrismaClient`, implements `OnModuleInit` and calls `this.$connect()` in `onModuleInit()`.
- [Environment example](api/.env.example): a `DATABASE_URL` placeholder with no real credentials.

## Setup

1. Go into the API folder: `cd api`
2. Install the dependencies: `npm install`
3. Copy `.env.example` to `.env` and put your PostgreSQL connection string in `DATABASE_URL`.
4. Create the tables: `npx prisma migrate dev`
5. Insert the sample data: `npx prisma db seed`
6. Optional: look at the data with `npx prisma studio`

## Schema Decisions

**Book references Genre instead of embedding it.** Each `Book` stores a `genreId` foreign key that points to one row in the `Genre` table, instead of carrying a copy of the genre inside the book.

- **One source of truth.** A genre's name lives in exactly one row. If "Technology" is renamed, one update fixes every book. If the genre were embedded, the same text would be repeated on every book, and a missed copy would leave inconsistent data.
- **Genres exist on their own.** A genre can be created, listed and kept even when it has no books yet. An embedded value cannot exist without a book.
- **Integrity comes from the database.** The foreign key means a book cannot point to a genre that does not exist, and a genre that still has books cannot be deleted by accident.
- **Simple, fast queries.** "All books in a genre" is a filter on `genreId`, and the `@@index([genreId])` keeps it fast as the catalog grows.
- **It matches the real shape of the data.** One genre has many books and each book has one genre, which is a one-to-many relationship.

Other decisions:

- `Role` is an enum, so the database rejects any role other than `PATRON` or `LIBRARIAN`.
- `User.email` and `Book.isbn` are `@unique`, so duplicates are impossible.
- `Review` links a book and a user, and `@@unique([bookId, userId])` allows one review per user per book.

## Prisma vs a document database

In a document database such as MongoDB, my first instinct would be to put the genre inside each book document, because it reads well in one query. In Prisma I had to define the relationship first, and the schema, the foreign key and the migration made me think about how the data connects before I wrote any of it. Seeding also felt different: I had to create the genres first so each book had a real `genreId` to point to.