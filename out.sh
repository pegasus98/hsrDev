#! /bin/bash
cd "$(dirname $(readlink -f $0))"
if [ ! -d ./logs/$1/out ];then
	mkdir $(dirname $(readlink -f $0))/logs/$1/out
fi
mergecap ./logs/$1/pcap/* -w ./logs/$1/out/l3.pcap
cat ./logs/$1/*.dlog > ./logs/$1/out/log.qmdl
