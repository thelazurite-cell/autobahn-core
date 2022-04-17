/* eslint-disable no-undef */
const { resolve, join } = require("path");
const { series, parallel } = require("gulp");
const fs = require("fs");
const gulp = require("gulp");
const shell = require("shelljs");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const { programFromConfig, buildGenerator } = require("typescript-json-schema");

function clean(cb) {
  shell.rm("-rf", ["./dist"]);
  cb();
}

const tsConfigFile = "tsconfig.json";
function buildTypescript() {
  const tsProject = ts.createProject(tsConfigFile);
  return gulp
    .src("./src/**/*.ts")
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write(".", { sourceRoot: "./", includeContent: false }))
    .pipe(gulp.dest("./dist"));
}

function copyJavascriptFiles() {
  return gulp.src("./src/*.js").pipe(gulp.dest("./dist"));
}

function cleanReportsFolder(cb) {
  shell.rm("-rf", ["./Reports"]);
  cb();
}

function copyFeatureFiles() {
  return gulp.src("./src/**/specs/**/*.feature").pipe(gulp.dest("./dist/"));
}

function copyResourceFiles() {
  return gulp
    .src([
      "./src/**/framework/**/*.js",
      "./src/**/steps/**/*.json",
      "./src/**/test-data/**/*",
      "./src/**/steps/**/*.xml",
      "./src/**/steps/**/*.pdf",
      "./src/**/steps/**/*.xlsx",
      "./src/**/newman-collections/**/*.json",
    ])
    .pipe(gulp.dest("./dist/"));
}

function copyConfig() {
  return gulp.src("./src/config/**/*").pipe(gulp.dest("./dist/config"));
}

function checkVersioning(cb) {
  const gitVersionWin = "GitVersion";
  const gitVersionLin = "dotnet-gitversion";

  if (shell.which(gitVersionWin)) {
    applyVersion(gitVersionWin);
  } else if (shell.which(gitVersionLin)) {
    applyVersion(gitVersionLin);
  } else if (process.env.GITVERSION_SEMVER) {
    setSemVer(process.env.GITVERSION_SEMVER);
  }

  cb();
}

function applyVersion(cmd) {
  const versioning = JSON.parse(shell.exec(cmd, { silent: true }).stdout);
  const semVer = versioning.SemVer;
  setSemVer(semVer);
}

function setSemVer(semVer) {
  shell.sed("-i", /"version": "(.*)",/, `"version": "${semVer}",`, [
    "package.json",
  ]);
}

function updateSchemas(cb) {
  const prettier = require("prettier");

  const outputDirectory = resolve("./schemas");
  const schemasToGenerate = [
    // Add Schemas here
  ];
  const program = programFromConfig(resolve(tsConfigFile));
  const generator = buildGenerator(program);

  while (schemasToGenerate.length !== 0) {
    const current = schemasToGenerate.pop();
    const schema = generator.getSchemaForSymbol(current);
    const saveTo = join(outputDirectory, `${current}.schema.json`);
    const contents = prettier.format(JSON.stringify(schema), {
      parser: "json",
    });

    fs.writeFile(saveTo, contents, (err) => {
      if (err) {
        throw err;
      }
    });
  }
  cb();
}

function watch(cb) {
  exports.watchBuild((err) => {
    notify(
      `Build ${err ? "failed" : "passed"}`,
      err ? err.message.toString() : "Completed with no errors"
    );
    cb();
  });
}

function notify(title, msg) {
  var notifier = require("node-notifier");

  notifier.notify({
    appName: "Gulp Build",
    title: title,
    message: msg,
    // icon: path.join(__dirname, 'gulp-logo.png')
  });
}

exports.lint = lint;
exports.cleanReports = cleanReportsFolder;
exports.clean = clean;
exports.copyFiles = parallel(
  copyJavascriptFiles,
  copyFeatureFiles,
  copyResourceFiles,
  copyConfig
);
exports.build = series(clean, buildTypescript, exports.copyFiles);
exports.updateSchemas = updateSchemas;
exports.ci = series(exports.build, exports.testExample, checkVersioning);
exports.watchBuild = parallel(buildTypescript, exports.copyFiles, lint);
exports.watch = watch;
exports.default = exports.build;
