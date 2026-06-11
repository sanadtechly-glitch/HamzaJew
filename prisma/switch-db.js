const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target || (target !== 'sqlite' && target !== 'postgres' && target !== 'postgresql')) {
  console.error('Usage: node switch-db.js [sqlite|postgres]');
  process.exit(1);
}

const schemaPath = path.join(__dirname, 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error(`Error: schema.prisma not found at ${schemaPath}`);
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, 'utf8');

const sqliteBlock = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`;

const postgresBlock = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;

const currentBlockRegex = /datasource\s+db\s*\{[\s\S]*?\}/;

if (!currentBlockRegex.test(content)) {
  console.error('Error: Could not locate datasource db block in schema.prisma');
  process.exit(1);
}

const targetBlock = (target === 'sqlite') ? sqliteBlock : postgresBlock;
content = content.replace(currentBlockRegex, targetBlock);

fs.writeFileSync(schemaPath, content, 'utf8');
console.log(`✓ Successfully switched database provider in schema.prisma to: ${target === 'sqlite' ? 'SQLite' : 'PostgreSQL'}`);
