export type MediaType = 'TV_SERIES' | 'MOVIE';

export type MediaListData = {
  id: string;
  image: string;
  type: string;
};

export type MediaList = {
  id: string;
  title: string;
  data: MediaListData[];
};

export type Episode = {
  id: string;
  episodeTitle: string;
  episodeDescription: string;
  episodeNumber: number;
  duration: number;
  episodeThumbnail: string;
  videoUrl: string;
}

export type Season = {
  seasonName: string;
  episodes: Episode[];
}

export type Media = {
  id: string;
  type: MediaType;
  title: string;
  description: string;
  releaseYear: number;
  ageRestriction: string;
  thumbnail: string;
  trailer: string;
  duration?: number;
  videoUrl?: string;
  seasons?: Season[];
}
