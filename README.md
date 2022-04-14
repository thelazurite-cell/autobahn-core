# Introduction

Autobahn is a BDD framework for performing API & Browser tests via testcafe, supertest & newman.
The main goal is to provide a structured folder structure & make it easier to implement within a CI/CD pipeline.

#### Features
* Gherkin/Cucumber integration
* Read browser console output along with api request and responses in debug mode
* Automatic replacement of application configuration item values (for use with secrets on a CI/CD pipeline)
* API testing support through supertest & gherkin or newman if preferred :)
* Generate code such as step definitions & page object models 
# Using the framework:

#### CLI usage:

##### Generator
`autobahn generate`

A wizard will appear and guide you through the test file generation process.

##### Running Tests
`autobahn [...Options]`

**note:** any TestCafe specific CLI options not stated below will be passed through, and processed as normal.


| Parameter                | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Type                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Mandatory Parameters** |
| `-p`,`--product`         | the 'product' name to test against                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | string                  |
| `-e`, `--environment`    | the environment to test against                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | string                  |
| **General Parameters**   |
| `--help`                 | Show help                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | boolean                 |
| `--version`              | Shows the version/build number number of the framework                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | boolean                 |
| `-d`, `--debug`          | Run the framework with verbose logging; this will also print browser console statements, api requests & responses                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | boolean, default: false |
| `-h`, `--headless`       | Runs the browser(s) in headless mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | boolean                 |
| `-b`, `--cache`          | Sets whether browser caching should be enableed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | boolean, default: false |
| `--retry-test-pages`     | If this option is enabled, testcaf retries failed neetwork requests for webpages during the test run. This is limited to 10 attempts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | boolean, default: true  |
| `-c`, `--pt`             | sets the number of concurrent/parallel threads the test run should use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | number                  |
| `-s`, `--saveReport`     | Saves the files for the configured report types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | boolean, default: false |
| `-r`, `--browserReports` | Overrides the configured reports with the provided value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | string                  |
| **Test Filters**         |
| `-t`, `--tags`           | Sets the tags to filter tests against, multiple tag values can be provided by separating the values by `|`  *do not* include the `@` symbol in front of each tag name                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | string                  |
| `-f`, `--filterTest`     | Sets the filter to use for the test run. You can provide a fixtureName (Feature name) and/or testName (Scenario/Scenario outline name) regexp. e.g. `--filterTest="testName='(.\*)I can prerform a search' | fixtureName='(.\*)Google'"` Filters tests by test name and/or fixture name. Provided parameters are pipe separated. You do not need to provide both `testName='(.*)'` and `fixtureName='(.*)'` one or the other can be sufficient. Regex patterns are supported. In the example provided, tests are filtered to only run tests with a name ending in 'Gas Quote' from a feature file with the Feature name ending in 'Quoting Feature' | string                  |




# Building the repo locally

NPM:
`npm i -g verdaccio gulp nodemon`
`npm i`

For versioning, install the GitVersion dotnet tool:
`dotnet tool install --global GitVersion.Tool --version 5.*`

# Build and Test

Building and testing can be performed by running: `npm run ci`

# Contribute

Always happy to have contributions & feedback for the project :-)

The release branch for this repository is `main`, code should first have it's own branch then merged into `develop`

# Other noteworthy projects and resources

These are other projects and resources that may come in handy:

- [Arthy000/gherkin-testcafe](https://github.com/Arthy000/gherkin-testcafe) - Another gherkin framework for browser/integration testing with testcafe

- [Cucumber (Gherkin) Autocomplete](vscode:extension/alexkrechik.cucumberautocomplete) - VS Code extension; Provides Gherkin support and can be configured to navigate to step definitions.
  
  - Example `settings.json` snnippet:
  ```json
    "cucumberautocomplete.steps": [
        "./src/**/steps/**/*.ts",
    ],
    "cucumberautocomplete.syncfeatures": "./src/**/specs/**/*.feature",
    "cucumberautocomplete.strictGherkinCompletion": false,
    "cucumberautocomplete.strictGherkinValidation": false,
    "cucumberautocomplete.smartSnippets": true,
    "cucumberautocomplete.stepsInvariants": true,
    ```
- [TestCafe Documentation](https://testcafe.io/documentation/402632/reference)
- [Supertest Documentation](https://www.npmjs.com/package/supertest)
- [Newman Documentation](https://www.npmjs.com/package/newman)
