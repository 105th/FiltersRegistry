const simpleGit = require('simple-git');

const COMMITS_TO_KEEP = 10;

/**
 * Git script to squash history and push changes.
 *
 * @async
 * @function squashAndPush
 *
 * @returns {Promise<void>} - A promise that resolves when the process is complete.
 */
async function squashAndPush() {
    const git = simpleGit();

    // Step 1: Checkout to the 10000th commit and save it's hash
    await git.checkout(`HEAD~${COMMITS_TO_KEEP}`);
    const squashedCommitHash = await git.raw([
        'rev-parse',
        'HEAD',
    ]);

    // Step 2: Create a new branch named 'squashed'
    await git.checkoutBranch('squashed', squashedCommitHash);

    // Step 3: Get hash of very first commit
    const firstCommitHash = await git.raw([
        'rev-list',
        '--max-parents=0',
        'HEAD',
    ]);

    // Step 4: Drop all directories to very first commit
    await git.reset(firstCommitHash.trim());

    // Step 5: Add everything to the index
    await git.add('.');

    // Step 6: Create a commit for squashed history
    await git.commit(`squashed history from ${firstCommitHash} to ${squashedCommitHash}`);

    // Step 7: Cherry-pick the commits you want to store
    // Use the `log` method with a range specification to get the commit history
    const historyToSave = await git.log({
        from: `master~${COMMITS_TO_KEEP}`,
        to: 'master',
    });
    const commits = historyToSave.reverse().all;
    for (let i = 0; i < commits.length; i += 1) {
        const { hash } = commits[i];

        // Use git cherry-pick command for each commit to cherry-pick
        // eslint-disable-next-line no-await-in-loop
        await git.raw(['cherry-pick', hash]);
    }

    // Step 8: Return to the 'master' branch
    await git.checkout('master');

    // Step 9: Reset 'master' to our new rebased 'master'
    await git.reset(['--hard', 'squashed']);

    // Step 10: Push with --force to overwrite the remote 'master' branch
    await git.push(['--force', 'master']);

    // Step 11: Clean space with aggressive garbage collection
    await git.raw(['gc', '--aggressive']);

    console.log('Git actions completed successfully.');
}

// Execute the squashAndPush function
squashAndPush();
