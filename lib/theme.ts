export const theme = {
  colors: {
    amber: "#f0a038",
    sage: "#8fb186",
    background: "#faf7f2",
    text: "#2d2d2d",
    card: "#ffffff",
    border: "#e8e0d5",
  },
  domainColors: {
    "Cognitive Development": "#3b82f6", // blue
    "Language & Communication": "#8b5cf6", // purple
    "Social-Emotional": "#ec4899", // pink
    "Fine Motor Skills": "#f97316", // orange
    "Gross Motor Skills": "#22c55e", // green
    "Self-Care & Independence": "#14b8a6", // teal
    "Creative Expression": "#eab308", // yellow
    "Problem Solving": "#3b82f6", // blue (same as cognitive)
  },
};

export function getDomainColor(tag: string): string {
  return theme.domainColors[tag as keyof typeof theme.domainColors] || "#6b7280";
}
