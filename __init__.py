"""
ComfyUI Exit Button Extension
Adds an exit button to gracefully shutdown ComfyUI
"""

import server
from aiohttp import web
import os
import signal
import sys

WEB_DIRECTORY = "./web"

@server.PromptServer.instance.routes.post("/exit")
async def exit_comfyui(request):
    """Endpoint to gracefully shutdown ComfyUI"""
    print("\n[Exit Button] Shutdown requested - closing ComfyUI...")
    
    # Send response before shutting down
    response = web.json_response({"status": "shutting_down"})
    
    # Schedule shutdown
    import asyncio
    import threading
    
    def delayed_shutdown():
        import time
        time.sleep(0.3)
        _shutdown()
    
    thread = threading.Thread(target=delayed_shutdown, daemon=True)
    thread.start()
    
    return response

def _shutdown():
    """Perform the actual shutdown"""
    print("[Exit Button] Goodbye!")
    
    # Force terminate the entire process tree on Windows
    if sys.platform == "win32":
        try:
            import subprocess
            # Kill the entire process tree
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(os.getpid())], 
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except:
            pass
        # Fallback
        os._exit(0)
    else:
        os.kill(os.getpid(), signal.SIGTERM)

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
