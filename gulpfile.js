var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var shell = require('gulp-shell')

gulp.task('default', ['less'], shell.task([
  './node_modules/.bin/electron .'
]));

gulp.task('less', function () {
  return gulp.src('./less/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./css'));
});
