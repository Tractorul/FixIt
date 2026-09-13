import { ConfigConverterRequest, ConfigConverterResponse } from "@/types";

type KeyValueMap = Record<string, string | number | boolean>;

export function parseEnv(content: string): KeyValueMap {
  const result: KeyValueMap = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    if (key) {
      result[key] = val;
    }
  }

  return result;
}

export function parseJson(content: string): KeyValueMap {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

export function parseYamlSimple(content: string): KeyValueMap {
  const result: KeyValueMap = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim().replace(/^-\s*/, "");
    let val = trimmed.slice(colonIdx + 1).trim();

    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    if (key) {
      result[key] = val;
    }
  }

  return result;
}

export function parseTomlSimple(content: string): KeyValueMap {
  const result: KeyValueMap = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("[")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    if (key) {
      result[key] = val;
    }
  }

  return result;
}

export function emitEnv(map: KeyValueMap, maskSecrets: boolean): { output: string; maskedCount: number } {
  let masked = 0;
  const lines = Object.entries(map).map(([key, val]) => {
    let finalVal = String(val);
    if (maskSecrets && isSecretKey(key)) {
      finalVal = "********";
      masked++;
    }
    // Quote if contains whitespace
    if (finalVal.includes(" ")) {
      finalVal = `"${finalVal}"`;
    }
    return `${key}=${finalVal}`;
  });

  return { output: lines.join("\n"), maskedCount: masked };
}

export function emitJson(map: KeyValueMap, maskSecrets: boolean): { output: string; maskedCount: number } {
  let masked = 0;
  const outObj: Record<string, string | number | boolean> = {};

  for (const [key, val] of Object.entries(map)) {
    if (maskSecrets && isSecretKey(key)) {
      outObj[key] = "********";
      masked++;
    } else {
      outObj[key] = val;
    }
  }

  return { output: JSON.stringify(outObj, null, 2), maskedCount: masked };
}

export function emitYaml(map: KeyValueMap, maskSecrets: boolean): { output: string; maskedCount: number } {
  let masked = 0;
  const lines = Object.entries(map).map(([key, val]) => {
    let finalVal = String(val);
    if (maskSecrets && isSecretKey(key)) {
      finalVal = "********";
      masked++;
    }
    if (finalVal.includes(" ") || finalVal.includes(":") || finalVal.includes("#")) {
      finalVal = `"${finalVal}"`;
    }
    return `${key}: ${finalVal}`;
  });

  return { output: lines.join("\n"), maskedCount: masked };
}

export function emitToml(map: KeyValueMap, maskSecrets: boolean): { output: string; maskedCount: number } {
  let masked = 0;
  const lines = Object.entries(map).map(([key, val]) => {
    let finalVal = String(val);
    if (maskSecrets && isSecretKey(key)) {
      finalVal = "********";
      masked++;
    }
    return `${key} = "${finalVal}"`;
  });

  return { output: lines.join("\n"), maskedCount: masked };
}

export function emitDockerComposeEnv(map: KeyValueMap, maskSecrets: boolean): { output: string; maskedCount: number } {
  let masked = 0;
  const lines = [
    "    environment:",
    ...Object.entries(map).map(([key, val]) => {
      let finalVal = String(val);
      if (maskSecrets && isSecretKey(key)) {
        finalVal = "********";
        masked++;
      }
      return `      - ${key}=${finalVal}`;
    }),
  ];

  return { output: lines.join("\n"), maskedCount: masked };
}

function isSecretKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes("secret") ||
    lower.includes("password") ||
    lower.includes("pass") ||
    lower.includes("key") ||
    lower.includes("token") ||
    lower.includes("auth") ||
    lower.includes("cred") ||
    lower.includes("private")
  );
}

export function transformConfig(request: ConfigConverterRequest): ConfigConverterResponse {
  const { sourceFormat, targetFormat, content, maskSecrets = false } = request;

  let parsed: KeyValueMap = {};

  try {
    switch (sourceFormat) {
      case "env":
        parsed = parseEnv(content);
        break;
      case "json":
        parsed = parseJson(content);
        break;
      case "yaml":
        parsed = parseYamlSimple(content);
        break;
      case "toml":
        parsed = parseTomlSimple(content);
        break;
      case "docker-compose-env":
        parsed = parseEnv(content.replace(/-\s+/g, "").replace(/environment:/g, ""));
        break;
      default:
        parsed = parseEnv(content);
    }
  } catch (err) {
    return {
      sourceFormat,
      targetFormat,
      convertedContent: "",
      isValid: false,
      errors: [err instanceof Error ? err.message : "Failed to parse source format"],
      detectedVariablesCount: 0,
      maskedSecretsCount: 0,
    };
  }

  const varCount = Object.keys(parsed).length;
  if (varCount === 0 && content.trim().length > 0) {
    return {
      sourceFormat,
      targetFormat,
      convertedContent: "",
      isValid: false,
      errors: [`Could not extract variables. Ensure valid ${sourceFormat.toUpperCase()} syntax.`],
      detectedVariablesCount: 0,
      maskedSecretsCount: 0,
    };
  }

  let resultOutput = "";
  let maskedCount = 0;

  switch (targetFormat) {
    case "env": {
      const res = emitEnv(parsed, maskSecrets);
      resultOutput = res.output;
      maskedCount = res.maskedCount;
      break;
    }
    case "json": {
      const res = emitJson(parsed, maskSecrets);
      resultOutput = res.output;
      maskedCount = res.maskedCount;
      break;
    }
    case "yaml": {
      const res = emitYaml(parsed, maskSecrets);
      resultOutput = res.output;
      maskedCount = res.maskedCount;
      break;
    }
    case "toml": {
      const res = emitToml(parsed, maskSecrets);
      resultOutput = res.output;
      maskedCount = res.maskedCount;
      break;
    }
    case "docker-compose-env": {
      const res = emitDockerComposeEnv(parsed, maskSecrets);
      resultOutput = res.output;
      maskedCount = res.maskedCount;
      break;
    }
  }

  return {
    sourceFormat,
    targetFormat,
    convertedContent: resultOutput,
    isValid: true,
    detectedVariablesCount: varCount,
    maskedSecretsCount: maskedCount,
  };
}
