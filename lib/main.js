import _ from 'lodash';
import commander from 'commander';
import path from 'path';
import Promise from 'bluebird';
import fs from 'fs';
import cheerio from 'cheerio';
import rp from 'request-promise';
import youtubedl from 'youtube-dl';

const version = require('../package.json').version;

export default class YoutubeCli {
  constructor() {
    this.YOUTUBE = 'https://www.youtube.com/watch?v=';
    this.DELIMITER = ',';
    this.CONCURRENCY = 1;
  }

  addHelp(program) {
    program.usage('youtube download [youtube codes, ...] outputFolder');
    program.on('--help', () => {
      console.log('  Examples:');
      console.log('');
      console.log('    $ youtube download youtube,codes,delimited,by,comma output');
      console.log('    $ youtube download "hN_q-_nGv4U,D7hm1gI17e0" output');
      console.log('    $ youtube download "https://www.youtube.com/watch?v=D7hm1gI17e0" output');
      console.log('');
    });
  }

  showHelp(msg) {
    if (msg) {
      console.error(`Error: ${msg}`);
    }
    return this.params.outputHelp();
  }

  parseParams(params) {
    const program = commander;

    this.addHelp(program);
    return program
      .command('download [codes]')
      .alias(' dl')
      .version(version)
      .description('Download a youtube videoin an audio format')
      .parse(params);
  }

  ensureFolderSync(outputFolder) {
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }
  }

  process(params) {
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

  downloadMultiple(list, output) {
    return Promise.map(list,
      item => this.download(item, output)
      , { concurrency: this.CONCURRENCY }
    );
  }

  getFilePath(output, name) {
    return path.join(output, name);
  }

  download(code, output) {
    return this.getName(code)
      .then(name =>
        this.saveRemote(code, name, this.getFilePath(output, name))
      );
  }

  saveRemote(code, name) {
    console.log('Downloading "%s" with name "%s"', code, name);
    const opts = ['-x', '--audio-format', 'mp3'];
    const opts2 = { cwd: this.outputFolder };

    return new Promise((resolve, reject) =>
      youtubedl.exec(
        this.YOUTUBE + code, opts, opts2,
        (err, output) => (err ? reject(err) : resolve(output))
      )
    );
  }

  escapeName(name) {
    return _.deburr(name);
  }

  getName(code) {
    const options = {
      uri: this.YOUTUBE + code,
      transform: body => cheerio.load(body),
    };

    return rp(options)
      .catch(err => Promise.reject(`Unable to download name: ${err.toString()}`))
      .then($ =>
        Promise.resolve(this.escapeName($('title').text().replace(' - YouTube', '')))
      );
  }
}
