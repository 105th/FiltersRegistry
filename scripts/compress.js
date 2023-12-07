const simpleGit = require('simple-git');

const COMMITS_TO_KEEP = 35;

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

    // Step 1: Checkout to the 10000th commit and save its hash
    await git.checkout(`HEAD~${COMMITS_TO_KEEP}`);
    const squashedCommitHash = await git.raw([
        'rev-parse',
        'HEAD',
    ]);
    console.log(`Step 1: Checked out to commit ${squashedCommitHash.trim()}`);

    // Step 2: Create a new branch named 'squashed'
    await git.checkoutBranch('squashed', squashedCommitHash.trim());
    console.log('Step 2: Created branch "squashed"');

    // Step 3: Get the hash of the very first commit
    const firstCommitHash = await git.raw([
        'rev-list',
        '--max-parents=0',
        'HEAD',
    ]);
    console.log(`Step 3: Retrieved hash of the first commit: ${firstCommitHash.trim()}`);

    // Step 4: Drop all directories to the very first commit
    await git.reset(firstCommitHash.trim());
    console.log('Step 4: Dropped all directories to the first commit');

    // Step 5: Add everything to the index
    await git.add('.');
    console.log('Step 5: Added all changes to the index');

    // Step 6: Create a commit for squashed history
    await git.commit(`squashed history from ${firstCommitHash.trim()} to ${squashedCommitHash.trim()}`);
    // eslint-disable-next-line max-len
    console.log(`Step 6: Created commit for squashed history from ${firstCommitHash.trim()} to ${squashedCommitHash.trim()}`);

    // Step 7: Cherry-pick the commits you want to store
    // Use the `log` method with a range specification to get the commit history
    const historyToSave = await git.log({
        from: `master~${COMMITS_TO_KEEP}`,
        to: 'master',
    });
    const commits = historyToSave.all.reverse();
    for (let i = 0; i < commits.length; i += 1) {
        const { hash } = commits[i];

        try {
            // Use git cherry-pick command for each commit to cherry-pick
            // eslint-disable-next-line no-await-in-loop
            await git.raw(['cherry-pick', hash]);
            console.debug(`Step 7: Cherry-picked commit ${hash}`);
        } catch (e) {
            if (e.message.includes('is a merge but no -m option was given')) {
                // Use git cherry-pick command for each commit to cherry-pick
                // eslint-disable-next-line no-await-in-loop
                await git.raw(['cherry-pick', '-m 1', hash]);
                console.debug(`Step 7: Cherry-picked merge commit ${hash}`);
            } else {
                throw e;
            }
        }
    }

    // Step 8: Return to the 'master' branch
    await git.checkout('master');
    console.log('Step 8: Returned to the "master" branch');

    // Step 9: Reset 'master' to our new rebased 'master'
    await git.reset(['--hard', 'squashed']);
    console.log('Step 9: Reset "master" to the new rebased "master"');

    // Step 10: Push with --force to overwrite the remote 'master' branch
    await git.push(['--force', 'master']);
    console.log('Step 10: Pushed with --force to overwrite the remote "master" branch');

    // Step 11: Clean space with aggressive garbage collection
    await git.raw(['gc', '--aggressive']);
    console.log('Step 11: Cleaned space with aggressive garbage collection');

    console.log('Git actions completed successfully.');
}

// Execute the squashAndPush function
squashAndPush();
