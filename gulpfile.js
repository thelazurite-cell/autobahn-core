/* eslint-disable no-undef */
const { resolve, join } = require("path");
const { series, parallel } = require("gulp");
const fs = require("fs");
const path = require("path");
const gulp = require("gulp");
const shell = require("shelljs");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const eslint = require("gulp-eslint7");
const mocha = require("gulp-mocha");
const { programFromConfig, buildGenerator } = require("typescript-json-schema");

const events = require("events");
const { message } = require("gulp-typescript/release/utils");

function lint() {
  return gulp
    .src("./src/**/*.ts")
    .pipe(
      eslint({
        useEslintrc: true,
      })
    )
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

function clean(cb) {
  shell.rm("-rf", ["./dist", "./ts-defs"]);
  cb();
}

const tsConfigFile = "tsconfig.json";
const tsLibConfigFile = "tsconfig-lib.json";
function buildTypescript() {
  const tsProject = ts.createProject(tsConfigFile);
  return gulp
    .src("./src/**/*.ts")
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write(".", { sourceRoot: "./src", includeContent: false }))
    .pipe(gulp.dest("./dist"));
}

function buildTypings() {
  const tsProject = ts.createProject(tsLibConfigFile);
  return gulp
    .src(["./src/**/*.js", "./src/**/*.ts"])
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write(".", { sourceRoot: "./src", includeContent: false }))
    .pipe(gulp.dest("./ts-defs"));
}

function copyJavascriptFiles() {
  return gulp.src("./src/*.js").pipe(gulp.dest("./dist"));
}

function copyTypingFiles() {
  return gulp.src("./src/**/*.d.ts").pipe(gulp.dest("./dist"));
}

function cleanReportsFolder(cb) {
  shell.rm("-rf", ["./Reports"]);
  cb();
}

function cleanForPublish(cb) {
  shell.rm("-rf", [
    "./Reports",
    "./dist/config",
    "./dist/tests",
    "./dist/products",
    "./ts-defs/products",
    "./ts-defs/tests",
  ]);
  cb();
}

function copyFeatureFiles() {
  return gulp.src("./src/**/*.feature").pipe(gulp.dest("./dist/"));
}

function copyResourceFiles() {
  return gulp.src(["./src/**/framework/**/*.js"]).pipe(gulp.dest("./dist/"));
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
  const gitversionOutput = shell.exec(cmd, { silent: true }).stdout;
  console.log("GitVersion output:", gitversionOutput);

  const versioning = JSON.parse(gitversionOutput);
  const semVer = versioning.SemVer;
  setSemVer(semVer);
}

function setSemVer(semVer) {
  shell.sed("-i", /"version": "(.*)",/, `"version": "${semVer}",`, [
    "package.json",
  ]);
}

function test() {
  return gulp.src("./dist/tests/**/*.spec.js").pipe(mocha({ ui: "bdd" }));
}

function updateSchemas(cb) {
  const prettier = require("prettier");

  const outputDirectory = resolve("./schemas");
  const schemasToGenerate = [
    "FrameworkTestConfiguration",
    "AppConfiguration",
    "Project",
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
  });
}

exports.lint = lint;
exports.cleanReports = cleanReportsFolder;
exports.clean = clean;
exports.test = test;
exports.copyFiles = parallel(
  copyJavascriptFiles,
  copyFeatureFiles,
  copyResourceFiles,
  copyConfig
);
exports.build = series(clean, lint, buildTypescript, exports.copyFiles);
exports.updateSchemas = updateSchemas;
exports.ci = series(
  exports.build,
  test,
  exports.copyFiles,
  cleanForPublish,
  checkVersioning,
  updateSchemas
);
exports.watchBuild = parallel(buildTypescript, exports.copyFiles, lint);
exports.watch = watch;
exports.default = exports.build;
