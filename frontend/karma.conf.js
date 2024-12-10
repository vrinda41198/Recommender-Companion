module.exports = function (config) {
    config.set({
      basePath: '',
      frameworks: ['jasmine', '@angular-devkit/build-angular'],
      plugins: [
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('karma-jasmine-html-reporter'),
        require('karma-coverage'),
        require('@angular-devkit/build-angular/plugins/karma')
      ],
      client: {
        clearContext: false
      },
      coverageReporter: {
        dir: require('path').join(__dirname, './coverage'),
        subdir: '.',
        reporters: [
          { type: 'html' },
          { type: 'text-summary' },
          { type: 'lcov' }
        ],
        fixWebpackSourcePaths: true,
        check: {
          global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80
          }
        }
      },
      reporters: ['progress', 'kjhtml', 'coverage'],
      port: 9876,
      colors: true,
      logLevel: config.LOG_ERROR,
      autoWatch: true,
      browsers: ['Chrome'],
      singleRun: false,
      restartOnFileChange: true,
      customLaunchers: {
        ChromeHeadlessCI: {
          base: 'ChromeHeadless',
          flags: ['--no-sandbox']
        }
      }
    });
  };