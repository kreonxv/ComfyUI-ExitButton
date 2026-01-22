import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "Comfy.ExitButton",
    
    async setup() {
        // Create exit button
        const exitButton = document.createElement("button");
        exitButton.id = "comfy-exit-button";
        exitButton.textContent = "✕ Exit";
        exitButton.title = "Close ComfyUI (shuts down server)";
        
        // Style the button
        Object.assign(exitButton.style, {
            position: "fixed",
            zIndex: "10000",
            padding: "4px 16px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "grab",
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            fontWeight: "bold",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            transition: "background-color 0.2s ease",
            userSelect: "none"
        });
        
        // Add to document first
        document.body.appendChild(exitButton);
        
        // Function to position button based on anchor
        function positionButton(anchor, offsetX, offsetY) {
            // Clear all position properties first
            exitButton.style.top = "";
            exitButton.style.bottom = "";
            exitButton.style.left = "";
            exitButton.style.right = "";
            
            // Set position based on anchor
            if (anchor.includes('top')) {
                exitButton.style.top = offsetY + 'px';
            } else {
                exitButton.style.bottom = offsetY + 'px';
            }
            
            if (anchor.includes('left')) {
                exitButton.style.left = offsetX + 'px';
            } else {
                exitButton.style.right = offsetX + 'px';
            }
        }
        
        // Load saved position from localStorage or use default
        let savedPosition;
        try {
            savedPosition = localStorage.getItem('comfy-exit-button-position');
            if (savedPosition) {
                savedPosition = JSON.parse(savedPosition);
            }
        } catch (e) {
            savedPosition = null;
        }
        
        let currentAnchor = 'bottom-right';
        
        if (savedPosition && savedPosition.anchor) {
            currentAnchor = savedPosition.anchor;
            positionButton(savedPosition.anchor, savedPosition.offsetX, savedPosition.offsetY);
        } else {
            // Default position: bottom-right corner
            positionButton('bottom-right', 10, 60);
        }
        
        // Dragging functionality
        let isDragging = false;
        let hasMoved = false;
        let dragStartX;
        let dragStartY;

        exitButton.addEventListener("mousedown", (e) => {
            // Prevent default to avoid text selection
            e.preventDefault();
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            isDragging = true;
            hasMoved = false;
            exitButton.style.cursor = "grabbing";
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                e.preventDefault();
                hasMoved = true;
                
                const deltaX = e.clientX - dragStartX;
                const deltaY = e.clientY - dragStartY;
                
                const rect = exitButton.getBoundingClientRect();
                const newLeft = rect.left + deltaX;
                const newTop = rect.top + deltaY;
                
                // Temporarily position using left/top for dragging
                exitButton.style.left = newLeft + 'px';
                exitButton.style.top = newTop + 'px';
                exitButton.style.right = "";
                exitButton.style.bottom = "";
                
                dragStartX = e.clientX;
                dragStartY = e.clientY;
            }
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                exitButton.style.cursor = "grab";
                
                if (hasMoved) {
                    // Calculate which corner is closest
                    const rect = exitButton.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const windowWidth = window.innerWidth;
                    const windowHeight = window.innerHeight;
                    
                    const isLeft = centerX < windowWidth / 2;
                    const isTop = centerY < windowHeight / 2;
                    
                    let anchor, offsetX, offsetY;
                    
                    if (isTop && isLeft) {
                        anchor = 'top-left';
                        offsetX = rect.left;
                        offsetY = rect.top;
                    } else if (isTop && !isLeft) {
                        anchor = 'top-right';
                        offsetX = windowWidth - rect.right;
                        offsetY = rect.top;
                    } else if (!isTop && isLeft) {
                        anchor = 'bottom-left';
                        offsetX = rect.left;
                        offsetY = windowHeight - rect.bottom;
                    } else {
                        anchor = 'bottom-right';
                        offsetX = windowWidth - rect.right;
                        offsetY = windowHeight - rect.bottom;
                    }
                    
                    currentAnchor = anchor;
                    positionButton(anchor, offsetX, offsetY);
                    
                    // Save position to localStorage
                    localStorage.setItem('comfy-exit-button-position', JSON.stringify({
                        anchor,
                        offsetX,
                        offsetY
                    }));
                }
            }
        });

        // Hover effects
        exitButton.addEventListener("mouseenter", () => {
            if (!isDragging) {
                exitButton.style.backgroundColor = "#c82333";
            }
        });
        
        exitButton.addEventListener("mouseleave", () => {
            exitButton.style.backgroundColor = "#dc3545";
        });
        
        // Click handler with confirmation
        exitButton.addEventListener("click", async (e) => {
            // Don't trigger click if button was dragged
            if (hasMoved) {
                hasMoved = false;
                return;
            }
            
            const confirmed = confirm("Are you sure you want to exit ComfyUI?\n\nThis will close the server and console window.");
            
            if (confirmed) {
                exitButton.textContent = "Closing...";
                exitButton.disabled = true;
                exitButton.style.backgroundColor = "#6c757d";
                
                try {
                    await fetch("/exit", { method: "POST" });
                    // Close the browser window/tab
                    setTimeout(() => {
                        window.close();
                        // If window.close() doesn't work (e.g., not opened by script),
                        // at least clear the page
                        document.body.innerHTML = `
                            <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:white;font-family:Arial,sans-serif;flex-direction:column;">
                                <h1>ComfyUI has been closed</h1>
                                <p>You can close this browser tab now.</p>
                            </div>
                        `;
                    }, 200);
                } catch (e) {
                    // Server already closed - try to close window anyway
                    window.close();
                    document.body.innerHTML = `
                        <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:white;font-family:Arial,sans-serif;flex-direction:column;">
                            <h1>ComfyUI has been closed</h1>
                            <p>You can close this browser tab now.</p>
                        </div>
                    `;
                }
            }
        });
        
        console.log("[Exit Button] Extension loaded - button added and positioned");
    }
});
