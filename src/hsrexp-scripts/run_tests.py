import subprocess

ANDROID_DEVICES = [
        '6ff7694',
        '85869c2d',
        '849f4d4a',
    ]

def main():
    tests = []

    for device in ANDROID_DEVICES:
        test = subprocess.Popen(['python3', 'video_test.py', device])
        tests.append(test)

    while True:
        try:
            for test in tests:
                test.wait()
            break
        except KeyboardInterrupt:
            pass

if __name__ == '__main__':
    main()
