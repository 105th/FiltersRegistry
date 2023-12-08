/* eslint-disable no-console */
const simpleGit = require('simple-git');

const COMMITS_TO_KEEP = 9000;

/**
 * Cherry-pick a merge commit with the given hash.
 *
 * @async
 * @param {simpleGit.SimpleGit} git - The simple-git instance.
 * @param {string} hash - The hash of the merge commit to cherry-pick.
 * @param {number} i - The index of the commit (for debugging/logging purposes).
 * @param {number} [mainline=1] - The mainline number for the cherry-pick (default is 1).
 * @returns {Promise<void>} - A promise that resolves when cherry-picking is complete.
 */
async function cherryPickMergeCommit(git, hash, i, mainline = 1) {
    try {
        // Use git cherry-pick command with the specified mainline for merge commits.
        await git.raw(['cherry-pick', `--mainline=${mainline}`, hash]);
        console.debug(`Cherry-picked merge commit#${i} ${hash}`);
    } catch (e) {
        if (e.message.includes('nothing to commit, working tree clean')
            && e.message.includes('git commit --allow-empty')) {
            await git.raw(['cherry-pick', '--skip']);
            console.debug(`Skipped empty commit ${hash}`);
        } else if (e.message.includes('is a merge but no -m option was given')) {
            await cherryPickMergeCommit(git, hash, i, 2);
        } else {
            // Re-throw error.
            throw e;
        }
    }
}

/**
 * Cherry-pick a regular commit with original author and date.
 *
 * @async
 * @param {simpleGit.SimpleGit} git - The simple-git instance.
 * @param {string} hash - The hash of the commit to cherry-pick.
 * @param {string} date - The original commit date.
 * @param {string} authorName - The original author's name.
 * @param {string} authorEmail - The original author's email.
 * @param {number} i - The index of the commit (for debugging/logging purposes).
 * @returns {Promise<void>} - A promise that resolves when cherry-picking is complete.
 */
async function cherryPickCommit(git, hash, date, authorName, authorEmail, i) {
    try {
        // Save original author.
        await git.addConfig('user.name', authorName);
        await git.addConfig('user.email', authorEmail);

        // Save original commit date.
        git.env('GIT_COMMITTER_DATE', date);

        // Use git cherry-pick command for each commit to cherry-pick.
        await git.raw(['cherry-pick', hash]);
        console.debug(`Cherry-picked commit#${i} ${hash}`);
    } catch (e) {
        if (e.message.includes('is a merge but no -m option was given')) {
            await cherryPickMergeCommit(git, hash, i);
        } else {
            // Re-throw error.
            throw e;
        }
    }
}

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
        const {
            hash,
            date,
            author_name: authorName,
            author_email: authorEmail,
        } = commits[i];

        // eslint-disable-next-line no-await-in-loop
        await cherryPickCommit(git, hash, date, authorName, authorEmail, i);

        // FIXME: DEBUG MODE
        if (hash === 'ea957bb2df4a0fa500ea5d48285bb57b9613ecd0') {
            /* eslint-disable no-await-in-loop */
            await git.addConfig('user.name', 'Dmitrii Seregin');
            await git.addConfig('user.email', '105th@users.noreply.github.com');
            await git.push(['--set-upstream', 'origin', '--force', 'squashed']);
            /* eslint-enable no-await-in-loop */

            return;
        }
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
