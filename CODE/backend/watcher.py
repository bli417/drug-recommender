import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileModifiedEvent
import logging

logger = logging.getLogger(__name__)

class Watcher:
    DIRECTORY_TO_WATCH = "./"

    def __init__(self):
        self.observer = Observer()

    def run(self):
        event_handler = Handler()
        self.observer.schedule(event_handler, self.DIRECTORY_TO_WATCH, recursive=False)
        self.observer.start()
        try:
            while True:
                time.sleep(5)
        except Exception as e:
            logger.error(f"Watcher error: {str(e)}")
            self.observer.stop()

        self.observer.join()


class Handler(FileSystemEventHandler):
    @staticmethod
    def on_any_event(event):
        if event.src_path == "./requirements.txt":
            try:
                result = subprocess.run(
                    ["./install.sh"], 
                    timeout=300,
                    capture_output=True,
                    text=True,
                    check=True
                )
                logger.info(f"Install completed: {result.stdout}")
            except subprocess.TimeoutExpired:
                logger.error("Install timed out")
            except subprocess.CalledProcessError as e:
                logger.error(f"Install failed: {e.stderr}")


if __name__ == '__main__':
    w = Watcher()
    w.run()
