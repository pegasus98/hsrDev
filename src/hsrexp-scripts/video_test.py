from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from pprint import pprint
from datetime import datetime
import time
import sys
import os
import logging
import monkey
import subprocess
import traceback
import random
from filelock import Timeout, FileLock

webdriver.common.service.Service.start = monkey.start

# SERVER_IP = {
#         '6ff7694':  '124.70.62.52',
#         '85869c2d': '139.9.128.124',
#         '849f4d4a': '119.3.189.145',
#     }

SERVER_IP = '114.116.204.243'
SERVER_PATHS = [
        '2/dyn.html', '2/rb.html', '2/bola.html', '2/mpc.html', '2/lolp.html', '2/l2a.html',
    ]

def sleep(duration):
    global quitting

    try:
        time.sleep(duration)
    except KeyboardInterrupt:
        quitting = True
        time.sleep(duration)

def run(url,logpath):
    global options
    global caps
    global quitting
    path = os.path.split(os.path.realpath(sys.argv[0]))[0]
    driver = webdriver.Chrome(path+'./chromedriver.exe',options=options, desired_capabilities=caps,)
    driver.get(url)

    driver.execute_cdp_cmd('Network.setCacheDisabled', { 'cacheDisabled': True })

    wait = WebDriverWait(driver, 10)
    while True:
        try:
            wait.until(lambda driver:
                    driver.execute_script('return document.readyState') == 'complete')
            break
        except KeyboardInterrupt:
            quitting = True
            continue    
        except TimeoutException:
            return { 'msg': 'timeout when loading' }
    sleep(1)
    video = driver.find_element(By.TAG_NAME, 'video')

    wait = WebDriverWait(video, 80)
    # while True:
    #     try:
    #         wait.until(lambda video: video.get_property('ended') == True)
    #         log = { 'msg': 'playback completed' }
    #         break
    #     except KeyboardInterrupt:
    #         quitting = True
    #         continue
    #     except TimeoutException:
    #         log = { 'msg': 'timeout when playing' }
    #         break
    cnt = 0
    stamp = datetime.now()
    log={ 'stamp': stamp, 'url': url,'info':[],'detail':[] }
    while True:
        #stampstr = stamp.strftime('%Y-%m-%dT%H:%M:%S').replace(":","")
        filepath=f'{logpath}\\log.video'
        lock = FileLock(filepath+".lock", timeout=10    )
        with lock:
            with open(filepath, 'w') as log_file:
                log['info'].extend(driver.get_log('browser'))
                log['detail'].extend(driver.get_log('performance'))
                if(video.get_property('ended')==True):
                    log['finished']=True
                    pprint(log, log_file)
                    break
                else:
                    log['finished']=False
                    pprint(log, log_file)
        cnt+=1
        sleep(1)
    return log

def main(device,logpath):
    global options
    global caps
    global quitting

    options = webdriver.ChromeOptions()
    options.add_argument('--autoplay-policy=no-user-gesture-required')
    options.add_experimental_option('androidPackage', 'com.android.chrome')
    options.add_experimental_option('androidDeviceSerial', device)

    caps = webdriver.DesiredCapabilities.CHROME.copy()
    caps['goog:loggingPrefs'] = { 'browser': 'ALL', 'performance' : 'ALL' }
    caps['pageLoadStrategy'] = 'none'

    capture_cmds = open('capture.cmd', 'w')

    quitting = False
    index = random.randint(0, 11)

    stamp = datetime.now()
    url = f'http://{SERVER_IP}/video.html'
    log = { 'id': index, 'stamp': stamp, 'url': url }
    index += 1

    stampstr = stamp.strftime('%Y-%m-%dT%H:%M:%S')
    capture_cmds.write(f'start {device} {stampstr}\n')
    capture_cmds.flush()

    try:
        log |= run(url,logpath)
    except Exception as e:
        log['exp'] = e
        print(f'Got exception: {repr(e)}')
        traceback.print_exc()
        # print('Terminated? [Y/n]')
        # sys.stdout.flush()

        # termios.tcflush(sys.stdin.fileno(), termios.TCIFLUSH)
        # decision = os.read(sys.stdin.fileno(), 1)
        # if decision != 'n' and decision != 'N':
        #     quitting = True
        quitting = True

    capture_cmds.write(f'stop {device}\n')
    capture_cmds.flush()
    sleep(1)
    # with open(f'logs/{device}/{stampstr}', 'w') as log_file:
    #     pprint(log, log_file)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(f'Usage: {sys.argv[0]} [dev-id] [log-path]')
    else:
        main(sys.argv[1],sys.argv[2])
