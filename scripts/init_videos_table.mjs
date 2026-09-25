import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_f2KbGt5UxABI@ep-red-mode-ac5rnbo0.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function test() {
  await sql`
    CREATE TABLE IF NOT EXISTS campaign_videos (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      video_url TEXT NOT NULL,
      poster_url TEXT,
      raw_wix_url TEXT,
      folder VARCHAR(30) NOT NULL DEFAULT 'videos',
      is_active BOOLEAN NOT NULL DEFAULT true,
      display_order INT NOT NULL DEFAULT 0,
      download_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    ALTER TABLE campaign_videos ADD COLUMN IF NOT EXISTS folder VARCHAR(30) NOT NULL DEFAULT 'videos';
  `;

  const rows = await sql`SELECT COUNT(*)::int as count FROM campaign_videos;`;
  console.log('Current video count:', rows[0].count);
  if (rows[0].count === 0) {
    const raw = 'wix:video://v1/573bd6_67df09f0e0b143b59010f6cf24140c2b/MESSIAS.mp4#posterUri=573bd6_67df09f0e0b143b59010f6cf24140c2bf001.jpg&posterWidth=1440&posterHeight=2560';
    await sql`
      INSERT INTO campaign_videos (id, title, video_url, poster_url, raw_wix_url, is_active, display_order, download_count)
      VALUES (
        'vid_demo_1',
        'MESSIAS - Deputado Estadual',
        'https://video.wixstatic.com/video/573bd6_67df09f0e0b143b59010f6cf24140c2b/1080p/mp4/file.mp4',
        'https://static.wixstatic.com/media/573bd6_67df09f0e0b143b59010f6cf24140c2bf001.jpg',
        ${raw},
        true,
        1,
        0
      ) ON CONFLICT (id) DO NOTHING;
    `;
    console.log('Seeded demo video!');
  }

  // Insere exemplo de Áudio fornecido pelo usuário
  await sql`
    INSERT INTO campaign_videos (id, title, video_url, poster_url, raw_wix_url, folder, is_active, display_order, download_count)
    VALUES (
      'med_audio_demo_1',
      'Jingle Oficial - Pastor Ezequias',
      'https://static.wixstatic.com/mp3/573bd6_0589b064b4cc401b853f4d02f65b6fcb.mp3',
      NULL,
      'https://static.wixstatic.com/mp3/573bd6_0589b064b4cc401b853f4d02f65b6fcb.mp3',
      'musica',
      true,
      1,
      0
    ) ON CONFLICT (id) DO NOTHING;
  `;

  // Insere exemplo de Imagem fornecido pelo usuário
  await sql`
    INSERT INTO campaign_videos (id, title, video_url, poster_url, raw_wix_url, folder, is_active, display_order, download_count)
    VALUES (
      'med_img_demo_1',
      'Foto Oficial de Campanha',
      'https://static.wixstatic.com/media/573bd6_3f276d58c67a4e2e916d741c9157e8de~mv2.jpg',
      'https://static.wixstatic.com/media/573bd6_3f276d58c67a4e2e916d741c9157e8de~mv2.jpg',
      'https://static.wixstatic.com/media/573bd6_3f276d58c67a4e2e916d741c9157e8de~mv2.jpg',
      'imagens',
      true,
      1,
      0
    ) ON CONFLICT (id) DO NOTHING;
  `;

  const vids = await sql`SELECT id, title, folder, video_url FROM campaign_videos ORDER BY created_at DESC;`;
  console.log('Media in DB:', vids);
}

test().catch(console.error);
