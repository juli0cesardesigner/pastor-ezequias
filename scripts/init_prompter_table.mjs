import { neon } from '@neondatabase/serverless';

const NEON_DATABASE_URL =
  'postgresql://neondb_owner:npg_f2KbGt5UxABI@ep-red-mode-ac5rnbo0.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(NEON_DATABASE_URL);

async function run() {
  console.log('Verificando/Criando tabela teleprompter_scripts...');
  await sql`
    CREATE TABLE IF NOT EXISTS teleprompter_scripts (
      id BIGSERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(80) NOT NULL DEFAULT 'Geral',
      is_pinned BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('Sucesso! Tabela teleprompter_scripts pronta.');

  const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public';`;
  console.log('Tabelas no Neon DB:', res.map(r => r.table_name));
}

run().catch(console.error);
