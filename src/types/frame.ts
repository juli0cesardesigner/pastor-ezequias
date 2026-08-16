export interface FrameOption {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  src: string;
  thumbnail: string;
  accentColor?: string;
  isPopular?: boolean;
}

export interface CampaignInfo {
  candidateName: string;
  office: string;
  slogan: string;
  number?: string;
  hashtag: string;
  shareMessage: string;
  legalNotice: string;
  instagramUrl?: string;
  whatsappGroupUrl?: string;
}
