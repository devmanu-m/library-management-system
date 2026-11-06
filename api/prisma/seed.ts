import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genreNames = ['Fiction', 'Science', 'History', 'Technology'];

// [title, author, year, genre]
const books: [string, string, number, string][] = [
  ['Things Fall Apart', 'Chinua Achebe', 1958, 'Fiction'],
  ['Half of a Yellow Sun', 'Chimamanda Ngozi Adichie', 2006, 'Fiction'],
  ['Weep Not, Child', "Ngũgĩ wa Thiong'o", 1964, 'Fiction'],
  ['The Great Gatsby', 'F. Scott Fitzgerald', 1925, 'Fiction'],
  ['A Brief History of Time', 'Stephen Hawking', 1988, 'Science'],
  ['The Selfish Gene', 'Richard Dawkins', 1976, 'Science'],
  ['Cosmos', 'Carl Sagan', 1980, 'Science'],
  ['Silent Spring', 'Rachel Carson', 1962, 'Science'],
  ['Sapiens', 'Yuval Noah Harari', 2011, 'History'],
  ['Guns, Germs, and Steel', 'Jared Diamond', 1997, 'History'],
  ['The Rise and Fall of the Third Reich', 'William L. Shirer', 1960, 'History'],
  ["A People's History of the United States", 'Howard Zinn', 1980, 'History'],
  ['Clean Code', 'Robert C. Martin', 2008, 'Technology'],
  ['The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 1999, 'Technology'],
  ['Designing Data-Intensive Applications', 'Martin Kleppmann', 2017, 'Technology'],
  ['Eloquent JavaScript', 'Marijn Haverbeke', 2011, 'Technology'],
];

async function main() {
  // Clear old data (children first) so the seed can be run again safely
  await prisma.review.deleteMany();
  await prisma.book.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.user.deleteMany();

  await prisma.genre.createMany({
    data: genreNames.map((name) => ({ name })),
  });

  const genres = await prisma.genre.findMany();
  const genreIdByName: Record<string, number> = {};
  for (const genre of genres) {
    genreIdByName[genre.name] = genre.id;
  }

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

  await prisma.user.createMany({
    data: [
      { email: 'librarian@example.com', name: 'Lydia Librarian', role: 'LIBRARIAN' },
      { email: 'patron@example.com', name: 'Peter Patron', role: 'PATRON' },
    ],
  });

  const genreCount = await prisma.genre.count();
  const bookCount = await prisma.book.count();
  console.log(`Seeded ${genreCount} genres and ${bookCount} books.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });