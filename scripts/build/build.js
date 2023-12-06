const fs = require('fs');
const path = require('path');
const compiler = require('adguard-filters-compiler');

const customPlatformsConfig = require('./custom_platforms');
const { formatDate } = require('../utils/strings');

let whitelist = [];
let blacklist = [];

const args = process.argv.slice(2);
args.forEach((val) => {
    if (val.startsWith('-i=')) {
        whitelist = whitelist.concat(val.slice(3).split(',').map((x) => Number.parseInt(x, 10)));
    }

    if (val.startsWith('-s=')) {
        blacklist = blacklist.concat(val.slice(3).split(',').map((x) => Number.parseInt(x, 10)));
    }
});

const filtersDir = path.join(__dirname, '../../filters');
const logPath = path.join(__dirname, '../../log.txt');

let reportPath = path.join(__dirname, '../../report.txt');
if (whitelist.length > 0 || blacklist.length > 0) {
    // report_DD-MM-YYYY_HH-MM-SS.txt
    reportPath = path.join(__dirname, `../../report_${formatDate(new Date())}.txt`);
}

const platformsPath = path.join(__dirname, '../../platforms');
const copyPlatformsPath = path.join(__dirname, '../../temp/platforms');

/**
 * Compiler entry point.
 */
async function main() {
    // Make copy for future patches generation
    await fs.promises.cp(platformsPath, copyPlatformsPath, { recursive: true });

    await compiler.compile(
        filtersDir,
        logPath,
        reportPath,
        platformsPath,
        whitelist,
        blacklist,
        customPlatformsConfig
    );
}

main();
