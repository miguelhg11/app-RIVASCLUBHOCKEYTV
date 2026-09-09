import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  globalIgnores(["playwright-report/**", "test-results/**"]),
  ...nextVitals,
];

export default config;
