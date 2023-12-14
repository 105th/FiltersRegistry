#!/bin/bash

set -x -e

# AdGuard filters
ADGUARD_FILTERS="1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,224"

# Default mode is "all"
MODE="all"

# Loop through command-line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --mode)
            shift
            if [[ "$1" == "all" || "$1" == "ours" ]]; then
                MODE="$1"
            else
                echo "Invalid mode. Use 'all' or 'ours' as the mode."
                exit 1
            fi
            shift
            ;;
        *)
            echo "Invalid argument: $1"
            exit 1
            ;;
    esac
done

echo "Selected mode: $MODE"

if [[ "$MODE" == "all" ]]; then
    yarn build
    # Time live of patches - '4 hours'
    yarn build:patches --time=4 --resolution=h
elif [[ "$MODE" == "ours" ]]; then
    yarn build --include=$ADGUARD_FILTERS
    # Time live of patches - '60 minutes'
    yarn build:patches --time=60 --resolution=m
fi

# Validate platforms and locales
yarn validate

# Update builded platforms, filter in repository
yarn push
