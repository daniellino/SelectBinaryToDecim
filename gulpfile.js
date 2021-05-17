// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const purgecss = require('gulp-purgecss')
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const del = require('del');
//const htmlmin = require('gulp-htmlmin');
const browserSync = require('browser-sync').create();
var replace = require('gulp-replace');

// File paths
const files = {
  scssPath: 'app/scss/**/*.scss',
  jsPath: 'app/js/**/*.js',
  htmlPath: '*.html',
};

// Sass task: compiles the style.scss file into style.css
function scssTask() {
  return src(files.scssPath)
    .pipe(sourcemaps.init()) // initialize sourcemaps first
    .pipe(sass()) // compile SCSS to CSS
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(purgecss({
      content: ['*.html']
    })) // PostCSS plugins
    .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
    .pipe(dest('dist/css/')); // put final CSS in dist folder
}

// JS task: concatenates and uglifies JS files to script.js
function jsTask() {
  return src([
    files.jsPath,
    //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
  ])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('main.js'))
    .pipe(
      uglify({
        // mangle: { toplevel: true },
        compress: {
          drop_console: true,
          //this option will strip oout console.log from JS code
          // drop_console: false,
          drop_debugger: false,
          // hoist_funs: false,
        },
        output: {
          //preventing from changing quote style
          quote_style: 2,
          beautify: false,
          // comments: true,
        },
      })
    )
    .pipe(
      rename({
        extname: '.min.js',
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist/js/'));
}

//minify HTML
// function minHTM() {
//   return src('./app/html/**/*.html', files.htmlPath)
//     .pipe(htmlmin({
//       collapseWhitespace: true,
//       removeComments: true
//     }))
//     .pipe(dest('dist/htm/'));
// }

// Cachebust
function cacheBustTask() {
  var cbString = new Date().getTime();
  return src([files.htmlPath])
    .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
    .pipe(dest('.'));
}

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask() {
  browserSync.init({
    notify: false, //prevents showing the message of browser sync
    open: true, //prevents openning the browser tab
    server: {
      baseDir: './',
    },
  });
  watch(
    [files.scssPath, files.jsPath],
    {
      interval: 1000,
      usePolling: true,
    }, //Makes docker work
    series(parallel(scssTask, jsTask), cacheBustTask)
  );
  watch(files.htmlPath).on('change', browserSync.reload);
}

async function clean(cb) {
  // clearing the previous version of dist folder and create it again
  await del('dist');
  cb();
}
// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(
  clean,
  parallel(scssTask, jsTask),
  cacheBustTask,
  watchTask
);
