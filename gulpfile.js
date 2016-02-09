
var gulp       = require('gulp'),
    rollup     = require('gulp-rollup'),
    //sourcemaps = require('gulp-sourcemaps'),
    babel      = require('rollup-plugin-babel')

gulp.task('default', function(){
    gulp.src('examples/container/index.js', {read: false})
        .pipe(rollup({
            // any option supported by rollup can be set here, including sourceMap
            sourceMap: false,
            plugins: [babel()]
        }))
        //.pipe(sourcemaps.write(".")) // this only works if the sourceMap option is true
        .pipe(gulp.dest('examples/container/dist'));
});
