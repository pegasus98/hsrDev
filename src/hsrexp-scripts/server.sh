#! /bin/bash

set -e

/etc/init.d/nginx start


PID_LIST=
while true; do
  DATE=$(nc -l 23333)
  python -c "__import__('datetime').datetime.strptime('$DATE', '%Y-%m-%dT%H:%M:%S')"
  mkdir -p logs/$DATE

  if [[ ! -z "$PID_LIST" ]]; then
    echo "Stopping previous mpc server and logging..."
    kill $PID_LIST || true
    wait $PID_LIST || true
  fi

  echo "Starting mpc server and logging at $DATE..."
  tcpdump -s 100 -w logs/$DATE/x.pcap tcp port 80 or tcp port 8333 &
  PID_LIST="$!"
  python pensieve/rl_server/robust_mpc_server2.py $DATE &
  PID_LIST="$PID_LIST $!"
done

{ cd ~/pensieve/rl_server; python robust_mpc_server2.py `date +%Y-%m-%dT%H:%M:%S`; } &

wait
