#! /bin/bash
cd "$(dirname $(readlink -f $0))"
cat ./logs/$1/*.dlog > ./logs/$1/log.qmdl
rename -n 's/.dlog/.qmdl/' *
