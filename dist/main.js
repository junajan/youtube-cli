'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _youtubeDl = require('youtube-dl');

var _youtubeDl2 = _interopRequireDefault(_youtubeDl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var version = require('../package.json').version;

var YoutubeCli = function () {
  function YoutubeCli() {
    _classCallCheck(this, YoutubeCli);

    this.YOUTUBE = 'https://www.youtube.com/watch?v=';
    this.DELIMITER = ',';
    this.CONCURRENCY = 1;
  }

  _createClass(YoutubeCli, [{
    key: 'addHelp',
    value: function addHelp(program) {
      program.usage('youtube download [youtube codes, ...] outputFolder');
      program.on('--help', function () {
        console.log('  Examples:');
        console.log('');
        console.log('    $ youtube download youtube,codes,delimited,by,comma output');
        console.log('    $ youtube download "hN_q-_nGv4U,D7hm1gI17e0" output');
        console.log('    $ youtube download "https://www.youtube.com/watch?v=D7hm1gI17e0" output');
        console.log('');
      });
    }
  }, {
    key: 'showHelp',
    value: function showHelp(msg) {
      if (msg) {
        console.error('Error: ' + msg);
      }
      return this.params.outputHelp();
    }
  }, {
    key: 'parseParams',
    value: function parseParams(params) {
      var program = _commander2.default;

      this.addHelp(program);
      return program.command('download [codes]').alias(' dl').version(version).description('Download a youtube videoin an audio format').parse(params);
    }
  }, {
    key: 'ensureFolderSync',
    value: function ensureFolderSync(outputFolder) {
      if (!_fs2.default.existsSync(outputFolder)) {
        _fs2.default.mkdirSync(outputFolder);
      }
    }
  }, {
    key: 'process',
    value: function process(params) {
      this.params = this.parseParams(params);

      if (this.params.args.length < 3) {
        return this.showHelp('Wrong number of arguments');
      }

      this.command = this.params.args[0];
      this.list = this.params.args[1].split(this.DELIMITER);
      this.outputFolder = this.params.args[2];

      this.ensureFolderSync(this.outputFolder);

      switch (this.command) {
        case 'download':
          return this.downloadMultiple(this.list, this.outputFolder);
        default:
          return this.showHelp('Unknown command');
      }
    }
  }, {
    key: 'downloadMultiple',
    value: function downloadMultiple(list, output) {
      var _this = this;

      return _bluebird2.default.map(list, function (item) {
        return _this.download(item, output);
      }, { concurrency: this.CONCURRENCY });
    }
  }, {
    key: 'getFilePath',
    value: function getFilePath(output, name) {
      return _path2.default.join(output, name);
    }
  }, {
    key: 'download',
    value: function download(code, output) {
      var _this2 = this;

      return this.getName(code).then(function (name) {
        return _this2.saveRemote(code, name, _this2.getFilePath(output, name));
      });
    }
  }, {
    key: 'saveRemote',
    value: function saveRemote(code, name) {
      var _this3 = this;

      console.log('Downloading "%s" with name "%s"', code, name);
      var opts = ['-x', '--audio-format', 'mp3'];
      var opts2 = { cwd: this.outputFolder };

      return new _bluebird2.default(function (resolve, reject) {
        return _youtubeDl2.default.exec(_this3.YOUTUBE + code, opts, opts2, function (err, output) {
          return err ? reject(err) : resolve(output);
        });
      });
    }
  }, {
    key: 'escapeName',
    value: function escapeName(name) {
      return _lodash2.default.deburr(name);
    }
  }, {
    key: 'getName',
    value: function getName(code) {
      var _this4 = this;

      var options = {
        uri: this.YOUTUBE + code,
        transform: function transform(body) {
          return _cheerio2.default.load(body);
        }
      };

      return (0, _requestPromise2.default)(options).catch(function (err) {
        return _bluebird2.default.reject('Unable to download name: ' + err.toString());
      }).then(function ($) {
        return _bluebird2.default.resolve(_this4.escapeName($('title').text().replace(' - YouTube', '')));
      });
    }
  }]);

  return YoutubeCli;
}();

exports.default = YoutubeCli;