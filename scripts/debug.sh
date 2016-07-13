#!/usr/bin/env bash
# start this script first and then node-debug

./node_modules/.bin/mocha  --debug-brk  --debug=5858 $1
