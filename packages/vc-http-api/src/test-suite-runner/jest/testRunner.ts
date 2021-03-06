/* eslint-disable no-param-reassign */
import fs, { promises } from 'fs';
import path from 'path';
import slugify from 'slugify';
import runJestCli from './cli';
import generateTestReport from './testReporter';
import extractTestSummary from './utilities';

const TEST_RESULTS_DIRECTORY = path.resolve(
  __dirname,
  '../../../docs/vc-http-api'
);

const TEST_FILE_JSON = 'testResults.json';

async function capture(fn: any, p: any) {
  const originalWrite = p.write;
  let output = '';
  try {
    p.write = (chunk: any) => {
      if (typeof chunk === 'string') {
        output += chunk;
      }
      return true;
    };
    await fn();
  } finally {
    p.write = originalWrite;
  }
  return output;
}

export default async (config: any) => {
  const results: any = [];
  const run = async () => {
    if (Array.isArray(config)) {
      await Promise.all(
        config.map(async element => {
          const directory = `${TEST_RESULTS_DIRECTORY}/${slugify(element.name, {
            replacement: '-',
            lower: true,
          })}`;
          if (!fs.existsSync(directory)) {
            await promises.mkdir(directory, { recursive: true });
          }

          const output = await runJestCli(element);
          await generateTestReport(directory, element.name, output.results);
          const summary = extractTestSummary(output.results);
          // console.log(summary);
          await promises.writeFile(
            `${directory}/${TEST_FILE_JSON}`,
            JSON.stringify(summary, null, 2)
          );
          results.push({
            name: element.name,
            results: summary,
          });
        })
      );
    } else {
      const directory = `${TEST_RESULTS_DIRECTORY}/${slugify(config.name, {
        replacement: '-',
        lower: true,
      })}`;
      const output = await runJestCli(config);
      await generateTestReport(directory, config.name, output.results);
      const summary = extractTestSummary(output.results);
      await promises.writeFile(
        `${directory}/${TEST_FILE_JSON}`,
        JSON.stringify(summary, null, 2)
      );
      results.push({
        name: config.name,
        results: summary,
      });
    }
  };

  const capturedReport = await capture(run, process.stderr);

  await promises.writeFile(
    `${TEST_RESULTS_DIRECTORY}/${TEST_FILE_JSON}`,
    JSON.stringify(results, null, 2)
  );

  return {
    suitesReportTerminal: Buffer.from(capturedReport).toString('base64'),
    suitesReportJson: results,
  };
};
