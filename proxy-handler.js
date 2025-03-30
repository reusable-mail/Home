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
            
            fetch('/api/proxy-email')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(htmlContent => {
                    // Process the HTML content to make it work with our site
                    const processedHtml = processHtml(htmlContent);
                    emailContainer.innerHTML = processedHtml;
                    
                    // Add event listeners to handle form submissions and navigation
                    attachEventHandlers();
                })
                .catch(error => {
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
    
    // Process the HTML content from the external site
    function processHtml(html) {
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Remove any scripts to prevent conflicts
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Update relative URLs to absolute ones
        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
            if (link.href && !link.href.startsWith('http')) {
                // Handle relative links by making them go through our proxy
                const originalHref = link.getAttribute('href');
                if (originalHref && !originalHref.startsWith('javascript:')) {
                    link.setAttribute('data-original-href', originalHref);
                    link.setAttribute('href', '#');
                    link.onclick = (e) => {
                        e.preventDefault();
                        navigateProxy('https://reusable.email' + originalHref);
                    };
                }
            }
            
            // Detect inbox URLs for our URL display feature
            if (link.href && 
                (link.href.includes('private.reusable.email') || 
                 link.href.includes('/AACG-') || 
                 link.href.includes('/QRYD-'))) {
                const urlInput = document.getElementById('inbox-url');
                if (urlInput) {
                    urlInput.value = link.href;
                    highlightInput();
                }
            }
        });
        
        // Update form actions to go through our proxy
        const forms = tempDiv.querySelectorAll('form');
        forms.forEach(form => {
            const originalAction = form.getAttribute('action') || '';
            form.setAttribute('data-original-action', originalAction);
            form.setAttribute('action', '#');
            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                submitFormViaProxy(originalAction, formData);
            };
        });
        
        // Return the processed HTML
        return tempDiv.innerHTML;
    }
    
    // Function to navigate to a different page via the proxy
    function navigateProxy(url) {
        if (emailContainer) {
            emailContainer.innerHTML = '';
            emailContainer.appendChild(loadingSpinner);
            
            fetch(`/api/proxy-email?url=${encodeURIComponent(url)}`)
                .then(response => response.text())
                .then(htmlContent => {
                    const processedHtml = processHtml(htmlContent);
                    emailContainer.innerHTML = processedHtml;
                    attachEventHandlers();
                    
                    // Check if URL is an inbox and update the URL display
                    if (url.includes('private.reusable.email') || 
                        url.includes('/AACG-') || 
                        url.includes('/QRYD-')) {
                        const urlInput = document.getElementById('inbox-url');
                        if (urlInput) {
                            urlInput.value = url;
                            highlightInput();
                        }
                    }
                })
                .catch(error => {
                    emailContainer.innerHTML = `
                        <div class="error-message">
                            <h3>Error loading page</h3>
                            <p>${error.message}</p>
                            <button id="retry-btn">Retry</button>
                        </div>
                    `;
                    document.getElementById('retry-btn').addEventListener('click', () => navigateProxy(url));
                });
        }
    }
    
    // Function to submit a form via the proxy
    function submitFormViaProxy(action, formData) {
        const url = action.startsWith('http') ? action : `https://reusable.email${action}`;
        
        if (emailContainer) {
            emailContainer.innerHTML = '';
            emailContainer.appendChild(loadingSpinner);
            
            // Convert FormData to a plain object
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            
            // Send the form data via our proxy
            fetch('/api/proxy-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    formData: formObject
                })
            })
            .then(response => response.text())
            .then(htmlContent => {
                const processedHtml = processHtml(htmlContent);
                emailContainer.innerHTML = processedHtml;
                attachEventHandlers();
            })
            .catch(error => {
                emailContainer.innerHTML = `
                    <div class="error-message">
                        <h3>Error submitting form</h3>
                        <p>${error.message}</p>
                        <button id="retry-btn">Retry</button>
                    </div>
                `;
                document.getElementById('retry-btn').addEventListener('click', () => submitFormViaProxy(action, formData));
            });
        }
    }
    
    // Highlight the URL input when a value is set
    function highlightInput() {
        const urlInput = document.getElementById('inbox-url');
        if (!urlInput) return;
        
        // Briefly highlight input to show it was auto-filled
        urlInput.style.backgroundColor = '#f0f9ff';
        urlInput.style.borderColor = '#007bff';
        
        setTimeout(() => {
            urlInput.style.backgroundColor = '';
            // Keep border highlighted if there's content
            if (!urlInput.value.trim()) {
                urlInput.style.borderColor = '';
            }
        }, 1500);
    }
    
    // Attach event handlers after content is loaded
    function attachEventHandlers() {
        // Add any specific event handlers for the loaded content
    }
    
    // Initial load of the email service
    loadEmailService();
    
    // Setup URL copy functionality
    const urlInput = document.getElementById('inbox-url');
    const copyButton = document.getElementById('copy-url-btn');
    
    if (copyButton && urlInput) {
        copyButton.addEventListener('click', function() {
            if (urlInput.value.trim() !== '') {
                // Select the text
                urlInput.select();
                urlInput.setSelectionRange(0, 99999); // For mobile devices
                
                // Copy the text to clipboard
                navigator.clipboard.writeText(urlInput.value)
                    .then(() => {
                        // Visual feedback that copy worked
                        const originalText = copyButton.textContent;
                        copyButton.textContent = 'Copied!';
                        copyButton.style.backgroundColor = '#28a745';
                        
                        // Revert back after 2 seconds
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