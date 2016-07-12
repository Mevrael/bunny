
var gulp       = require('gulp'),
    sass       = require('gulp-sass');

gulp.task('sass', function () {
    return gulp.src('scss/calendar.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('examples/datepicker/dist/'));
});
