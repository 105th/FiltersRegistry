#!/bin/bash
set -e

# This script checks for changes in filters, and if there are none, it restores
# the filter to the previous version with the last 'Diff-Path' value (which may
# have been overwritten during the FiltersCompiler execution).

FOLDER_WITH_NEW_FILTERS="platforms"
FOLDER_WITH_OLD_FILTERS="temp/platforms"

# Iterate over all *.txt files in all 'filters/' folders inside $FOLDER_WITH_NEW_FILTERS
all_filters=$(find $FOLDER_WITH_NEW_FILTERS -type d -name filters -exec find {} -type f -name "*.txt" \;)

for new_filter in $all_filters; do
    printf '\n'
    # Check if file exists
    if [ -e "$new_filter" ]; then
        path_to_file=$(echo "$new_filter" | sed 's/^[^/]*\///')
        old_filter="$FOLDER_WITH_OLD_FILTERS/$path_to_file"

        echo $new_filter
        echo $old_filter

        # Disable strict error mode (set +e) to allow the script to continue
        # without crashing. The 'diff' command returns 1 if differences are found,
        # and since 1 is the error code, Bash would normally exit with an error.
        set +e

        # Calculate the difference between files and store it in the "difference" variable.
        difference=$(diff -n "$old_filter" "$new_filter")

        # Enable strict error mode (set -e) again to return to error handling.
        set -e

        # Count lines in string
        line_count=$(echo "$difference" | wc -l)

        # condition1="[ $line_count -eq 1 ]"
        # condition2="[[ \"$difference\" == *\"Diff-Path\"* ]]"
        # echo "Значение переменной difference: '$difference'"
        # echo "Значение переменной line_count: $line_count"
        # eval "$condition1" && printf "Результат проверки condition1: true\n" || printf "Результат проверки condition1: false\n"
        # eval "$condition2" && printf "Результат проверки condition2: true\n" || printf "Результат проверки condition2: false\n"

        # If diff is empty or diff contains only one string with "Diff-Path"
        if [[ "$line_count" -eq 1 && "$difference" == *"Diff-Path"* ]]
        then
            cp "$old_filter" "$new_filter"
            echo "Undo deleting "Diff-Path" in $new_filter"
        else
            if [[ $difference == '' ]]
            then
                echo "Not found changes in $new_filter"
            else
                echo "Found valuable changes in $new_filter"
            fi
        fi
    fi
done

