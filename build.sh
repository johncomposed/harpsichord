#!/bin/sh

rm www/*                                         # Just making sure it's clear
harp compile harp/ www/ &                        # Compile harp
build_pid=$!                                     # Grabbing pid of harp process 
wait $build_pid                                  # Waiting until harp's compiled
ls www/*                                         # Making sure there's stuff in www
git add -A && git commit -m 'Updated site'       # Commit and update
echo "Harp compiled, pushing to subtree"         # Notifiying user
git push
#git subtree push --prefix www origin gh-pages    # Pushing compiled site to gh-pages

