var async = require('async');
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var youtubedl = require('youtube-dl');
const spawn = require('child_process').spawn;

var convertEnabled = true;
const _YOUTUBE_BASE = "https://www.youtube.com/watch?v=";
const _OUTPUT_DIR = "downloads/";
const _MP3_DIR = "mp3/";

var list = "cdmGbGQQF6k,y4s8_724hMg,D7hm1gI17e0,lZgSdPlRupw,yAUNb4RrGho,Fiq-AC934V4,2iMKnzFDCL4,o9Kzrg2hTUs,j_soB-KIbzQ,dLhFDYQHDQY,76RbWuFll0Y,QjN27z_Oc6E,QR4Hjx7-QKw,PC5sIeQaD0E,6mWyhOBNDyg,Q2DovrqfQ-0,TLvzz1ePBjQ".split(",");

function finished(err, res) {
	if(err) throw err;

	console.log('Finished with result', res);
}

function convertToMp3(input, name, done) {
	console.log('Converting %s to mp3 in folder %s', name, _MP3_DIR);
	const ffmpeg = spawn('ffmpeg', ['-i', input, _MP3_DIR+name+'.mp3']);

	ffmpeg.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	ffmpeg.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});

	ffmpeg.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
		done(null)
	});
}

function downloadVideo(code, name, done) {
	var output = _OUTPUT_DIR+name+'.mp4'
	console.log('Downloading %s with name %s to file %s', code, name, output);

	var video = youtubedl(_YOUTUBE_BASE+code,
		['--extract-audio', '--audio-format', "mp3"], {}, console.log
	)

	video.on('error', console.error)

	video.on('info', function(info) {
		console.log('Download started');
		console.log('filename: ' + info._filename);
		console.log('size: ' + info.size);
	});

	video.pipe(fs.createWriteStream(output));

	video.on('end', function() {
		console.log('finished downloading of %s', output);
		if(convertEnabled)
			convertToMp3(output, name, done);
		else
			return done(null)

	});
}

function download(code, done) {

	console.log('Downloading ', code);
	request(_YOUTUBE_BASE+code, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			$ = cheerio.load(body);
			var name = $('title').text().replace(' - YouTube', '');
			console.log('Parsed name for code %s:', code, name);

			downloadVideo(code, name, done)
		} else {
			console.error('ERROR: Cannot load page for code:', code);
			done(error)
		}
	});
}



if (!fs.existsSync(_OUTPUT_DIR)){
	fs.mkdirSync(_OUTPUT_DIR);
}

if (!fs.existsSync(_MP3_DIR)){
	fs.mkdirSync(_MP3_DIR);
}

async.mapLimit(list, 2, download, finished);