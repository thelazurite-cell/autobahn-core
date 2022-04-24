<p align="center">
  <svg width="13.713mm" height="13.714mm" version="1.1" viewBox="0 0 13.713 13.714" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="linearGradient45113" x1="7.9375" x2="7.9375" y1="3.4396" y2="22.225" gradientTransform="matrix(1.2707 0 0 1.2707 -2.3038 -2.9265)" gradientUnits="userSpaceOnUse">
    <stop stop-color="#0da3a2" offset="0"/>
    <stop stop-color="#0d468a" offset="1"/>
    </linearGradient>
    <filter id="filter46879" x="-.14158" y="-.10897" width="1.3019" height="1.2326" color-interpolation-filters="sRGB">
    <feFlood flood-color="rgb(0,0,0)" flood-opacity=".49804" result="flood"/>
    <feComposite in="flood" in2="SourceGraphic" operator="in" result="composite1"/>
    <feGaussianBlur in="composite1" result="blur" stdDeviation="0.3"/>
    <feOffset dx="0.1" dy="0.1" result="offset"/>
    <feComposite in="SourceGraphic" in2="offset" result="composite2"/>
    </filter>
  </defs>
  <g transform="translate(-.92583 -1.9842)">
    <path x="1.0583334" y="2.1166668" width="13.448482" height="13.448536" d="m2.3813 2.1167h10.803a1.3229 1.3229 45 0 1 1.3229 1.3229v10.803a1.3229 1.3229 135 0 1-1.3229 1.3229h-10.803a1.3229 1.3229 45 0 1-1.3229-1.3229v-10.803a1.3229 1.3229 135 0 1 1.3229-1.3229z" fill="url(#linearGradient45113)" fill-rule="evenodd" stroke="#fff" stroke-width=".265"/>
    <g transform="matrix(1.2651 0 0 1.2764 -2.3038 -2.9265)" fill="#fff" filter="url(#filter46879)" stroke="#0d468a" stroke-width=".05" aria-label="A">
    <path d="m9.703 12.658-0.56216-2.3859h-2.3178l-0.55486 2.3859h-0.92773c0.21408-0.7091 0.43363-1.4231 0.6563-2.1357 0.20637-0.66044 0.4088-1.2896 0.60716-1.8891 0.19035-0.55808 0.3735-1.0789 0.55013-1.5661 0.16584-0.46212 0.32821-0.87532 0.48814-1.2456h0.7449c0.15596 0.37027 0.3142 0.78348 0.47567 1.2456 0.17747 0.48716 0.35582 1.008 0.53514 1.5661 0.19874 0.5995 0.40156 1.2287 0.60834 1.8891 0.22311 0.7126 0.44311 1.4266 0.65763 2.1357zm-1.7104-6.2891c-0.11951 0.34055-0.25671 0.75665-0.41491 1.2603-0.16947 0.53955-0.34339 1.1371-0.52291 1.8015h1.8556c-0.17319-0.67894-0.34361-1.2821-0.51229-1.8203-0.15224-0.5083-0.28631-0.91756-0.40552-1.2415z"/>
    </g>
  </g>
  </svg>
</p>
<h1 align="center">Autobahn</h3> 

<p align="center">
<a href="https://github.com/thelazurite-cell/autobahn-core/actions/workflows/publish.yml"><img alt="Release" src="https://github.com/thelazurite-cell/autobahn-core/actions/workflows/publish.yml/badge.svg" data-canonical-src="https://github.com/thelazurite-cell/autobahn-core/actions/workflows/publish.yml/badge.svg" style="max-width:100%;"></a>
<a href="https://github.com/thelazurite-cell/autobahn-core/actions/workflows/test-report.yml"><img alt="Tests" src="https://github.com/thelazurite-cell/autobahn-core/actions/workflows/test-report.yml/badge.svg" data-canonical-src="https://github.com/thelazurite-cell/autobahn-core/actions/workflows/test-report.yml/badge.svg" style="max-width:100%;"></a>
<a href="https://www.npmjs.com/package/autobahn-core"><img alt="NPM Version" src="https://img.shields.io/npm/v/autobahn-core.svg" data-canonical-src="https://img.shields.io/npm/v/autobahn-core.svg" style="max-width:100%;"></a>
 <a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>
</p>

# Introduction

Autobahn is a BDD framework for performing API & Browser tests via testcafe, supertest & newman.
The main goal is to provide a structured folder structure & make it easier to implement within a CI/CD pipeline.

#### Features

- Gherkin/Cucumber integration
- Read browser console output along with api request and responses in debug mode
- Automatic replacement of application configuration item values (for use with secrets on a CI/CD pipeline)
- API testing support through supertest & gherkin or newman if preferred :)
- Generate code such as step definitions & page object models

# Getting started

First add the dependency to your project
`npm i autobahn-core`

make sure you are running with typescript version >=4.5.5

in the scripts property of your `package.json` file add the following:

```json
"generate": "autobahn generate"
```

Then run the script (`npm run generate`). On the first run it will ask you to create a project config file. Doing this will also generate the basic folder structure.

After that generate your first project config :) Also feel free to check out the [Examples](https://github.com/thelazurite-cell/autobahn-core/tree/main/examples) folder to get a head start.

<p align="center">
  <img src="https://raw.github.com/thelazurite-cell/autobahn-core/master/media/example_run.png" alt="Example test run with autobahn" />
</p>

# Using the framework:

#### CLI usage:

##### Generator

`autobahn generate`

A wizard will appear and guide you through the test file generation process.

##### Running Tests

`autobahn [...Options]`

**note:** any TestCafe specific CLI options not stated below will be passed through, and processed as normal.

| Parameter                | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Type                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Mandatory Parameters** |
| `-p`,`--product`         | the 'product' name to test against                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | string                  |
| `-e`, `--environment`    | the environment to test against                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | string                  |
| **General Parameters**   |
| `--help`                 | Show help                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | boolean                 |
| `--version`              | Shows the version/build number number of the framework                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | boolean                 |
| `-d`, `--debug`          | Run the framework with verbose logging; this will also print browser console statements, api requests & responses                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | boolean, default: false |
| `-h`, `--headless`       | Runs the browser(s) in headless mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | boolean                 |
| `-b`, `--cache`          | Sets whether browser caching should be enableed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | boolean, default: false |
| `--retry-test-pages`     | If this option is enabled, testcaf retries failed neetwork requests for webpages during the test run. This is limited to 10 attempts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | boolean, default: true  |
| `-c`, `--pt`             | sets the number of concurrent/parallel threads the test run should use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | number                  |
| `-s`, `--saveReport`     | Saves the files for the configured report types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | boolean, default: false |
| `-r`, `--browserReports` | Overrides the configured reports with the provided value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | string                  |
| **Test Filters**         |
| `-t`, `--tags`           | Sets the tags to filter tests against, multiple tag values can be provided by separating the values by pipe <code>&#124;</code><br><br> _do not_ include the `@` symbol in front of each tag name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | string                  |
| `-f`, `--filterTest`     | Sets the filter to use for the test run. You can provide a fixtureName (Feature name) and/or testName (Scenario/Scenario outline name) regexp.<br><br> e.g. <code>--filterTest="testName='(.\*)I can prerform a search' &#124; fixtureName='(.\*)Google'"</code><br><br> Filters tests by test name and/or fixture name. Provided parameters are pipe separated. You do not need to provide both `testName='(.*)'` and `fixtureName='(.*)'` one or the other can be sufficient. Regex patterns are supported. In the example provided, tests are filtered to only run tests with a name ending in 'Gas Quote' from a feature file with the Feature name ending in 'Quoting Feature' | string                  |

# Building the repo locally

NPM:
`npm i -g verdaccio gulp nodemon`

Verdaccio is a tool that creaetes a local NPM registry; this can be used to test the package without having to publish to the public registry.

`npm i`

For versioning, install the GitVersion dotnet tool:
`dotnet tool install --global GitVersion.Tool --version 5.*`

# Build and Test

Building and testing can be performed by running: `npm run ci`

# Contribute

Always happy to have contributions & feedback for the project :-)

The release branch for this repository is `main`, code should first have it's own branch then merged into `develop`

Please also check our [Code Of Conduct](https://github.com/thelazurite-cell/autobahn-core/blob/main/code_of_conduct.md)

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
