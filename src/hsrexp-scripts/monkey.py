import errno
import os
import platform
import subprocess
from subprocess import PIPE
import signal
import time
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.common import utils

def start(self):
  """
        Starts the Service.
        :Exceptions:
         - WebDriverException : Raised either when it can't start the service
           or when it can't connect to the service
        """
  try:
    cmd = [self.path]
    cmd.extend(self.command_line_args())

    self.process = subprocess.Popen(cmd, env=self.env,
                                    close_fds=platform.system() != 'Windows',
                                    stdout=self.log_file,
                                    stderr=self.log_file,
                                    stdin=PIPE,
                                    )
#                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  except TypeError:
    raise
  except OSError as err:
    if err.errno == errno.ENOENT:
      raise WebDriverException(
        "'%s' executable needs to be in PATH. %s" % (
          os.path.basename(self.path), self.start_error_message)
      )
    elif err.errno == errno.EACCES:
      raise WebDriverException(
        "'%s' executable may have wrong permissions. %s" % (
          os.path.basename(self.path), self.start_error_message)
      )
    else:
      raise
  except Exception as e:
    raise WebDriverException(
      "The executable %s needs to be available in the path. %s\n%s" %
      (os.path.basename(self.path), self.start_error_message, str(e)))
  count = 0
  while True:
    self.assert_process_still_running()
    if self.is_connectable():
      break
    count += 1
    time.sleep(1)
    if count == 30:
      raise WebDriverException("Can not connect to the Service %s" % self.path)
