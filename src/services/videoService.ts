import { sql } from '../config/database';
import { parseWixVideoUrl } from '../utils/wixVideoParser';
import type { CampaignVideo, MediaFolder } from '../types/videos';

let isVideosTableInitialized = false;

export async function ensureVideosTable(): Promise<void> {
  if (isVideosTableInitialized) return;

  try {
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

    // Garante que a coluna folder exista mesmo em tabelas pré-existentes
    await sql`
      ALTER TABLE campaign_videos ADD COLUMN IF NOT EXISTS folder VARCHAR(30) NOT NULL DEFAULT 'videos';
    `;

    // Verifica se já existem mídias cadastradas
    const existing = await sql`
      SELECT COUNT(*)::int as count FROM campaign_videos;
    `;

    const count = existing[0]?.count || 0;

    // Se estiver vazia, cria o primeiro vídeo com o exemplo fornecido pelo usuário
    if (count === 0) {
      const defaultRawUrl =
        'wix:video://v1/573bd6_67df09f0e0b143b59010f6cf24140c2b/MESSIAS.mp4#posterUri=573bd6_67df09f0e0b143b59010f6cf24140c2bf001.jpg&posterWidth=1440&posterHeight=2560';
      const parsed = parseWixVideoUrl(defaultRawUrl);

      await sql`
        INSERT INTO campaign_videos (
          id,
          title,
          video_url,
          poster_url,
          raw_wix_url,
          folder,
          is_active,
          display_order,
          download_count
        ) VALUES 
        (
          'vid_demo_1',
          'MESSIAS - Deputado Estadual',
          ${parsed.videoUrl},
          ${parsed.posterUrl || null},
          ${defaultRawUrl},
          'videos',
          true,
          1,
          0
        ),
        (
          'med_audio_demo_1',
          'Jingle Oficial - Pastor Ezequias',
          'https://static.wixstatic.com/mp3/573bd6_0589b064b4cc401b853f4d02f65b6fcb.mp3',
          NULL,
          'https://static.wixstatic.com/mp3/573bd6_0589b064b4cc401b853f4d02f65b6fcb.mp3',
          'musica',
          true,
          1,
          0
        ),
        (
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
    }

    isVideosTableInitialized = true;
  } catch (err) {
    console.warn('Aviso ao inicializar tabela campaign_videos:', err);
  }
}

export async function fetchCampaignVideos(
  onlyActive = true,
  folderFilter?: MediaFolder
): Promise<CampaignVideo[]> {
  try {
    await ensureVideosTable();

    let rows;
    if (onlyActive) {
      if (folderFilter) {
        rows = await sql`
          SELECT 
            id,
            title,
            video_url as "videoUrl",
            poster_url as "posterUrl",
            raw_wix_url as "rawWixUrl",
            folder,
            is_active as "isActive",
            display_order as "displayOrder",
            download_count as "downloadCount",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM campaign_videos
          WHERE is_active = true AND folder = ${folderFilter}
          ORDER BY created_at DESC, id DESC;
        `;
      } else {
        rows = await sql`
          SELECT 
            id,
            title,
            video_url as "videoUrl",
            poster_url as "posterUrl",
            raw_wix_url as "rawWixUrl",
            folder,
            is_active as "isActive",
            display_order as "displayOrder",
            download_count as "downloadCount",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM campaign_videos
          WHERE is_active = true
          ORDER BY created_at DESC, id DESC;
        `;
      }
    } else {
      if (folderFilter) {
        rows = await sql`
          SELECT 
            id,
            title,
            video_url as "videoUrl",
            poster_url as "posterUrl",
            raw_wix_url as "rawWixUrl",
            folder,
            is_active as "isActive",
            display_order as "displayOrder",
            download_count as "downloadCount",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM campaign_videos
          WHERE folder = ${folderFilter}
          ORDER BY created_at DESC, id DESC;
        `;
      } else {
        rows = await sql`
          SELECT 
            id,
            title,
            video_url as "videoUrl",
            poster_url as "posterUrl",
            raw_wix_url as "rawWixUrl",
            folder,
            is_active as "isActive",
            display_order as "displayOrder",
            download_count as "downloadCount",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM campaign_videos
          ORDER BY created_at DESC, id DESC;
        `;
      }
    }

    return (rows as unknown as CampaignVideo[]) || [];
  } catch (err) {
    console.error('Erro ao buscar mídias da campanha:', err);
    return [];
  }
}

export async function saveCampaignVideo(
  video: Partial<CampaignVideo> & { id: string; title: string; videoUrl: string }
): Promise<boolean> {
  try {
    await ensureVideosTable();

    // Garante que URLs do Wix sejam devidamente parseadas se necessário
    const parsed = parseWixVideoUrl(video.rawWixUrl || video.videoUrl);
    const finalVideoUrl = video.videoUrl || parsed.videoUrl;
    const finalPosterUrl = video.posterUrl || parsed.posterUrl || null;
    const rawUrl = video.rawWixUrl || video.videoUrl;
    const folder = video.folder || 'videos';
    const isActive = video.isActive ?? true;
    const displayOrder = Number(video.displayOrder ?? 0);

    await sql`
      INSERT INTO campaign_videos (
        id,
        title,
        video_url,
        poster_url,
        raw_wix_url,
        folder,
        is_active,
        display_order,
        download_count,
        updated_at
      ) VALUES (
        ${video.id},
        ${video.title},
        ${finalVideoUrl},
        ${finalPosterUrl},
        ${rawUrl},
        ${folder},
        ${isActive},
        ${displayOrder},
        ${video.downloadCount ?? 0},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        video_url = EXCLUDED.video_url,
        poster_url = EXCLUDED.poster_url,
        raw_wix_url = EXCLUDED.raw_wix_url,
        folder = EXCLUDED.folder,
        is_active = EXCLUDED.is_active,
        display_order = EXCLUDED.display_order,
        updated_at = CURRENT_TIMESTAMP;
    `;

    return true;
  } catch (err) {
    console.error('Erro ao salvar mídia da campanha:', err);
    return false;
  }
}

export async function deleteCampaignVideo(id: string): Promise<boolean> {
  try {
    await ensureVideosTable();
    await sql`
      DELETE FROM campaign_videos WHERE id = ${id};
    `;
    return true;
  } catch (err) {
    console.error('Erro ao excluir mídia da campanha:', err);
    return false;
  }
}

export async function incrementVideoDownloadCount(id: string): Promise<void> {
  try {
    await ensureVideosTable();
    await sql`
      UPDATE campaign_videos
      SET download_count = download_count + 1
      WHERE id = ${id};
    `;
  } catch (err) {
    console.warn('Erro ao incrementar contagem de download:', err);
  }
}
