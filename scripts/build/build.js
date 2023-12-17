const fs = require('fs');
const path = require('path');
const compiler = require('adguard-filters-compiler');

const customPlatformsConfig = require('./custom_platforms');
const { formatDate } = require('../utils/strings');
const {
    FOLDER_WITH_NEW_FILTERS,
    FOLDER_WITH_OLD_FILTERS,
} = require('./constants');

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
const platformsPath = path.join(__dirname, '../..', FOLDER_WITH_NEW_FILTERS);
const copyPlatformsPath = path.join(__dirname, '../..', FOLDER_WITH_OLD_FILTERS);

let reportPath = path.join(__dirname, '../../report.txt');
if (whitelist.length > 0 || blacklist.length > 0) {
    // report_DD-MM-YYYY_HH-MM-SS.txt
    reportPath = path.join(__dirname, `../../report_${formatDate(new Date())}.txt`);
}

/**
 * Compiler entry point.
 */
const buildFilters = async () => {
    // Clean temporary folder
    if (fs.existsSync(copyPlatformsPath)) {
        await fs.promises.rm(copyPlatformsPath, { recursive: true });
    }

    // Checks if this is the initial run of the compiler by verifying
    // the existence of platform files.
    let initialRun = false;
    if (!fs.existsSync(platformsPath)) {
        initialRun = true;
    } else {
        // Make copy for future patches generation
        await fs.promises.cp(platformsPath, copyPlatformsPath, { recursive: true });
    }

    await compiler.compile(
        filtersDir,
        logPath,
        reportPath,
        platformsPath,
        whitelist,
        blacklist,
        customPlatformsConfig
    );

    // For the very first run, we should copy the built platforms into
    // the temp folder to create the first empty patches for future versions
    if (initialRun) {
        // Make copy for future patches generation
        await fs.promises.cp(platformsPath, copyPlatformsPath, { recursive: true });
    }
};

buildFilters();
