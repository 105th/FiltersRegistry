/**
 * This script cleans and restores filters by adding the last 'Diff-Path' value
 * from the old filter to the corresponding new filter files.
 *
 * @file
 */

const fs = require('fs');
const path = require('path');

const FOLDER_WITH_NEW_FILTERS = 'platforms';
const FOLDER_WITH_OLD_FILTERS = 'temp/platforms';
const DIFF_PATH_TAG_NAME = '! Diff-Path: ';

/**
 * Recursively finds all *.txt files in the specified directory and its subdirectories.
 *
 * @param {string} dir - The directory to search for *.txt files.
 *
 * @returns {string[]} - An array of file paths to *.txt files.
 */
const findFilters = (dir) => {
    const filters = [];
    const files = fs.readdirSync(dir);

    for (let i = 0; i < files.length; i += 1) {
        const file = files[i];

        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            filters.push(...findFilters(filePath));
        } else if (file.endsWith('.txt') && path.dirname(filePath).includes('filters')) {
            filters.push(filePath);
        }
    }

    return filters;
};

/**
 * Cleans and restores filters by adding the last 'Diff-Path' value from the old filter.
 */
const cleanFilters = async () => {
    // Recursively find all *.txt files in all 'filters/' folders inside FOLDER_WITH_NEW_FILTERS
    const allFilters = findFilters(FOLDER_WITH_NEW_FILTERS);

    await Promise.allSettled(allFilters.map(async (newFilter) => {
        // Check if the file exists
        if (!fs.existsSync(newFilter)) {
            return;
        }

        const oldFilter = path.join(
            FOLDER_WITH_OLD_FILTERS,
            newFilter.replace(`${FOLDER_WITH_NEW_FILTERS}/`, '')
        );

        // Read the content of the old and new filter files
        const oldFilterContent = await fs.promises.readFile(oldFilter, { encoding: 'utf-8' });
        const newFilterContent = await fs.promises.readFile(newFilter, { encoding: 'utf-8' });

        // Determine the line ending character (CR+LF or LF) in the old filter
        const endOfFile = /\r\n$/gm.test(oldFilterContent) ? '\r\n' : '\n';

        // Split the filter contents into arrays of lines
        const oldFilterLines = oldFilterContent.split(endOfFile);
        const newFilterLines = newFilterContent.split(endOfFile);

        // Find the index of the 'Diff-Path' line in the old filter
        const previousDiffPathLineIndex = oldFilterLines
            .findIndex((str) => str.startsWith(DIFF_PATH_TAG_NAME));

        // If the 'Diff-Path' line doesn't exist in the old filter, skip this filter.
        if (previousDiffPathLineIndex === -1) {
            // eslint-disable-next-line no-console
            console.log(`${newFilter} skipped`);
            return;
        }

        // If the new filter already contains the previous 'Diff-Path' line, skip this filter.
        if (newFilterLines.includes(oldFilterLines[previousDiffPathLineIndex])) {
            // eslint-disable-next-line no-console
            console.log(`${newFilter} skipped`);
            return;
        }

        // Insert the previous 'Diff-Path' line into the new filter
        newFilterLines.splice(
            previousDiffPathLineIndex,
            0,
            oldFilterLines[previousDiffPathLineIndex]
        );

        // Write the updated new filter content back to the file
        await fs.promises.writeFile(
            newFilter,
            newFilterLines.join(endOfFile)
        );
    }));
};

// Execute the cleanFilters function
cleanFilters();
