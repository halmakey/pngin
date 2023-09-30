import { loadEnvConfig } from "@next/env";
import "jest-date-mock";

export default async function setup() {
  loadEnvConfig(process.cwd());
}
