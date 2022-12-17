const { app, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const si = require('systeminformation');
const fs = require('fs');
const Speaker = require('speaker');

// Read the audio file into a buffer
const fileBufferSpinning = fs.readFileSync(path.join(__dirname, 'assets', 'spinning.pcm'));
const fileBufferWorking = fs.readFileSync(path.join(__dirname, 'assets', 'working.pcm'));

let streamWorking = new Speaker({
	channels: 2,
	bitDepth: 16,
	sampleRate: 44100
});

let tray = null;
let previousFsSize = null;

app.whenReady().then(async () => {

	let thumbnail;

	if (process.platform === 'darwin') {

		// hide the dock icon
		app.dock.hide();

		// make tray icon thumbnail for macos
		thumbnail = await nativeImage.createThumbnailFromPath(path.join(__dirname, 'assets', 'icon.png'), {
			width: 16,
			height: 16
		});
	}
	else if (process.platform === 'linux') {

		// make tray icon thumbnail for linux
		thumbnail = await nativeImage.createThumbnailFromPath(path.join(__dirname, 'assets', 'icon.png'), {
			width: 22,
			height: 22
		});
	}
	else {

		// hide the taskbar icon
		win.setSkipTaskbar(true);
	
		// make tray icon thumbnail for windows
		thumbnail = await nativeImage.createThumbnailFromPath(path.join(__dirname, 'assets', 'icon.png'), {
			width: 16,
			height: 16
		});
	}

	tray = new Tray(thumbnail);

	const contextMenu = Menu.buildFromTemplate([{
		label: 'Quit',
		type: 'normal',
		role: 'quit',
		click: () => {
			app.quit();
		}
	}]);

	tray.setContextMenu(contextMenu);
	tray.setToolTip('HDD-Sound');

	// Create a write stream for the audio data
	const streamSpinning = new Speaker({
		channels: 2,
		bitDepth: 16,
		sampleRate: 44100
	});

	const checkForChanges = () => {

		// get information about the file system
		si.fsSize((fsSize) => {

			// check for changes
			if (previousFsSize && JSON.stringify(fsSize) !== JSON.stringify(previousFsSize)) {

				streamWorking = null;

				streamWorking = new Speaker({
					channels: 2,
					bitDepth: 16,
					sampleRate: 44100
				});

				// Write the audio data to the stream
				streamWorking.write(fileBufferWorking);
			}
			else {

				streamWorking = null;

				// Write the audio data to the stream
				streamSpinning.write(fileBufferSpinning);
			}

			previousFsSize = fsSize;
		})
	}

	setInterval(checkForChanges, 500);
});