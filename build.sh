#!/bin/sh

# Check for uncommited files
git ls-files --other --error-unmatch . >/dev/null 2>&1; ec=$? 

if test "$ec" = 0; then
    echo "Uncommited changes, remember to commit with something like: "
    echo "git add -A && git commit -m 'Updated site'"
    
elif test "$ec" = 1; then
    echo "All changes commited, running build"    # Let user know running script's running
    rm www/*                                      # Just making sure it's clear
    harp compile harp/ www/ &                     # Compile harp
    build_pid=$!                                  # Grabbing pid of harp process 
    wait $build_pid                               # Waiting until harp's compiled
    ls www/*                                      # Making sure there's stuff in www
    echo "Harp compiled, pushing to subtree"      # Notifiying user
    git subtree push --prefix www origin gh-pages # Pushing compiled site to gh-pages
fi


