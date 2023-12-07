set -x -e

# Push updated filter lists to the repo (without patches).
git status
git add .
git diff-index --quiet HEAD || git commit -m "skip ci. build from $(date)"
git push origin master
