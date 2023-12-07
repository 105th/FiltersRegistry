set -x -e

FOLDER_WITH_NEW_FILTERS="platforms"
FOLDER_WITH_OLD_FILTERS="temp/plaftorms"

# Iterate over all *.txt files in all 'filters/' folders inside $FOLDER_WITH_NEW_FILTERS
all_filters=$(find platforms -type d -name filters -exec find {} -type f -name "*.txt" \;)

for new_filter in $all_filters; do
    # Check if file exists
    if [ -e "$new_filter" ]; then
        path_to_file=$(echo "$new_filter" | sed 's/^[^/]*\///')
        old_filter="$FOLDER_WITH_OLD_FILTERS/$path_to_file"

        new_filters=$(dirname "$new_filter")
        basename=$(basename "$new_filter" .txt)
        parent_dir=$(dirname "$new_filters")

        path_to_patches="$parent_dir/patches/$basename"

        # Generate patches
        # TODO: 1 hour for our filters and 3 hour for external filters
        npx diff-builder build --name $basename --resolution h --time 1 --verbose $old_filter $new_filter $path_to_patches
    fi
done

# Clear temprorary copied platforms
rm -r $FOLDER_WITH_OLD_FILTERS
