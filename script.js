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
    
    // Allow users to paste URL from clipboard
    urlInput.addEventListener('click', function() {
        if (urlInput.value === '' || urlInput.value === urlInput.placeholder) {
            // Try to read from clipboard if input is empty
            if (navigator.clipboard && navigator.clipboard.readText) {
                navigator.clipboard.readText()
                    .then(clipText => {
                        // Only auto-fill if it looks like a reusable.email URL
                        if (clipText.includes('reusable.email') || 
                            clipText.includes('private.reusable.email')) {
                            urlInput.value = clipText;
                        }
                    })
                    .catch(err => {
                        // Silent fail - clipboard access might be denied
                        console.log('Clipboard access denied or empty');
                    });
            }
        }
    });
}); 