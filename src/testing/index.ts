/*
 * (c) Copyright IBM Corp. 2023
 */

import * as vscode from "vscode";
import { env } from "process";
import { TestSuitesTreeProvider } from "./testCasesTree";
import { getInstance } from "../ibmi";
import { iProjectSuite } from "./iProject";
import { projectManagerSuite } from "./projectManager";
import { jobLogSuite } from "./jobLog";
import { projectExplorerSuite } from "./projectExplorer";

const suites: TestSuite[] = [
  iProjectSuite,
  jobLogSuite,
  projectManagerSuite,
  projectExplorerSuite
];

export type TestSuite = {
  name: string,
  beforeAll?: () => Promise<void>,
  beforeEach?: () => Promise<void>,
  afterAll?: () => Promise<void>,
  afterEach?: () => Promise<void>,
  tests: TestCase[]
};

export interface TestCase {
  name: string,
  status?: "running" | "failed" | "pass"
  failure?: string
  test: () => Promise<void>
}

let testSuitesTreeProvider: TestSuitesTreeProvider;
export function initialise(context: vscode.ExtensionContext) {
  if (env.testing === `true`) {
    vscode.commands.executeCommand(`setContext`, `projectExplorer:testing`, true);
    const ibmi = getInstance()!;
    ibmi.onEvent(`connected`, runTests);
    ibmi.onEvent(`disconnected`, resetTests);
    testSuitesTreeProvider = new TestSuitesTreeProvider(suites);

    context.subscriptions.push(
      vscode.window.registerTreeDataProvider("testing", testSuitesTreeProvider),
      vscode.commands.registerCommand(`projectExplorer.testing.specific`, async (suiteName: string, testName: string) => {
        if (suiteName && testName) {
          const suite = suites.find(suite => suite.name === suiteName);

          if (suite) {
            const testCase = suite.tests.find(testCase => testCase.name === testName);

            if (testCase) {
              if (suite.beforeAll) {
                await suite.beforeAll();
              }

              if (suite.beforeEach) {
                await suite.beforeEach();
              }

              await runTest(testCase);

              if (suite.afterEach) {
                await suite.afterEach();
              }

              if (suite.afterAll) {
                await suite.afterAll();
              }
            }
          }
        }
      })
    );
  }
}

async function runTests() {
  for (const suite of suites) {
    console.log(`Running suite ${suite.name} (${suite.tests.length})`);
    console.log();

    if (suite.beforeAll) {
      await suite.beforeAll();
    }

    for await (const test of suite.tests) {
      if (suite.beforeEach) {
        await suite.beforeEach();
      }

      await runTest(test);

      if (suite.afterEach) {
        await suite.afterEach();
      }
    }

    if (suite.afterAll) {
      await suite.afterAll();
    }
  }
}

async function runTest(test: TestCase) {
  console.log(`\tRunning ${test.name}`);
  test.status = "running";
  testSuitesTreeProvider.refresh();

  try {
    await test.test();
    test.status = "pass";
  }

  catch (error: any) {
    console.log(error);
    test.status = "failed";
    test.failure = error.message;
  }

  finally {
    testSuitesTreeProvider.refresh();
  }
}

function resetTests() {
  suites.flatMap(ts => ts.tests).forEach(tc => {
    tc.status = undefined;
    tc.failure = undefined;
  });
}