import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const filename = fileURLToPath(import.meta.url);
const directory = dirname(filename);
const compat = new FlatCompat({ baseDirectory: directory });

const eslintConfig = [...compat.extends("next/core-web-vitals")];
const flatConfig = [{ ignores: ["**/.next/**", "**/node_modules/**"] }, ...eslintConfig];

export default flatConfig;
