import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  runner: "local",
  port: 4723,
  specs: ["./tests/**/*.test.js"],
  exclude: [],
  maxInstances: 1,
  capabilities: [
    {
      platformName: "Android",
      "appium:deviceName": "Android Emulator",
      "appium:platformVersion": "13.0",
      "appium:automationName": "UiAutomator2",
      "appium:app": path.join(__dirname, "..", "osa-diagnostic.apk"),
      "appium:appPackage": "com.osadiagnostic.app",
      "appium:appActivity": "com.osadiagnostic.app.MainActivity",
      "appium:autoGrantPermissions": true,
      "appium:newCommandTimeout": 240,
    },
  ],
  logLevel: "info",
  bail: 0,
  baseUrl: "http://localhost:5000",
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ["appium"],
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
  },
};
