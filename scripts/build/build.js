const fs = require('fs');
const path = require('path');
const compiler = require('adguard-filters-compiler');

const customPlatformsConfig = require('./custom_platforms');
const { formatDate } = require('../utils/strings');

/**
 * Parse command-cli parameters -i|--include and -s|--skip
 */
let whitelist = [];
let blacklist = [];

const args = process.argv.slice(2);
args.forEach((val) => {
    if (val.startsWith('-i=') || val.startsWith('--include=')) {
        const value = val.slice(val.indexOf('=') + 1);

        whitelist = value
            .split(',')
            .map((x) => Number.parseInt(x, 10));
    }

    if (val.startsWith('-s=') || val.startsWith('--skip=')) {
        const value = val.slice(val.indexOf('=') + 1);

        blacklist = value
            .split(',')
            .map((x) => Number.parseInt(x, 10));
    }
});

/**
 * Set all relative paths needed for compiler
 */
const filtersDir = path.join(__dirname, '../../filters');
const logPath = path.join(__dirname, '../../log.txt');
const platformsPath = path.join(__dirname, '../../platforms');
const copyPlatformsPath = path.join(__dirname, '../../temp/platforms');

let reportPath = path.join(__dirname, '../../report.txt');
if (whitelist.length > 0 || blacklist.length > 0) {
    // report_DD-MM-YYYY_HH-MM-SS.txt
    reportPath = path.join(__dirname, `../../report_${formatDate(new Date())}.txt`);
}

/**
 * Compiler entry point.
 */
const buildFilters = async () => {
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
};

buildFilters();
