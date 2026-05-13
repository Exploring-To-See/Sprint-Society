import { execSync } from "child_process";
import { resolve, basename } from "path";
import { existsSync } from "fs";

type Format = "mp4" | "gif" | "both";
type Aspect = "story" | "square" | "landscape";

interface RenderOptions {
  compositionId: string;
  propsPath?: string;
  format?: Format;
  aspect?: Aspect;
  outputDir?: string;
}

const ASPECT_SUFFIX: Record<Aspect, string> = {
  story: "Story",
  square: "Square",
  landscape: "Landscape",
};

function render(options: RenderOptions) {
  const {
    compositionId,
    propsPath,
    format = "mp4",
    aspect = "story",
    outputDir = resolve(__dirname, "../../output"),
  } = options;

  const fullCompositionId = `${compositionId}-${ASPECT_SUFFIX[aspect]}`;
  const timestamp = new Date().toISOString().slice(0, 10);
  const baseName = `${compositionId.toLowerCase()}-${timestamp}-${aspect}`;

  const propsArg = propsPath ? `--props="${resolve(propsPath)}"` : "";

  const renderMp4 = () => {
    const output = resolve(outputDir, `${baseName}.mp4`);
    const cmd = `npx remotion render ${fullCompositionId} ${propsArg} --output="${output}" --codec=h264`.trim();
    console.log(`\nRendering MP4: ${output}`);
    console.log(`> ${cmd}\n`);
    execSync(cmd, { stdio: "inherit", cwd: resolve(__dirname, "..") });
    console.log(`Done: ${output}`);
    return output;
  };

  const renderGif = () => {
    const output = resolve(outputDir, `${baseName}.gif`);
    const cmd = `npx remotion render ${fullCompositionId} ${propsArg} --output="${output}" --codec=gif --every-nth-frame=3`.trim();
    console.log(`\nRendering GIF: ${output}`);
    console.log(`> ${cmd}\n`);
    execSync(cmd, { stdio: "inherit", cwd: resolve(__dirname, "..") });
    console.log(`Done: ${output}`);
    return output;
  };

  const outputs: string[] = [];

  if (format === "mp4" || format === "both") {
    outputs.push(renderMp4());
  }
  if (format === "gif" || format === "both") {
    outputs.push(renderGif());
  }

  console.log("\n=== Render Complete ===");
  outputs.forEach((o) => console.log(`  ${o}`));
  return outputs;
}

// CLI usage: tsx scripts/render.ts <compositionId> [--props=path] [--format=mp4|gif|both] [--aspect=story|square|landscape]
const args = process.argv.slice(2);
const compositionId = args[0];

if (!compositionId) {
  console.log(`
Usage: tsx scripts/render.ts <compositionId> [options]

Options:
  --props=<path>          Path to JSON props file
  --format=<mp4|gif|both> Output format (default: mp4)
  --aspect=<story|square|landscape> Aspect ratio (default: story)
  --output=<dir>          Output directory (default: ../output/)

Compositions:
  RunRecap, Achievement, Transformation, Montage

Examples:
  tsx scripts/render.ts RunRecap --props=src/data/sample-run-recap.json --format=both --aspect=story
  tsx scripts/render.ts Achievement --format=mp4 --aspect=square
`);
  process.exit(0);
}

const getArg = (name: string): string | undefined => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split("=")[1];
};

render({
  compositionId,
  propsPath: getArg("props"),
  format: (getArg("format") as Format) || "mp4",
  aspect: (getArg("aspect") as Aspect) || "story",
  outputDir: getArg("output") || resolve(__dirname, "../../output"),
});
