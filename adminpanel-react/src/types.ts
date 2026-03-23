export interface TimelineEvent {
  id: number;
  year: string;
  title: string;
  subtitle: string | null;
  scrubber_label: string | null;
  infobox_title: string | null;
  infobox_subtitle: string | null;
  icon_name: string | null;
  description: string | null;
  historical_context: string | null;
  icon: string | null;
  gradient: string | null;
  museum_gradient: string | null;
  stage: string | null;
  use_detailed_modal: boolean;
  has_key_moments: boolean;
  has_puzzle: boolean;
  puzzle_image_url: string | null;
  game_type: "none" | "puzzle" | "memory" | "harvest" | "quiz";
  category: "museum" | "landbouw" | "maatschappelijk";
  sort_order: number;
  image_url: string | null;
  video_url: string | null;
  gallery_images: string[];
  model_3d_url: string | null;
  importance_level: string | null;
  fun_fact: string | null;
  related_events: number[];
  location: string | null;
  is_active: boolean;
  has_video: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventSection {
  id?: number;
  event_id?: number;
  section_title: string;
  section_content: string;
  section_order: number;
}

export interface KeyMoment {
  id?: number;
  event_id?: number;
  year: number;
  title: string;
  short_description: string;
  display_order: number;
}

export interface QuizQuestion {
  id?: number;
  event_id?: number;
  question: string;
  image_url: string;
  correct_answer: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string | null;
  difficulty: "easy" | "hard";
}

export type CategoryFilter = "all" | "museum" | "landbouw" | "maatschappelijk";
