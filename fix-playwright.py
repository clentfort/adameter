import os
import subprocess

def main():
    home = os.path.expanduser("~")
    pw_cache = os.path.join(home, ".cache", "ms-playwright")
    if not os.path.exists(pw_cache):
        os.makedirs(pw_cache)

    # Try to install browsers
    try:
        subprocess.run(["pnpm", "exec", "playwright", "install", "chromium"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed to install playwright browsers: {e}")

if __name__ == "__main__":
    main()
