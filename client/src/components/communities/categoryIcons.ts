// Shared community category → crafted ss icon map (zero emoji).
import { RunGlyph, Target, Leaf, Heart, CommunityOutline, Spark } from '../ss/icons';

export const CATEGORY_ICONS: Record<string, (p: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  run_club: RunGlyph,
  training: Target,
  nutrition: Leaf,
  wellness: Heart,
  social: CommunityOutline,
  brand: Spark,
  custom: Spark,
};

export function categoryIcon(category: string) {
  return CATEGORY_ICONS[category] || Spark;
}
