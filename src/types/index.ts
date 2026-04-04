export interface Module {
  module_id: number;
  section: string;
  module: string;
  section_title: string;
  unit_title: string;
  module_title: string;
  module_order: number | null;
  flashcard_count: number;
  mcq_count: number;
}

export interface Flashcard {
  id: number;
  flashcard_number: number;
  module_id: number;
  body: string;
  explanation: string | null;
}

export interface MCQ {
  id: number;
  question_number: number;
  module_id: number;
  body: string;
  correct_option_number: number;
  option_text1: string;
  option_text2: string;
  option_text3: string;
  option_text4: string;
  explanation1: string | null;
  explanation2: string | null;
  explanation3: string | null;
  explanation4: string | null;
  skill_level: string | null;
}

export type StudyCard =
  | { type: "flashcard"; data: Flashcard }
  | { type: "mcq"; data: MCQ };
