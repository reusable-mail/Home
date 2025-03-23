// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop,
                behavior: 'smooth'
            });
        });
    });
    
    // Form submission handling
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formValues = {};
            
            formData.forEach((value, key) => {
                formValues[key] = value;
            });
            
            // Here you would typically send the data to a server
            // For now, we'll just show a success message
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }
    
    // Animation for services cards on scroll
    const serviceCards = document.querySelectorAll('.service-card');
    
    // Simple function to check if an element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Add animation class when scrolled into view
    function handleScroll() {
        serviceCards.forEach(card => {
            if (isInViewport(card)) {
                card.classList.add('animate');
            }
        });
    }
    
    // Listen for scroll events
    window.addEventListener('scroll', handleScroll);
    
    // Call once on load to check for elements already in viewport
    handleScroll();
    
    // Responsive navigation menu toggle (for mobile)
    // This would require additional HTML/CSS to implement fully
    const createMobileMenu = () => {
        // This is a placeholder for a more complex mobile menu implementation
        // In a real implementation, you would add a hamburger menu button
        // and toggle a mobile navigation menu
    };
    
    // Call this function to set up the mobile menu
    createMobileMenu();
    
    // URL copy functionality
    const urlInput = document.getElementById('inbox-url');
    const copyButton = document.getElementById('copy-url-btn');
    
    // Copy button functionality
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
    
    // Auto-detection for encrypted inbox URL
    const emailIframe = document.querySelector('.iframe-container iframe');
    let clipboardCheckInterval;
    let lastClipboardContent = '';
    
    // Setup message listener for potential messages from iframe
    window.addEventListener('message', function(event) {
        // Verify sender origin for security (should match reusable.email domain)
        if (event.origin.includes('reusable.email')) {
            if (event.data && typeof event.data === 'string' && event.data.includes('private.reusable.email')) {
                // Found a URL in the message, update the input field
                urlInput.value = event.data;
                highlightInput();
            }
        }
    });
    
    // URL detection via iframe load events and window URL handling
    if (emailIframe) {
        // Monitor the iframe for navigation changes
        let lastIframeSrc = emailIframe.src;
        
        // Function to check if the iframe URL has changed
        const checkIframeChange = () => {
            try {
                if (emailIframe.src !== lastIframeSrc) {
                    lastIframeSrc = emailIframe.src;
                    if (emailIframe.src.includes('private.reusable.email') || 
                        emailIframe.src.includes('/AACG-') || 
                        emailIframe.src.includes('/QRYD-')) {
                        urlInput.value = emailIframe.src;
                        highlightInput();
                    }
                }
                
                // Try to get any visible links inside the iframe that might be inbox URLs
                try {
                    // This might fail due to cross-origin restrictions
                    const iframeDocument = emailIframe.contentDocument || emailIframe.contentWindow.document;
                    const inboxLinks = iframeDocument.querySelectorAll('a[href*="private.reusable.email"]');
                    
                    if (inboxLinks && inboxLinks.length > 0) {
                        // Use the first valid inbox link found
                        for (let link of inboxLinks) {
                            if (link.href && 
                                (link.href.includes('/AACG-') || link.href.includes('/QRYD-'))) {
                                urlInput.value = link.href;
                                highlightInput();
                                break;
                            }
                        }
                    }
                } catch (e) {
                    // Expected to fail due to cross-origin policy
                    // console.log('Could not access iframe content due to security restrictions');
                }
            } catch (e) {
                // Silently fail
            }
        };
        
        // Check the iframe periodically for changes (every 1 second)
        setInterval(checkIframeChange, 1000);
        
        // Set up a MutationObserver to watch for changes in the iframe document title
        // This helps detect when an inbox is loaded
        emailIframe.addEventListener('load', function() {
            try {
                // When iframe loads, check URL parameters in parent window
                const urlParams = new URLSearchParams(window.location.search);
                const inboxParam = urlParams.get('inbox');
                
                if (inboxParam) {
                    // If there's an inbox parameter, show it in the input field
                    const fullUrl = `https://private.reusable.email/${inboxParam}`;
                    urlInput.value = fullUrl;
                    highlightInput();
                }
            } catch (e) {
                console.log('Could not check iframe content', e);
            }
            
            // Also check if the current URL in browser contains inbox identifier
            if (window.location.href.includes('private.reusable.email') || 
                window.location.href.includes('/AACG-') || 
                window.location.href.includes('/QRYD-')) {
                urlInput.value = window.location.href;
                highlightInput();
            }
        });
    }
    
    // Add functionality to detect URL changes from iframe navigation
    function checkForInboxUrls() {
        // Check if current URL has changed to an inbox URL
        if (window.location.href.includes('private.reusable.email') || 
            window.location.href.includes('/AACG-') || 
            window.location.href.includes('/QRYD-')) {
            urlInput.value = window.location.href;
            highlightInput();
            return true;
        }
        
        // Check the document.referrer in case we navigated from an inbox page
        if (document.referrer.includes('private.reusable.email') || 
            document.referrer.includes('/AACG-') || 
            document.referrer.includes('/QRYD-')) {
            urlInput.value = document.referrer;
            highlightInput();
            return true;
        }
        
        return false;
    }
    
    // Run URL check on page load
    checkForInboxUrls();
    
    // Check URL when iframe receives focus (might indicate navigation happened)
    emailIframe.addEventListener('focus', checkForInboxUrls);
    
    // Override default URL detection with URL hash detection
    window.addEventListener('hashchange', function() {
        if (window.location.hash && 
            (window.location.hash.includes('AACG-') || 
             window.location.hash.includes('QRYD-'))) {
            const hashValue = window.location.hash.substring(1);
            if (hashValue.includes('private.reusable.email')) {
                urlInput.value = hashValue;
            } else {
                urlInput.value = `https://private.reusable.email/${hashValue}`;
            }
            highlightInput();
        }
    });
    
    // Function to check for displayed URLs on the page
    function scanForVisibleInboxURLs() {
        // Look for any text nodes that might contain a URL pattern
        const textNodes = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        // Check each text node for URL patterns
        for (const node of textNodes) {
            const text = node.nodeValue;
            if (text) {
                // Check for reusable.email patterns
                if (text.includes('private.reusable.email') || 
                    text.includes('/AACG-') || 
                    text.includes('/QRYD-')) {
                    
                    // Find the full URL within the text
                    const urlMatch = text.match(/(https?:\/\/private\.reusable\.email\/[^\s'"]+)/);
                    if (urlMatch && urlMatch[1]) {
                        urlInput.value = urlMatch[1];
                        highlightInput();
                        return true;
                    }
                    
                    // Check for ID patterns without the full URL
                    const idMatch = text.match(/([A-Z]+-\d+-[A-Z]+)/);
                    if (idMatch && idMatch[1]) {
                        urlInput.value = `https://private.reusable.email/${idMatch[1]}`;
                        highlightInput();
                        return true;
                    }
                }
                
                // Check for email format like "QRYD-8938-RNAY@private.reusable.email"
                const emailMatch = text.match(/([A-Z]+-\d+-[A-Z]+@private\.reusable\.email)/);
                if (emailMatch && emailMatch[1]) {
                    const emailParts = emailMatch[1].split('@');
                    if (emailParts.length > 1) {
                        urlInput.value = `https://private.reusable.email/${emailParts[0]}`;
                        highlightInput();
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Scan for URLs on the page periodically
    setInterval(scanForVisibleInboxURLs, 2000);
    
    // Also scan when the page visibility changes (user returns to the tab)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            scanForVisibleInboxURLs();
            checkForInboxUrls();
            checkClipboard();
        }
    });
    
    // Enhance clipboard check to detect specific formats seen in the screenshots
    const checkClipboard = () => {
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText()
                .then(clipText => {
                    // Process only if the content is new
                    if (clipText !== lastClipboardContent) {
                        lastClipboardContent = clipText;
                        
                        // Check for various URL patterns 
                        if (clipText.includes('private.reusable.email') || 
                            clipText.includes('/AACG-') || 
                            clipText.includes('/QRYD-')) {
                            urlInput.value = clipText;
                            highlightInput();
                        }
                        // Check for the specific format seen in screenshots
                        else if (clipText.match(/[A-Z]+-[0-9]+-[A-Z]+@private\.reusable\.email/)) {
                            // It's an email address format, convert to URL
                            const emailParts = clipText.split('@');
                            if (emailParts.length > 1) {
                                const urlFromEmail = `https://private.reusable.email/${emailParts[0]}`;
                                urlInput.value = urlFromEmail;
                                highlightInput();
                            }
                        }
                    }
                })
                .catch(err => {
                    // Silent fail - clipboard access might be denied
                    console.log('Clipboard access denied or empty');
                });
        }
    };
    
    // Periodic clipboard checking (if permissions allow)
    const startClipboardCheck = () => {
        // Check immediately
        checkClipboard();
        
        // Set up interval for checking (every 2 seconds)
        clipboardCheckInterval = setInterval(checkClipboard, 2000);
    };
    
    // Function to visually highlight the input when a URL is auto-detected
    const highlightInput = () => {
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
    };
    
    // Attempt to read from clipboard when user interacts with the page
    document.addEventListener('click', function() {
        if (!clipboardCheckInterval) {
            startClipboardCheck();
        }
    });
    
    // Handle click on input field
    urlInput.addEventListener('click', function() {
        if (urlInput.value === '' || urlInput.value === urlInput.placeholder) {
            // Try to read from clipboard
            if (navigator.clipboard && navigator.clipboard.readText) {
                navigator.clipboard.readText()
                    .then(clipText => {
                        // Only auto-fill if it looks like a reusable.email URL
                        if (clipText.includes('reusable.email') || 
                            clipText.includes('private.reusable.email') ||
                            clipText.includes('/AACG-')) {
                            urlInput.value = clipText;
                        }
                    })
                    .catch(err => {
                        // Silent fail - clipboard access might be denied
                        console.log('Clipboard access denied or empty');
                    });
            }
        }
        // Select all text when clicking on the input if it already has content
        else {
            urlInput.select();
        }
    });
    
    // Clear interval when page is unloaded
    window.addEventListener('beforeunload', function() {
        if (clipboardCheckInterval) {
            clearInterval(clipboardCheckInterval);
        }
    });
}); 