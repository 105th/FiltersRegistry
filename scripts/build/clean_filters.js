/**
 * This script cleans and restores filters by adding the last 'Diff-Path' value
 * from the old filter to the corresponding new filter files.
 *
 * @file
 */

const fs = require('fs');
const path = require('path');

const { findFiles } = require('../utils/find_files');
const {
    FOLDER_WITH_NEW_FILTERS,
    FOLDER_WITH_OLD_FILTERS,
} = require('./constants');

const DIFF_PATH_TAG_NAME = '! Diff-Path: ';

/**
 * Cleans and restores filters by adding the last 'Diff-Path' value from the old filter.
 */
const cleanFilters = async () => {
    // Recursively find all *.txt files in all 'filters/' folders inside FOLDER_WITH_NEW_FILTERS
    const allFilters = await findFiles(
        FOLDER_WITH_NEW_FILTERS,
        (filePath) => filePath.endsWith('.txt') && filePath.includes('filters/')
    );

    await Promise.allSettled(allFilters.map(async (newFilter) => {
        const oldFilter = path.join(
            FOLDER_WITH_OLD_FILTERS,
            newFilter.replace(`${FOLDER_WITH_NEW_FILTERS}/`, '')
        );

        // Read the content of the old and new filter files
        const oldFilterContent = await fs.promises.readFile(oldFilter, { encoding: 'utf-8' });
        const newFilterContent = await fs.promises.readFile(newFilter, { encoding: 'utf-8' });

        // Split the filter contents into arrays of lines
        // It will save end of lines inside splitted strings.
        const oldFilterLines = oldFilterContent.split(/(?<=\r?\n)/);
        const newFilterLines = newFilterContent.split(/(?<=\r?\n)/);

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
            newFilterLines.join('')
        );
    }));
};

// Execute the cleanFilters function
cleanFilters();
