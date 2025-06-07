import * as fs from "fs";
import * as yaml from "js-yaml";

interface Conversion {
  format: "webp" | "jpeg" | "png" | "avif";
  quality?: number;
}

interface Config {
  source: string;
  conversions: Conversion[];
}

function parsePrBody(body: string): Config {
  const yamlRegex = /```yaml\s*([\s\S]*?)\s*```/;
  const match = body.match(yamlRegex);

  if (!match) {
    throw new Error("PR body does not contain a yaml configuration block.");
  }

  const yamlContent = match[1];
  const config = yaml.load(yamlContent) as Config;

  if (!config.source || !config.conversions) {
    throw new Error(
      'YAML config must contain "source" and "conversions" keys.'
    );
  }

  return config;
}

const prBody = process.argv[2];
if (!prBody) {
  console.error('Usage: ts-node parse-pr-body.ts "<PR_BODY>"');
  process.exit(1);
}

try {
  const config = parsePrBody(prBody);
  console.log(JSON.stringify(config));
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
