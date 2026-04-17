export interface Video {
  src: string;
  title: string;
  poster?: string;
  youtubeUrl?: string;
}

const videos: Video[] = [
  {
    src: "https://archive.org/download/two-of-my-side-projects-plyght/Cap%202026-02-14%20at%2002.54.45.mp4",
    title: "Angel & Spine",
    poster: "https://img.youtube.com/vi/ifzQdj2RNPA/maxresdefault.jpg",
    youtubeUrl: "https://www.youtube.com/watch?v=ifzQdj2RNPA",
  },
];

export function getAllVideos(): Video[] {
  return videos;
}
