document.addEventListener('DOMContentLoaded', () => {
    const emailContainer = document.getElementById('email-container');
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = '<div class="spinner"></div><p>Loading email service...</p>';
    
    // Function to load email content via proxy
    function loadEmailService() {
        if (emailContainer) {
            emailContainer.innerHTML = '';
            emailContainer.appendChild(loadingSpinner);
            
            // Log the start of the fetch operation for debugging
            console.log('Fetching email service content...');
            
            fetch('/api/proxy-email')
                .then(response => {
                    if (!response.ok) {
                        console.error('Error response from proxy:', response.status);
                        throw new Error(`Network response was not ok: ${response.status}`);
                    }
                    console.log('Fetch successful, processing response...');
                    return response.text();
                })
                .then(htmlContent => {
                    // Log the length of the content for debugging
                    console.log(`Received HTML content (${htmlContent.length} bytes)`);
                    
                    // Fix any encoded SVG elements
                    htmlContent = decodeEncodedElements(htmlContent);
                    
                    // Display the content directly - the proxy API already processed it
                    emailContainer.innerHTML = htmlContent;
                    
                    // Add our own CSS to fix display issues with the proxied content
                    applyCustomStyling();
                    
                    // Execute any necessary JavaScript for the loaded content
                    activateContent();
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                    emailContainer.innerHTML = `
                        <div class="error-message">
                            <h3>Error loading email service</h3>
                            <p>${error.message}</p>
                            <button id="retry-btn">Retry</button>
                        </div>
                    `;
                    document.getElementById('retry-btn').addEventListener('click', loadEmailService);
                });
        }
    }
    
    // Decode encoded HTML elements (like SVGs)
    function decodeEncodedElements(html) {
        // Replace encoded SVG tags
        return html
            .replace(/&lt;svg/g, '<svg')
            .replace(/&lt;\/svg&gt;/g, '</svg>')
            .replace(/&lt;path/g, '<path')
            .replace(/&lt;\/path&gt;/g, '</path>')
            .replace(/&lt;g/g, '<g')
            .replace(/&lt;\/g&gt;/g, '</g>')
            .replace(/&lt;rect/g, '<rect')
            .replace(/&lt;\/rect&gt;/g, '</rect>')
            .replace(/&lt;circle/g, '<circle')
            .replace(/&lt;\/circle&gt;/g, '</circle>')
            .replace(/&lt;text/g, '<text')
            .replace(/&lt;\/text&gt;/g, '</text>')
            .replace(/&lt;polygon/g, '<polygon')
            .replace(/&lt;\/polygon&gt;/g, '</polygon>')
            // Add more SVG tag replacements as needed
            .replace(/&gt;/g, '>');
    }
    
    // Apply custom styling to fix display issues
    function applyCustomStyling() {
        // Create a style element for custom CSS fixes
        const style = document.createElement('style');
        style.textContent = `
            /* Fix layout issues */
            .email-container * {
                box-sizing: border-box;
            }
            
            /* Fix SVG rendering */
            .email-container svg {
                display: inline-block;
                max-width: 100%;
            }
            
            /* Fix text that might be rotated incorrectly */
            .email-container [style*="transform:"] {
                transform: none !important;
            }
            
            /* Ensure content is centered */
            .email-container > div {
                margin: 0 auto;
            }
            
            /* Ensure buttons are visible */
            .email-container button, 
            .email-container .button,
            .email-container a.button,
            .email-container input[type="button"],
            .email-container input[type="submit"] {
                display: inline-block;
                background-color: #007bff;
                color: white !important;
                text-decoration: none !important;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin: 5px 0;
            }
            
            /* Fix form input styling */
            .email-container input[type="text"],
            .email-container input[type="email"],
            .email-container input[type="password"] {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                min-width: 200px;
            }
            
            /* Fix navigation arrows */
            .email-container img[alt*="arrow"],
            .email-container img[alt*="navigation"],
            .email-container img[alt*="Arrow"],
            .email-container img[alt*="Navigation"] {
                display: inline-block;
                max-width: 32px;
                height: auto;
                vertical-align: middle;
            }
            
            /* Fix potential layout breaks */
            .email-container table {
                width: auto !important;
                margin: 0 auto;
            }
            
            /* Center the email service content */
            .email-container > div {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                max-width: 800px;
                margin: 0 auto;
            }
            
            /* Fix any rotated text */
            .email-container [style*="rotate"] {
                transform: none !important;
            }
        `;
        
        // Append the style element to the email container
        emailContainer.appendChild(style);
    }
    
    // Function to activate any interactive elements in the loaded content
    function activateContent() {
        // Find and handle all links to make them go through the proxy
        const links = emailContainer.querySelectorAll('a');
        links.forEach(link => {
            if (link.href && !link.href.startsWith('javascript:')) {
                link.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    
                    // Skip handling for external links like social media, etc.
                    if (href && href.startsWith('http') && 
                        !href.includes('reusable.email') && 
                        !href.includes('reusablemail.com')) {
                        return; // Let these open normally
                    }
                    
                    // Don't intercept links that already go through our proxy
                    if (href && !href.startsWith('/api/proxy-email')) {
                        e.preventDefault();
                        
                        // Show loading state
                        emailContainer.innerHTML = '';
                        emailContainer.appendChild(loadingSpinner);
                        
                        // Navigate through our proxy
                        fetch(`/api/proxy-email?url=${encodeURIComponent(href)}`)
                            .then(response => response.text())
                            .then(html => {
                                // Fix any encoded SVG elements
                                html = decodeEncodedElements(html);
                                emailContainer.innerHTML = html;
                                
                                // Apply custom styling
                                applyCustomStyling();
                                
                                // Setup interactive elements
                                activateContent();
                                
                                // Check for inbox URLs
                                if (href.includes('private.reusable.email') || 
                                    href.includes('/AACG-') || 
                                    href.includes('/QRYD-')) {
                                    updateUrlDisplay(href);
                                }
                            })
                            .catch(error => {
                                console.error('Error navigating:', error);
                                emailContainer.innerHTML = `
                                    <div class="error-message">
                                        <h3>Error loading page</h3>
                                        <p>${error.message}</p>
                                        <button id="retry-nav-btn">Retry</button>
                                    </div>
                                `;
                                document.getElementById('retry-nav-btn').addEventListener('click', () => {
                                    navigateProxy(href);
                                });
                            });
                    }
                });
            }
        });
        
        // Handle forms to submit through our proxy
        const forms = emailContainer.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Show loading state
                emailContainer.innerHTML = '';
                emailContainer.appendChild(loadingSpinner);
                
                // Get form data
                const formData = new FormData(this);
                const formObject = {};
                formData.forEach((value, key) => {
                    formObject[key] = value;
                });
                
                // Get the form action
                const action = this.getAttribute('action') || '';
                
                // Submit the form through our proxy
                fetch('/api/proxy-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: action,
                        formData: formObject
                    })
                })
                .then(response => response.text())
                .then(html => {
                    // Fix any encoded SVG elements
                    html = decodeEncodedElements(html);
                    emailContainer.innerHTML = html;
                    
                    // Apply custom styling
                    applyCustomStyling();
                    
                    // Setup interactive elements
                    activateContent();
                })
                .catch(error => {
                    console.error('Error submitting form:', error);
                    emailContainer.innerHTML = `
                        <div class="error-message">
                            <h3>Error submitting form</h3>
                            <p>${error.message}</p>
                            <button id="retry-form-btn">Retry</button>
                        </div>
                    `;
                    document.getElementById('retry-form-btn').addEventListener('click', () => {
                        submitForm(action, formData);
                    });
                });
            });
        });
        
        // Look for inbox URLs in the content
        scanForInboxUrls();
    }
    
    // Function to navigate to a URL through the proxy
    function navigateProxy(url) {
        if (emailContainer) {
            emailContainer.innerHTML = '';
            emailContainer.appendChild(loadingSpinner);
            
            fetch(`/api/proxy-email?url=${encodeURIComponent(url)}`)
                .then(response => response.text())
                .then(html => {
                    // Fix any encoded SVG elements
                    html = decodeEncodedElements(html);
                    emailContainer.innerHTML = html;
                    
                    // Apply custom styling
                    applyCustomStyling();
                    
                    // Setup interactive elements
                    activateContent();
                    
                    // Check if URL is an inbox and update the display
                    if (url.includes('private.reusable.email') || 
                        url.includes('/AACG-') || 
                        url.includes('/QRYD-')) {
                        updateUrlDisplay(url);
                    }
                })
                .catch(error => {
                    console.error('Error navigating:', error);
                    emailContainer.innerHTML = `
                        <div class="error-message">
                            <h3>Error loading page</h3>
                            <p>${error.message}</p>
                            <button id="retry-nav-btn">Retry</button>
                        </div>
                    `;
                    document.getElementById('retry-nav-btn').addEventListener('click', () => {
                        navigateProxy(url);
                    });
                });
        }
    }
    
    // Function to submit a form through the proxy
    function submitForm(action, formData) {
        if (emailContainer) {
            emailContainer.innerHTML = '';
            emailContainer.appendChild(loadingSpinner);
            
            // Convert FormData to object
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            
            // Submit the form through our proxy
            fetch('/api/proxy-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: action,
                    formData: formObject
                })
            })
            .then(response => response.text())
            .then(html => {
                // Fix any encoded SVG elements
                html = decodeEncodedElements(html);
                emailContainer.innerHTML = html;
                
                // Apply custom styling
                applyCustomStyling();
                
                // Setup interactive elements
                activateContent();
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                emailContainer.innerHTML = `
                    <div class="error-message">
                        <h3>Error submitting form</h3>
                        <p>${error.message}</p>
                        <button id="retry-form-btn">Retry</button>
                    </div>
                `;
                document.getElementById('retry-form-btn').addEventListener('click', () => {
                    submitForm(action, formData);
                });
            });
        }
    }
    
    // Function to scan for inbox URLs in the content
    function scanForInboxUrls() {
        const textNodes = [];
        const walker = document.createTreeWalker(
            emailContainer,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
    
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
    
        for (const node of textNodes) {
            const text = node.nodeValue;
            if (text) {
                if (text.includes('private.reusable.email') || 
                    text.includes('/AACG-') || 
                    text.includes('/QRYD-')) {
                    
                    const urlMatch = text.match(/(https?:\/\/private\.reusable\.email\/[^\s'"]+)/);
                    if (urlMatch && urlMatch[1]) {
                        updateUrlDisplay(urlMatch[1]);
                        return;
                    }
                    
                    const idMatch = text.match(/([A-Z]+-\d+-[A-Z]+)/);
                    if (idMatch && idMatch[1]) {
                        updateUrlDisplay(`https://private.reusable.email/${idMatch[1]}`);
                        return;
                    }
                }
                
                const emailMatch = text.match(/([A-Z]+-\d+-[A-Z]+@private\.reusable\.email)/);
                if (emailMatch && emailMatch[1]) {
                    const emailParts = emailMatch[1].split('@');
                    if (emailParts.length > 1) {
                        updateUrlDisplay(`https://private.reusable.email/${emailParts[0]}`);
                        return;
                    }
                }
            }
        }
    }
    
    // Function to update the URL display
    function updateUrlDisplay(url) {
        const urlInput = document.getElementById('inbox-url');
        if (urlInput) {
            urlInput.value = url;
            highlightInput(urlInput);
        }
    }
    
    // Function to highlight the URL input
    function highlightInput(input) {
        if (!input) return;
        
        input.style.backgroundColor = '#f0f9ff';
        input.style.borderColor = '#007bff';
        
        setTimeout(() => {
            input.style.backgroundColor = '';
            if (input.value.trim()) {
                input.style.borderColor = '#007bff';
            } else {
                input.style.borderColor = '';
            }
        }, 1500);
    }
    
    // Initial load of the email service
    loadEmailService();
    
    // Add click event handler to the retry button that might appear
    emailContainer.addEventListener('click', (e) => {
        if (e.target.id === 'retry-btn') {
            loadEmailService();
        }
    });
    
    // Set up URL copy functionality
    const urlInput = document.getElementById('inbox-url');
    const copyButton = document.getElementById('copy-url-btn');
    
    if (copyButton && urlInput) {
        copyButton.addEventListener('click', function() {
            if (urlInput.value.trim() !== '') {
                urlInput.select();
                urlInput.setSelectionRange(0, 99999);
                
                navigator.clipboard.writeText(urlInput.value)
                    .then(() => {
                        // Visual feedback
                        const originalText = copyButton.textContent;
                        copyButton.textContent = 'Copied!';
                        copyButton.style.backgroundColor = '#28a745';
                        
                        setTimeout(() => {
                            copyButton.textContent = originalText;
                            copyButton.style.backgroundColor = '#007bff';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Could not copy text: ', err);
                        alert('Failed to copy. Please try manually selecting and copying the text.');
                    });
            } else {
                alert('Please paste a URL first');
            }
        });
    }
}); 