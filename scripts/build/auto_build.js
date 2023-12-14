const { buildFilters } = require('./build');

const ADGUARD_FILTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 224];

const MODES = Object.freeze({
    all: 'all',
    ours: 'ours',
});

let mode = '';

const args = process.argv.slice(2);
args.forEach((arg) => {
    if (arg.startsWith('--mode=')) {
        mode = arg.slice('--mode='.length);
    }
});

switch (mode) {
case MODES.all:
    buildFilters();
    break;
case MODES.ours:
    buildFilters(ADGUARD_FILTERS);
    break;
default:
    throw new Error('Unrecognized mode of work');
}
