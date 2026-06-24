const COVERS = [
  "from-rose-400 via-orange-300 to-amber-200",
  "from-violet-400 via-fuchsia-300 to-pink-200",
  "from-sky-400 via-cyan-300 to-teal-200",
  "from-emerald-400 via-lime-300 to-yellow-200",
  "from-indigo-400 via-blue-300 to-sky-200",
  "from-orange-400 via-red-300 to-rose-200",
] as const;

export function getGroupCoverClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COVERS[Math.abs(hash) % COVERS.length];
}

export function formatGroupDate(date: string): { day: string; month: string } {
  const d = new Date(date);
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleString("en", { month: "short" }),
  };
}
