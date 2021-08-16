// Определяем переменную "preprocessor"
let preprocessor = 'sass';

// Определяем константы Gulp
const { src, dest, parallel, series, watch } = require('gulp');

// Подключаем Browsersync
const browserSync = require('browser-sync').create();

// Подключаем gulp-concat
const concat = require('gulp-concat');

// Подключаем Pug
const pug = require('gulp-pug');

// Подключаем BEM Pug
const pugbem = require('gulp-pugbem');

// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;

// Подключаем модули gulp-sass и gulp-less
const sass = require('gulp-sass');
const less = require('gulp-less');

// Подключаем Autoprefixer
const autoprefixer = require('gulp-autoprefixer');

// Подключаем модуль gulp-clean-css
const cleancss = require('gulp-clean-css');

// Подключаем gulp-imagemin для работы с изображениями
const imagemin = require('gulp-imagemin');

// Подключаем модуль gulp-newer
const newer = require('gulp-newer');

// Подключаем модуль del
const del = require('del');

// Определяем логику работы Browsersync
function browsersync() {
    browserSync.init({
        // Инициализация Browsersync
        server: { baseDir: 'app/' }, // Указываем папку сервера
        notify: false, // Отключаем уведомления
        online: true, // Режим работы: true или false
    });
}
function scriptsLibs() {
    return src([
        // Берём файлы из источников
        'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
        'node_modules/swiper/swiper-bundle.min.js',
        // 'node_modules/jquery-nice-select/js/jquery.nice-select.min.js',
        'node_modules/inputmask/dist/jquery.inputmask.min.js',
        'app/js/plugins/jquery.fancybox.min.js',
    ])
        .pipe(concat('libs.min.js')) // Конкатенируем в один файл
        .pipe(uglify()) // Сжимаем JavaScript
        .pipe(dest('app/js/')); // Выгружаем готовый файл в папку назначения
}

function scripts() {
    return (
        src([
            // Берём файлы из источников
            'app/js/app.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
        ])
            // .pipe(concat('scripts.js')) // Конкатенируем в один файл
            // .pipe(dest('app/js/')) // Выгружаем готовый файл в папку назначения
            .pipe(browserSync.stream())
    ); // Триггерим Browsersync для обновления страницы
}

function stylesLibs() {
    return src([
        'node_modules/normalize.css/normalize.css',
        'node_modules/swiper/swiper-bundle.min.css',
        'node_modules/hamburgers/dist/hamburgers.min.css',
        // 'node_modules/jquery-nice-select/css/nice-select.css',
        'app/css/plugins/jquery.fancybox.min.css',
    ])
        .pipe(concat('libs.min.css')) // Конкатенируем в файл app.min.js
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 10 versions'],
                grid: true,
            })
        ) // Создадим префиксы с помощью Autoprefixer
        .pipe(
            cleancss({
                level: { 1: { specialComments: 0 } } /* , format: 'beautify' */,
            })
        ) // Минифицируем стили
        .pipe(dest('app/css/')); // Выгрузим результат в папку "app/css/"
}
function styles() {
    return src('app/' + preprocessor + '/main.' + preprocessor + '') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
        .pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
        .pipe(concat('app.css')) // Конкатенируем в файл app.min.js
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 10 versions'],
                grid: true,
            })
        ) // Создадим префиксы с помощью Autoprefixer
        .pipe(dest('app/css/')) // Выгрузим результат в папку "app/css/"
        .pipe(browserSync.stream()); // Сделаем инъекцию в браузер
}

function pugTask() {
    return src('app/pug/pages/*.pug')
        .pipe(
            pug({
                doctype: 'html',
                pretty: '\t',
                plugins: [pugbem],
            })
        )
        .pipe(dest('app'));
}

function images() {
    return src('app/images/src/**/*') // Берём все изображения из папки источника
        .pipe(newer('app/images/dest/')) // Проверяем, было ли изменено (сжато) изображение ранее
        .pipe(imagemin()) // Сжимаем и оптимизируем изображеня
        .pipe(dest('app/images/dest/')); // Выгружаем оптимизированные изображения в папку назначения
}

function cleanimg() {
    return del('app/images/dest/**/*', { force: true }); // Удаляем всё содержимое папки "app/images/dest/"
}

function buildcopy() {
    return src(
        [
            // Выбираем нужные файлы
            'app/css/**/*.min.css',
            'app/js/**/*.min.js',
            'app/images/dest/**/*',
            'app/**/*.html',
        ],
        { base: 'app' }
    ) // Параметр "base" сохраняет структуру проекта при копировании
        .pipe(dest('dist')); // Выгружаем в папку с финальной сборкой
}

function cleandist() {
    return del('dist/**/*', { force: true }); // Удаляем всё содержимое папки "dist/"
}

function startwatch() {
    // Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
    watch(['app/**/*.js', '!app/**/*.min.js'], scripts);

    // Мониторим файлы препроцессора на изменения
    watch('app/**/' + preprocessor + '/**/*', styles);

    // Мониторим файлы HTML на изменения
    watch('app/**/*.html').on('change', browserSync.reload);

    // Мониторим файлы Pug на изменения
    watch('app/**/*.pug').on('change', series('pugTask'));

    // Мониторим папку-источник изображений и выполняем images(), если есть изменения
    watch('app/images/src/**/*', images);
}

// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;

// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;

// Экспортируем функцию scripts() в таск scripts
exports.scripts = scriptsLibs;

// Экспортируем функцию styles() в таск styles
exports.styles = styles;

// Экспортируем функцию styles() в таск styles
exports.stylesLibs = stylesLibs;

// Экспорт функции pug() в таск pug
exports.pugTask = pugTask;

// Экспорт функции images() в таск images
exports.images = images;

// Экспортируем функцию cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;

// Создаём новый таск "build", который последовательно выполняет нужные операции
exports.build = series(cleandist, styles, scripts, images, buildcopy);

// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(
    stylesLibs,
    styles,
    scriptsLibs,
    scripts,
    pugTask,
    browsersync,
    startwatch
);
