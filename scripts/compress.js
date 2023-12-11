/* eslint-disable no-console */
const simpleGit = require('simple-git');

const COMMITS_TO_KEEP = 10000;

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

    // Step 1: Checkout to the COMMITS_TO_KEEP'th commit and save its hash
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
    await git.reset(['--mixed', firstCommitHash.trim()]);
    console.log('Step 4: Dropped all directories to the first commit');

    // Step 5: Add everything to the index
    await git.add('.');
    console.log('Step 5: Added all changes to the index');

    // Extract date from commit with squashed history
    const { date: squashedCommitDate } = await git.log({
        from: squashedCommitHash,
        to: `${squashedCommitHash}~1`,
    });
    // Use this date to keep history linear for commit with squashed history
    git.env('GIT_COMMITTER_DATE', squashedCommitDate);

    // Step 6: Create a commit for squashed history
    await git.commit(`squashed history from ${firstCommitHash.trim()} to ${squashedCommitHash.trim()}`);
    // eslint-disable-next-line max-len
    console.log(`Step 6: Created commit for squashed history from ${firstCommitHash.trim()} to ${squashedCommitHash.trim()}`);

    // Step 7: Cherry-pick the commits you want to store
    // Use the `log` method with a range specification to get the commit history
    const historyToSave = await git.log({
        from: `master~${COMMITS_TO_KEEP}`,
        to: 'master',
        '--no-merges': true,
    });
    const commits = historyToSave.all.reverse();
    for (let i = 0; i < commits.length; i += 1) {
        const {
            hash,
            date,
            author_name: authorName,
            author_email: authorEmail,
        } = commits[i];

        /* eslint-disable no-await-in-loop */
        // Save original author.
        await git.addConfig('user.name', authorName);
        await git.addConfig('user.email', authorEmail);

        // Save original commit date.
        git.env('GIT_COMMITTER_DATE', date);

        // Use git cherry-pick command for each commit to cherry-pick.
        await git.raw(['cherry-pick', hash, '--strategy-option', 'theirs']);
        console.debug(`Cherry-picked commit#${i} ${hash}`);
        /* eslint-enable no-await-in-loop */
    }

    // Step 8: Return to the 'master' branch
    await git.checkout('master');
    console.log('Step 8: Returned to the "master" branch');

    // Step 9: Reset 'master' to our new rebased 'master'
    await git.reset(['--hard', 'squashed']);
    console.log('Step 9: Reset "master" to the new rebased "master"');

    // Step 10: Push with --force to overwrite the remote 'master' branch
    await git.addConfig('user.name', 'Dmitrii Seregin');
    await git.addConfig('user.email', '105th@users.noreply.github.com');
    await git.push(['--set-upstream', 'origin', '--force', 'master']);
    console.log('Step 10: Pushed with --force to overwrite the remote "master" branch');

    // Step 11: Clean space with aggressive garbage collection
    await git.raw(['gc', '--aggressive']);
    console.log('Step 11: Cleaned space with aggressive garbage collection');

    console.log('Git actions completed successfully.');
}

// Execute the squashAndPush function
squashAndPush();
