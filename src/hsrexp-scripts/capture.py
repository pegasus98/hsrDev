import subprocess
import os
import signal
import traceback

def adb_shell_create(device):
    assert sum(1 for _ in filter(
            lambda x:
                not x.islower() and not x.isdigit(),
            device
        )) == 0

    return subprocess.Popen(
            f'adb -s {device} shell',
            shell=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

def capture_start(device, identifier):
    assert len(identifier) > 0
    assert sum(1 for _ in filter(
            lambda x:
                not x.isdigit() and
                    x not in [ 'T', ':', '.', '-', ],
            identifier
        )) == 0

    shell_mkdir = adb_shell_create(device)
    stdout, stderr = shell_mkdir.communicate(
            b'su\n'
            b'pkill diag\n' +
            f'mkdir -p /cache/log/{identifier}\n'.encode()
        )
    assert stdout == b'' and stderr == b''
    assert shell_mkdir.returncode == 0

    shell_tcp = adb_shell_create(device)
    shell_diag = adb_shell_create(device)

    shell_tcp.stdin.write(
            b'su\n'
            b'/cache/tcpdump'
                b' -i `ip route show | tail -2 | grep -oh -m 1 "rmnet_data[0-9]"`'
                b' -s 96' +
                f' -w /cache/log/{identifier}/l3.pcap\n'.encode()
        )
    shell_tcp.stdin.close()

    shell_diag.stdin.write(
            b'su\n'
            b'/cache/diag_logcat'
                b' /cache/Diag-5G.cfg' +
                f' /cache/log/{identifier}/l2'.encode() +
                f' /cache/log/{identifier}/l2\n'.encode()
        )
    shell_diag.stdin.close()

    output = shell_tcp.stderr.readline()
    assert output.startswith(b'tcpdump: listening on rmnet_data')
    assert output.endswith(b', link-type LINUX_SLL (Linux cooked v1), snapshot length 96 bytes\n')

    output = shell_diag.stdout.readline()
    assert output == b'[WARN ] DIAG_IOCTL_PERIPHERAL_BUF_CONFIG ioctl failed (I/O error)\n'
    output = shell_diag.stdout.readline()
    assert output == b'[INFO ] ioctl DIAG_IOCTL_SWITCH_LOGGING with arglen=24 succeeded\n'

    return shell_tcp, shell_diag

def capture_stop(shell_tcp, shell_diag, device):
    kill_tcpdump = adb_shell_create(device)
    kill_tcpdump_stdout, kill_tcpdump_stderr = kill_tcpdump.communicate(
            b'su\n'
            b'pkill tcpdump\n'
        )

    kill_diagcat = adb_shell_create(device)
    kill_diagcat_stdout, kill_diagcat_stderr = kill_diagcat.communicate(
            b'su\n'
            b'pkill -INT diag_logcat\n'
        )

    assert kill_tcpdump_stdout == b'' and kill_tcpdump_stderr == b''
    assert kill_diagcat_stdout == b'' and kill_diagcat_stderr == b''
    assert kill_tcpdump.returncode == 0
    assert kill_diagcat.returncode == 0

    if shell_tcp is not None:
        output = shell_tcp.stderr.readline()
        assert output.endswith(b' packets captured\n')
        output = shell_tcp.stderr.readline()
        assert output.endswith(b' packets received by filter\n')
        output = shell_tcp.stderr.readline()
        assert output.endswith(b' packets dropped by kernel\n')
        output = shell_tcp.stderr.readline()
        assert output == b''

        shell_tcp.stderr.close()
        shell_tcp.wait()
        assert shell_tcp.returncode == 0

    if shell_diag is not None:
        output = shell_diag.stdout.readline()
        assert output == b''

        shell_diag.stdout.close()
        shell_diag.wait()
        assert shell_diag.returncode == 0

    shell_mv = adb_shell_create(device)
    stdout, stderr = shell_mv.communicate(
            b'su\n'
            b'mv /cache/log/* /sdcard/logs/\n'
        )
    assert stderr == b'' or \
        stderr == b"mv: bad '/cache/log/*': No such file or directory\n"

def main():
    try:
        os.mkfifo('capture.cmd')
    except FileExistsError:
        pass
    cmds = open('capture.cmd', 'r')

    alive_shells = {}

    while True:
        try:
            cmd = cmds.readline()
            if not cmd:
                cmds = open('capture.cmd', 'r')
                continue
        except KeyboardInterrupt:
            break

        print(f'Got command: `{cmd[:-1]}`')

        cmd = cmd.split()
        if not cmd:
            print('\tEmpty command?')
            continue

        def do_stop(devid):
            if devid not in alive_shells:
                print(f'\tLogging not started at device `{devid}`, nothing to stop')
                return False
            shell_tcp, shell_diag = alive_shells[devid]
            try:
                capture_stop(shell_tcp, shell_diag, devid)
            except Exception as e:
                print(f'\tGot exception `{repr(e)}` when trying to stop logging at device `{devid}`')
                traceback.print_exc()
                return False
            print(f'\tLogging successfully stopped at device `{devid}`')
            del alive_shells[devid]
            return True

        def do_start(devid, logid):
            if devid in alive_shells:
                print(f'\tLogging already started at device `{devid}`, trying to stop first...')
                do_stop(devid)
            try:
                shell_tcp, shell_diag = capture_start(devid, logid)
            except Exception as e:
                print(f'\tGot exception `{repr(e)}` when trying to start logging at device `{devid}`')
                traceback.print_exc()
                return False
            print(f'\tLogging successfully started at device `{devid}`')
            alive_shells[devid] = shell_tcp, shell_diag
            return True

        if cmd[0] == 'start':
            if len(cmd) != 3:
                print('\tInvalid command, usage: `start [dev-id] [log-id]`')
                continue
            do_start(cmd[1], cmd[2])
        elif cmd[0] == 'stop':
            if len(cmd) != 2:
                print('\tInvalid command, usage: `stop [dev-id]`')
                continue
            do_stop(cmd[1])
        else:
            print(f'\tUnknown command `{cmd[0]}`')

if __name__ == '__main__':
    main()
