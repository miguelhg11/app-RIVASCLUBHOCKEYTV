import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

function getFiles(dir, suffix) {
  const files = [];
  function walk(current) {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const st = statSync(full);
      if (st.isDirectory() && entry !== "node_modules") {
        walk(full);
      } else if (st.isFile() && entry.endsWith(suffix)) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

const base = "C:/Users/migue/Documents/--PROYECTOS IA--/WEB PROGRAMA DIRECTOS RIVAS TV/rivas_youtube_live_handoff";
const files = getFiles(base, ".tsx");

const replacers = [
  // Page containers - only target outermost containers
  {
    from: /<main className="mx-auto min-h-screen w-full max-w-[\w-]+ px-4 py-[\d]+"/g,
    to: '<div className="space-y-6"',
  },
  {
    from: /<main className="mx-auto min-h-screen w-full max-w-[\w-]+ px-4 py-8 space-y-[\d]+"/g,
    to: '<div className="space-y-6"',
  },
  {
    from: /<\/main>/g,
    to: "</div>",
  },
  // Cards & panels
  {
    from: /rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg/g,
    to: "glass-panel rounded-xl p-5",
  },
  {
    from: /rounded border border-slate-700 bg-slate-900 p-4/g,
    to: "glass-panel rounded-xl p-5",
  },
  {
    from: /rounded border border-slate-700 bg-slate-950 px-3 py-2/g,
    to: "glass-card rounded-lg px-4 py-3",
  },
  {
    from: /rounded border border-slate-800\/80 bg-slate-950\/60 p-4/g,
    to: "glass-card rounded-xl p-4",
  },
  {
    from: /rounded border border-slate-800 bg-slate-950 px-3 py-3/g,
    to: "glass-input rounded-lg px-3 py-3",
  },
  {
    from: /rounded border border-slate-700 bg-slate-950 px-3 py-3/g,
    to: "glass-input rounded-lg px-3 py-3",
  },
  {
    from: /rounded border border-slate-700 bg-slate-950 px-3 py-2/g,
    to: "glass-input rounded-lg px-3 py-2",
  },
  {
    from: /className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-3/g,
    to: 'className="glass-input w-full rounded-lg px-3 py-3',
  },
  {
    from: /className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2/g,
    to: 'className="glass-input w-full rounded-lg px-3 py-2',
  },
  // Buttons primary
  {
    from: /rounded bg-cyan-500 px-4 py-2 font-medium text-slate-950/g,
    to: "btn-primary rounded-lg px-4 py-2 text-xs",
  },
  {
    from: /rounded bg-cyan-500 px-4 py-3 font-medium text-slate-950/g,
    to: "btn-primary rounded-lg px-4 py-3 text-sm",
  },
  {
    from: /className="w-full rounded bg-cyan-500 px-4 py-3 font-medium text-slate-950/g,
    to: 'className="btn-primary w-full rounded-lg px-4 py-3 text-sm',
  },
  {
    from: /rounded bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950/g,
    to: "btn-primary rounded-lg px-4 py-2 text-xs",
  },
  {
    from: /rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950/g,
    to: "btn-primary rounded-lg px-3 py-2 text-xs",
  },
  // Buttons ghost / secondary
  {
    from: /rounded border border-slate-600 px-3 py-2 text-sm/g,
    to: "btn-ghost rounded-lg px-3 py-2 text-xs",
  },
  {
    from: /rounded border border-slate-600 px-3 py-1 text-sm/g,
    to: "btn-ghost rounded-lg px-3 py-1 text-xs",
  },
  {
    from: /rounded border border-slate-700 px-3 py-2 text-sm/g,
    to: "btn-ghost rounded-lg px-3 py-2 text-xs",
  },
  {
    from: /rounded border border-slate-600 px-3 py-1 text-xs/g,
    to: "btn-ghost rounded-md px-3 py-1 text-[10px]",
  },
  // Danger buttons
  {
    from: /rounded border border-rose-600 px-2 py-1 text-rose-300/g,
    to: "rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-1.5 text-xs text-accent-red hover:bg-accent-red/20",
  },
  {
    from: /rounded border border-rose-700 px-2 py-1 text-xs text-rose-200/g,
    to: "rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-1.5 text-[10px] text-accent-red hover:bg-accent-red/20",
  },
  // Headings
  {
    from: /className="text-xl font-semibold"/g,
    to: 'className="font-display text-2xl font-bold tracking-wide text-white"',
  },
  {
    from: /className="text-sm font-semibold"/g,
    to: 'className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase"',
  },
  {
    from: /className="text-2xl font-semibold"/g,
    to: 'className="font-display text-2xl font-bold tracking-wide text-white"',
  },
  {
    from: /className="text-2xl font-black text-slate-100 tracking-tight"/g,
    to: 'className="font-display text-2xl font-bold tracking-wide text-white"',
  },
  {
    from: /className="text-base font-bold text-slate-100"/g,
    to: 'className="font-display text-base font-semibold tracking-wide text-white"',
  },
  // Text colors
  {
    from: /text-slate-100/g,
    to: "text-white",
  },
  {
    from: /text-slate-200/g,
    to: "text-white",
  },
  {
    from: /text-slate-300/g,
    to: "text-text-muted",
  },
  {
    from: /text-slate-400/g,
    to: "text-text-muted",
  },
  {
    from: /text-slate-500/g,
    to: "text-text-muted/70",
  },
  {
    from: /text-slate-600/g,
    to: "text-text-muted/50",
  },
  // Accent colors
  {
    from: /text-cyan-300/g,
    to: "text-accent-cyan",
  },
  {
    from: /text-cyan-400/g,
    to: "text-accent-cyan",
  },
  {
    from: /border-cyan-500/g,
    to: "border-accent-cyan",
  },
  {
    from: /bg-cyan-500\/10/g,
    to: "bg-accent-cyan/10",
  },
  {
    from: /bg-cyan-500\/20/g,
    to: "bg-accent-cyan/10",
  },
  {
    from: /bg-cyan-950\/20/g,
    to: "bg-accent-cyan/10",
  },
  {
    from: /border-cyan-500\/20/g,
    to: "border-accent-cyan/20",
  },
  {
    from: /border-cyan-500\/25/g,
    to: "border-accent-cyan/20",
  },
  {
    from: /border-cyan-500\/35/g,
    to: "border-accent-cyan/30",
  },
  {
    from: /border-cyan-700\/60/g,
    to: "border-accent-cyan/30",
  },
  {
    from: /text-rose-300/g,
    to: "text-accent-red",
  },
  {
    from: /border-rose-600/g,
    to: "border-accent-red",
  },
  {
    from: /bg-rose-950\/20/g,
    to: "bg-accent-red/10",
  },
  // Slate backgrounds for badges
  {
    from: /bg-slate-800/g,
    to: "bg-white/5",
  },
  {
    from: /bg-slate-900/g,
    to: "bg-white/[0.03]",
  },
  {
    from: /bg-slate-950/g,
    to: "bg-black/30",
  },
  // Specific slate border resets
  {
    from: /border-slate-700/g,
    to: "border-white/10",
  },
  {
    from: /border-slate-800/g,
    to: "border-white/8",
  },
  {
    from: /border-slate-850/g,
    to: "border-white/5",
  },
  {
    from: /border-slate-600/g,
    to: "border-white/10",
  },
  {
    from: /divide-slate-850/g,
    to: "divide-white/5",
  },
  {
    from: /ring-cyan-400/g,
    to: "ring-accent-cyan",
  },
  {
    from: /shadow-xl/g,
    to: "",
  },
  {
    from: /shadow-lg/g,
    to: "",
  },
];

let changed = 0;
for (const file of files) {
  let content = readFileSync(file, "utf8");
  let original = content;
  for (const r of replacers) {
    content = content.replace(r.from, r.to);
  }
  if (content !== original) {
    writeFileSync(file, content, "utf8");
    changed++;
  }
}

console.log(`Updated ${changed} files.`);
