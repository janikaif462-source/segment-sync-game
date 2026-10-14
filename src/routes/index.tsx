import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/game/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pick Puzzle Solve — 300 Picture Jigsaw Levels" },
      { name: "description", content: "Drag and drop picture pieces to solve 300 puzzles from Easy to Expert. Free, no sign-up, works on phone and PC." },
      { property: "og:title", content: "Pick Puzzle Solve — 300 Picture Jigsaw Levels" },
      { property: "og:description", content: "Drag, drop and solve 300 picture puzzles on phone or PC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});
