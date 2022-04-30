#! /bin/bash

IPERF3=iperf-3.9/src/iperf3
QUIC_SERVER=quic/lsquic/build/bin/perf_server
QUIC_CLIENT=quic/lsquic/build/bin/perf_client

BBR_PORT=9999
UDP_PORT=6666
QUIC_PORT=2333

BBR_CTRL_PORT=10001
QUIC_CTRL_PORT=10003

if [ -f "helpers/android-config.sh" ]; then
  source helpers/android-config.sh
fi
