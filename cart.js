/**
 * @constant
 * @description Configuration constants for the shopping cart
 */
const CART_CONFIG = {
    /** @type {Object} DOM element IDs */
    ELEMENTS: {
        CART_PANEL: 'cart-panel',
        CART_BUTTON: 'cart-button',
        CART_BUTTON_MOBILE: 'cart-button-mobile',
        CLOSE_CART: 'close-cart',
        CLEAR_CART: 'clear-cart',
        CHECKOUT_BUTTON: 'checkout-btn',
        CART_COUNT: 'cart-count',
        CART_COUNT_MOBILE: 'cart-count-mobile',
        CART_ITEMS: 'cart-items',
        CART_TOTAL: 'cart-total',
        CART_TEMPLATE: 'cartItemTemplate',
        // Form elements
        CHECKOUT_FORM: 'checkout-form',
        CUSTOMER_NAME: 'cart-customer-name',
        CUSTOMER_EMAIL: 'cart-customer-email',
        ACCEPT_TOS: 'cart-accept-tos',
        // Address fields
        ADDRESS_STREET: 'cart-address-street',
        ADDRESS_CITY: 'cart-address-city',
        ADDRESS_POSTAL: 'cart-address-postal',
        ADDRESS_COUNTRY: 'cart-address-country'
    },
    /** @type {Object} CSS classes */
    CLASSES: {
        TRANSLATE_FULL: 'translate-x-full'
    },
    /** @type {Object} Storage keys */
    STORAGE: {
        CART_ITEMS: 'cart'
    },
    /** @type {Object} Currency formatting */
    CURRENCY: {
        SYMBOL: '€',
        DECIMALS: 2
    }
};

/**
 * @class ShoppingCart
 * @description Manages shopping cart functionality including item management, UI updates, and checkout process
 */
class ShoppingCart {
    /**
     * @constructor
     * @description Initializes a new shopping cart instance
     */
    constructor() {
        /** @type {Array<{id: string, name: string, price: number|undefined, quantity: number, image: string}>} */
        this.items = [];
        /** @type {Object} Customer information */
        this.customerInfo = this.createDefaultCustomerInfo();
        this.elements = {
            form: document.getElementById(CART_CONFIG.ELEMENTS.CHECKOUT_FORM),
            nameField: document.getElementById(CART_CONFIG.ELEMENTS.CUSTOMER_NAME),
            emailField: document.getElementById(CART_CONFIG.ELEMENTS.CUSTOMER_EMAIL),
            tosField: document.getElementById(CART_CONFIG.ELEMENTS.ACCEPT_TOS),
            submitButton: document.getElementById(CART_CONFIG.ELEMENTS.CHECKOUT_BUTTON),
            streetField: document.getElementById(CART_CONFIG.ELEMENTS.ADDRESS_STREET),
            cityField: document.getElementById(CART_CONFIG.ELEMENTS.ADDRESS_CITY),
            postalField: document.getElementById(CART_CONFIG.ELEMENTS.ADDRESS_POSTAL),
            countryField: document.getElementById(CART_CONFIG.ELEMENTS.ADDRESS_COUNTRY)
        };
        this.cartTemplate = document.getElementById(CART_CONFIG.ELEMENTS.CART_TEMPLATE).innerHTML;
        this.init();
    }

    /**
     * @description Get the total price of all items in the cart
     * @returns {number}
     */
    get total() {
        return this.items.reduce((sum, item) => {
            return sum + (item.price ? item.price * item.quantity : 0);
        }, 0);
    }

    /**
     * @description Get the total number of items in the cart
     * @returns {number}
     */
    get count() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * @description Initializes the cart by loading saved items and setting up event listeners
     * @private
     */
    init() {
        this.loadCart();
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupAccordions();
    }

    /**
     * @description Sets up form validation event listeners
     * @private
     */
    setupFormValidation() {
        const form = this.elements.form;
        const nameField = this.elements.nameField;
        const emailField = this.elements.emailField;
        const tosField = this.elements.tosField;
        const submitButton = this.elements.submitButton;
        
        // Address fields
        const streetField = this.elements.streetField;
        const cityField = this.elements.cityField;
        const postalField = this.elements.postalField;
        const countryField = this.elements.countryField;

        if (!form || !nameField || !emailField || !tosField || !submitButton ||
            !streetField || !cityField || !postalField || !countryField) {
            console.error('Form elements not found');
            return;
        }

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Clear previous validation messages
            this.clearValidationMessages();
            
            // Validate form
            const isValid = this.validateForm();
            
            if (isValid) {
                // Update customer info
                this.customerInfo.name = nameField.value.trim();
                this.customerInfo.email = emailField.value.trim();
                this.customerInfo.acceptedTos = tosField.checked;
                
                // Ensure address object exists
                if (!this.customerInfo.address) {
                    this.customerInfo.address = {};
                }
                
                this.customerInfo.address.street = streetField.value.trim();
                this.customerInfo.address.city = cityField.value.trim();
                this.customerInfo.address.postal = postalField.value.trim();
                this.customerInfo.address.country = countryField.value;
                
                this.submitOrder();
            } else {
                // Show validation errors
                this.showValidationErrors();
            }
        });

        // Real-time validation
        [nameField, emailField, streetField, cityField, postalField, countryField].forEach(field => {
            field.addEventListener('input', () => {
                this.updateSubmitButtonState();
            });
        });

        tosField.addEventListener('change', () => {
            this.updateSubmitButtonState();
        });

        // Initial button state
        this.updateSubmitButtonState();
    }

    /**
     * @description Updates the submit button state based on form validity
     * @private
     */
    updateSubmitButtonState() {
        const form = this.elements.form;
        const submitButton = this.elements.submitButton;
        
        if (!form || !submitButton) return;

        const isFormValid = form.checkValidity();
        const hasItems = this.items.length > 0;
        
        submitButton.disabled = !isFormValid || !hasItems;
        
        // Update button text based on state
        const submitText = submitButton.querySelector('.checkout-btn-text');
        const submitLoading = submitButton.querySelector('.checkout-btn-loading');
        if (submitText) {
            if (!hasItems) {
                submitText.textContent = 'Cart is Empty';
            } else if (!isFormValid) {
                submitText.textContent = 'Complete Form';
            } else {
                submitText.textContent = 'Send Order';
            }
        }
    }

    /**
     * @description Validates a single form field
     * @param {HTMLElement} field - The form field to validate
     * @private
     */
    validateField(field) {
        const isValid = field.checkValidity();
        
        // Update visual state based on validation
        if (field.value.trim() === '') {
            // Don't show invalid state for empty fields until form submission
            field.classList.remove('invalid');
        } else {
            // Show validation state for fields with content
            if (isValid) {
                field.classList.remove('invalid');
            } else {
                field.classList.add('invalid');
            }
        }
    }

    /**
     * @description Validates the checkout form
     * @returns {boolean} True if form is valid
     * @private
     */
    validateForm() {
        const nameField = this.elements.nameField;
        const emailField = this.elements.emailField;
        const tosField = this.elements.tosField;
        const streetField = this.elements.streetField;
        const cityField = this.elements.cityField;
        const postalField = this.elements.postalField;
        const countryField = this.elements.countryField;

        let isValid = true;
        const errors = [];

        // Validate name
        if (!nameField.value.trim() || nameField.value.trim().length < 2) {
            isValid = false;
            errors.push('Name must be at least 2 characters long');
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailField.value.trim() || !emailRegex.test(emailField.value.trim())) {
            isValid = false;
            errors.push('Please enter a valid email address');
        }

        // Validate address fields
        if (!streetField.value.trim() || streetField.value.trim().length < 5) {
            isValid = false;
            errors.push('Street address must be at least 5 characters long');
        }

        if (!cityField.value.trim() || cityField.value.trim().length < 2) {
            isValid = false;
            errors.push('City must be at least 2 characters long');
        }

        if (!postalField.value.trim() || postalField.value.trim().length < 4) {
            isValid = false;
            errors.push('Postal code must be at least 4 characters long');
        }

        if (!countryField.value) {
            isValid = false;
            errors.push('Please select a country');
        }

        // Validate terms of service
        if (!tosField.checked) {
            isValid = false;
            errors.push('You must accept the Terms of Service');
        }

        // Store errors for display
        this.validationErrors = errors;

        return isValid;
    }

    /**
     * @description Clears validation messages from the UI
     * @private
     */
    clearValidationMessages() {
        const validationMessages = document.getElementById('cart-validation-messages');
        const successMessage = document.getElementById('cart-success-message');
        
        if (validationMessages) {
            validationMessages.classList.add('hidden');
        }
        
        if (successMessage) {
            successMessage.classList.add('hidden');
        }
    }

    /**
     * @description Shows validation errors in the UI
     * @private
     */
    showValidationErrors() {
        const validationMessages = document.getElementById('cart-validation-messages');
        const validationList = document.getElementById('cart-validation-list');
        
        if (validationMessages && validationList && this.validationErrors) {
            // Clear existing errors
            validationList.innerHTML = '';
            
            // Add each error as a list item
            this.validationErrors.forEach(error => {
                const li = document.createElement('li');
                li.textContent = error;
                validationList.appendChild(li);
            });
            
            // Show the validation messages container
            validationMessages.classList.remove('hidden');
        }
    }

    /**
     * @description Handles form submission
     * @private
     */
    handleFormSubmit() {
        if (this.items.length === 0) {
            alert('Your cart is empty');
            return;
        }

        if (!this.validateForm()) {
            // Let HTML5 validation handle the error display
            return;
        }

        this.processCheckout();
    }

    /**
     * @description Processes the checkout with customer and address information
     * @private
     */
    processCheckout() {
        if (this.items.length === 0) {
            alert('Your cart is empty');
            return;
        }

        // Build the text content with customer and address info
        let orderText = `Order Details:\n\n`;
        orderText += `Customer Information:\n`;
        orderText += `Name: ${this.customerInfo.name}\n`;
        orderText += `Email: ${this.customerInfo.email}\n\n`;
        
        orderText += `Delivery Address:\n`;
        orderText += `${this.customerInfo.address.street}\n`;
        orderText += `${this.customerInfo.address.city}, ${this.customerInfo.address.postal}\n`;
        orderText += `${this.customerInfo.address.country}\n\n`;
        
        orderText += `Items:\n`;
        this.items.forEach(item => {
            orderText += `- ${item.name}\n`;
            orderText += `  Quantity: ${item.quantity}\n`;
            if (item.price) {
                orderText += `  Price: €${(item.price * item.quantity).toFixed(2)}\n`;
            }
            orderText += '\n';
        });
        orderText += `Total: €${this.total.toFixed(2)}`;

        // Create email content
        const subject = encodeURIComponent('Order from ' + this.customerInfo.name);
        let bodyText = encodeURIComponent('Order Details:') + '%0D%0A%0D%0A';
        
        bodyText += encodeURIComponent('Customer Information:') + '%0D%0A';
        bodyText += encodeURIComponent('Name: ' + this.customerInfo.name) + '%0D%0A';
        bodyText += encodeURIComponent('Email: ' + this.customerInfo.email) + '%0D%0A%0D%0A';
        
        bodyText += encodeURIComponent('Delivery Address:') + '%0D%0A';
        bodyText += encodeURIComponent(this.customerInfo.address.street) + '%0D%0A';
        bodyText += encodeURIComponent(this.customerInfo.address.city + ', ' + this.customerInfo.address.postal) + '%0D%0A';
        bodyText += encodeURIComponent(this.customerInfo.address.country) + '%0D%0A%0D%0A';
        
        bodyText += encodeURIComponent('Items:') + '%0D%0A';
        this.items.forEach(item => {
            bodyText += encodeURIComponent('- ' + item.name) + '%0D%0A';
            bodyText += encodeURIComponent('  Quantity: ' + item.quantity) + '%0D%0A';
            if (item.price) {
                bodyText += encodeURIComponent('  Price: €' + (item.price * item.quantity).toFixed(2)) + '%0D%0A';
            }
            bodyText += '%0D%0A';
        });
        bodyText += encodeURIComponent('Total: €' + this.total.toFixed(2));

        // Copy to clipboard and open email
        navigator.clipboard.writeText(orderText)
            .then(() => {
                alert(`Thanks ${this.customerInfo.name}! I've copied your order to your clipboard - just paste it anywhere to send it to me. Can't wait to get started on it!`);
                
                // Create and open mailto link
                const mailtoLink = `mailto:contact@example.com?subject=${subject}&body=${bodyText}`;
                window.location.href = mailtoLink;
                
                this.clearFormAndCart();
            })
            .catch(err => {
                console.error('Failed to copy cart contents:', err);
                alert("Oops! Something went wrong while trying to copy your order. Opening email client instead!");
                
                // Fallback to just email if clipboard fails
                const mailtoLink = `mailto:contact@example.com?subject=${subject}&body=${bodyText}`;
                window.location.href = mailtoLink;
                
                this.clearFormAndCart();
            });
    }

    /**
     * @description Clears the form and cart after successful checkout
     * @private
     */
    clearFormAndCart() {
        // Clear the form
        const form = this.elements.form;
        if (form) {
            form.reset();
        }

        // Clear customer info
        this.customerInfo = this.createDefaultCustomerInfo();

        // Clear cart and close panel
        this.clearCart();
        this.togglePanel();
    }

    /**
     * @description Sets up all event listeners for cart functionality
     * @private
     */
    setupEventListeners() {
        // Cart button handlers
        document.getElementById(CART_CONFIG.ELEMENTS.CART_BUTTON).onclick = () => this.togglePanel();
        document.getElementById(CART_CONFIG.ELEMENTS.CART_BUTTON_MOBILE).onclick = () => this.togglePanel();
        document.getElementById(CART_CONFIG.ELEMENTS.CLOSE_CART).onclick = () => this.togglePanel();
        document.getElementById(CART_CONFIG.ELEMENTS.CLEAR_CART).onclick = () => this.clearCart();

        // Cart item actions
        document.getElementById(CART_CONFIG.ELEMENTS.CART_ITEMS).addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const productId = button.dataset.productId;

            switch (action) {
                case 'update-quantity':
                    const change = parseInt(button.dataset.change, 10);
                    const item = this.items.find(item => item.id === productId);
                    if (item) {
                        this.updateQuantity(productId, item.quantity, change);
                    }
                    break;
                case 'remove-item':
                    this.removeItem(productId);
                    break;
            }
        });

        // Add to cart event
        document.addEventListener('cart:add', (event) => {
            const { product } = event.detail;
            this.addItem(product);
        });

        // Close cart on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById(CART_CONFIG.ELEMENTS.CART_PANEL).classList.contains(CART_CONFIG.CLASSES.TRANSLATE_FULL)) {
                this.togglePanel();
            }
        });
    }

    /**
     * @description Toggles the visibility of the cart panel
     * @public
     */
    togglePanel() {
        const panel = document.getElementById(CART_CONFIG.ELEMENTS.CART_PANEL);
        const cartItems = document.getElementById(CART_CONFIG.ELEMENTS.CART_ITEMS);
        const template = document.getElementById(CART_CONFIG.ELEMENTS.CART_TEMPLATE);
        
        if (!panel || !cartItems || !template) {
            console.error('Required DOM elements not found');
            return;
        }
        
        panel.classList.toggle(CART_CONFIG.CLASSES.TRANSLATE_FULL);
    }

    /**
     * @description Adds an item to the cart or increments its quantity if it already exists
     * @param {Object} product - The product to add to the cart
     * @param {string} product.id - Product unique identifier
     * @param {string} product.name - Product name
     * @param {number|undefined} product.price - Product price
     * @param {string} product.image - Product image URL
     * @public
     */
    addItem(product) {
        if (!product || typeof product !== 'object') return;
        if (!product.id || !product.name || !product.image) {
            console.error('Invalid product data:', product);
            return;
        }

        const normalizedProduct = {
            ...product,
            id: String(product.id),
            price: product.price ? Number(product.price) : undefined
        };

        const existingItem = this.items.find(item => item.id === normalizedProduct.id);

        if (existingItem) {
            // Simply increment by 1, no need to check for undefined since we always initialize with 1
            existingItem.quantity += 1;
        } else {
            // Initialize new items with quantity 1
            normalizedProduct.quantity = 1;
            this.items.push(normalizedProduct);
        }

        this.updateCart();
    }

    /**
     * @description Removes an item from the cart
     * @param {string} productId - ID of the product to remove
     * @public
     */
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.updateCart();
    }

    /**
     * @description Updates the quantity of an item in the cart
     * @param {string} productId - ID of the product to update
     * @param {number} currentQty - Current quantity of the product
     * @param {number} change - Amount to change the quantity by (positive or negative)
     * @public
     */
    updateQuantity(productId, currentQty, change) {
        if (typeof productId !== 'string' || typeof currentQty !== 'number' || typeof change !== 'number') {
            console.error('Invalid arguments to updateQuantity');
            return;
        }

        const item = this.items.find(item => item.id === productId);
        if (!item) return;

        const newQty = currentQty + change;
        if (newQty <= 0) {
            this.removeItem(productId);
        } else {
            item.quantity = newQty;
            this.updateCart();
        }
    }

    /**
     * @description Clears all items from the cart
     */
    clearCart() {
        this.items = [];
        this.updateCart();
    }

    /**
     * @description Legacy checkout method - now redirects to form submission
     * @public
     * @deprecated Use form submission instead
     */
    checkout() {
        // Trigger form validation by attempting to submit
        const form = this.elements.form;
        if (form) {
            // Create a submit event to trigger HTML5 validation
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
        }
    }

    /**
     * @private
     * @description Updates cart state and triggers UI update
     */
    updateCart() {
        // Update UI elements
        document.getElementById(CART_CONFIG.ELEMENTS.CART_COUNT).textContent = this.count;
        document.getElementById(CART_CONFIG.ELEMENTS.CART_COUNT_MOBILE).textContent = this.count;
        
        // Update cart count badge in accordion
        const cartCountBadge = document.getElementById('cart-count-badge');
        if (cartCountBadge) {
            cartCountBadge.textContent = this.count;
        }
        
        document.getElementById(CART_CONFIG.ELEMENTS.CART_TOTAL).textContent = 
            `${CART_CONFIG.CURRENCY.SYMBOL}${this.total.toFixed(CART_CONFIG.CURRENCY.DECIMALS)}`;

        // Render items
        const cartItems = document.getElementById(CART_CONFIG.ELEMENTS.CART_ITEMS);
        const itemsWithTotals = this.items.map(item => ({
            ...item,
            total: item.price ? (item.price * item.quantity).toFixed(2) : undefined
        }));
        cartItems.innerHTML = Mustache.render(this.cartTemplate, { items: itemsWithTotals });

        // Update checkout button state
        const proceedToCheckoutBtn = document.getElementById('proceed-to-checkout');
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.disabled = this.items.length === 0;
        }

        // Update submit button state
        this.updateSubmitButtonState();

        // Save to localStorage
        localStorage.setItem(CART_CONFIG.STORAGE.CART_ITEMS, JSON.stringify(this.items));
    }

    /**
     * @private
     * @description Loads saved cart items from localStorage
     */
    loadCart() {
        try {
            const saved = localStorage.getItem(CART_CONFIG.STORAGE.CART_ITEMS);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    this.items = parsed;
                    this.updateCart();
                }
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.items = [];
        }
    }

    /**
     * @description Sets up accordion functionality for cart sections
     * @private
     */
    setupAccordions() {
        const cartItemsToggle = document.getElementById('cart-items-toggle');
        const checkoutFormToggle = document.getElementById('checkout-form-toggle');
        const cartItemsAccordion = document.getElementById('cart-items-accordion');
        const checkoutFormAccordion = document.getElementById('checkout-form-accordion');
        const cartItemsContent = document.getElementById('cart-items-content');
        const checkoutFormContent = document.getElementById('checkout-form-content');
        const proceedToCheckoutBtn = document.getElementById('proceed-to-checkout');

        if (!cartItemsToggle || !checkoutFormToggle || !cartItemsContent || !checkoutFormContent ||
            !cartItemsAccordion || !checkoutFormAccordion) {
            console.error('Accordion elements not found');
            return;
        }

        // Set initial state - cart items open by default
        this.setActiveAccordion('cart-items');

        // Cart items accordion toggle
        cartItemsToggle.addEventListener('click', () => {
            this.setActiveAccordion('cart-items');
        });

        // Checkout form accordion toggle
        checkoutFormToggle.addEventListener('click', () => {
            this.setActiveAccordion('checkout-form');
        });

        // Proceed to checkout button
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', () => {
                if (this.items.length === 0) {
                    alert('Your cart is empty. Please add items before proceeding to checkout.');
                    return;
                }
                this.setActiveAccordion('checkout-form');
            });
        }
    }

    /**
     * @description Sets the active accordion and ensures only one is open
     * @param {string} accordionName - Name of accordion to activate ('cart-items' or 'checkout-form')
     * @private
     */
    setActiveAccordion(accordionName) {
        const cartItemsAccordion = document.getElementById('cart-items-accordion');
        const checkoutFormAccordion = document.getElementById('checkout-form-accordion');
        const cartItemsContent = document.getElementById('cart-items-content');
        const checkoutFormContent = document.getElementById('checkout-form-content');
        const cartItemsChevron = document.getElementById('cart-items-chevron');
        const checkoutFormChevron = document.getElementById('checkout-form-chevron');

        // Reset all accordions to inactive state
        cartItemsAccordion.classList.remove('active');
        cartItemsAccordion.classList.add('inactive');
        checkoutFormAccordion.classList.remove('active');
        checkoutFormAccordion.classList.add('inactive');
        
        // Hide all content
        cartItemsContent.classList.add('hidden');
        checkoutFormContent.classList.add('hidden');
        
        // Reset chevrons
        cartItemsChevron.classList.remove('accordion-chevron-rotated');
        checkoutFormChevron.classList.remove('accordion-chevron-rotated');

        // Activate the selected accordion
        if (accordionName === 'cart-items') {
            cartItemsAccordion.classList.remove('inactive');
            cartItemsAccordion.classList.add('active');
            cartItemsContent.classList.remove('hidden');
            cartItemsChevron.classList.add('accordion-chevron-rotated');
        } else if (accordionName === 'checkout-form') {
            checkoutFormAccordion.classList.remove('inactive');
            checkoutFormAccordion.classList.add('active');
            checkoutFormContent.classList.remove('hidden');
            checkoutFormChevron.classList.add('accordion-chevron-rotated');
        }
    }

    /**
     * @description Submits the order
     * @private
     */
    submitOrder() {
        const submitButton = this.elements.submitButton;
        const submitText = submitButton.querySelector('.checkout-btn-text');
        const submitLoading = submitButton.querySelector('.checkout-btn-loading');
        const successMessage = document.getElementById('cart-success-message');

        // Show loading state
        submitButton.disabled = true;
        submitText.classList.add('hidden');
        submitLoading.classList.remove('hidden');

        // Prepare order data
        const orderData = {
            items: this.items,
            customer: this.customerInfo,
            total: this.total,
            timestamp: new Date().toISOString()
        };

        // Send email with order details
        this.sendOrderEmail(orderData)
            .then(() => {
                // Reset button state
                submitButton.disabled = false;
                submitText.classList.remove('hidden');
                submitLoading.classList.add('hidden');

                // Show success message
                if (successMessage) {
                    successMessage.classList.remove('hidden');
                }

                // Clear cart after successful order
                this.clearCart();

                // Reset form
                const form = this.elements.form;
                if (form) {
                    form.reset();
                }

                // Reset customer info
                this.customerInfo = this.createDefaultCustomerInfo();

                // Switch back to cart view after successful order
                setTimeout(() => {
                    this.setActiveAccordion('cart-items');
                }, 3000);

                console.log('Order submitted successfully:', orderData);
            })
            .catch((error) => {
                // Reset button state on error
                submitButton.disabled = false;
                submitText.classList.remove('hidden');
                submitLoading.classList.add('hidden');

                // Show error message
                alert('Failed to send order. Please try again or contact us directly.');
                console.error('Order submission failed:', error);
            });
    }

    /**
     * @description Sends order details via email
     * @param {Object} orderData - The order data to send
     * @returns {Promise} Promise that resolves when email is sent
     * @private
     */
    sendOrderEmail(orderData) {
        return new Promise((resolve, reject) => {
            // Create email content
            const subject = `New Order from ${orderData.customer.name}`;
            const body = this.formatOrderEmail(orderData);

            // Create mailto link
            const mailtoLink = `mailto:contact@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            try {
                // Copy email content to clipboard
                this.copyToClipboard(body)
                    .then(() => {
                        // Show alert with confirmation
                        const userConfirmed = confirm(
                            'Order details have been copied to your clipboard!\n\n' +
                            'Click OK to open your email client, or Cancel to handle manually.\n\n' +
                            'You can paste the order details into any email application.'
                        );

                        if (userConfirmed) {
                            // Open email client
                            window.location.href = mailtoLink;
                        }

                        // Resolve after user interaction
                        setTimeout(() => {
                            resolve();
                        }, 1000);
                    })
                    .catch(() => {
                        // Fallback if clipboard fails - still show alert
                        const userConfirmed = confirm(
                            'Click OK to open your email client with the order details.\n\n' +
                            'Note: Order details could not be copied to clipboard automatically.'
                        );

                        if (userConfirmed) {
                            window.location.href = mailtoLink;
                        }

                        setTimeout(() => {
                            resolve();
                        }, 1000);
                    });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @description Copies text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise} Promise that resolves when text is copied
     * @private
     */
    copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            // Modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text)
                    .then(resolve)
                    .catch(reject);
            } else {
                // Fallback for older browsers
                try {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    if (successful) {
                        resolve();
                    } else {
                        reject(new Error('Copy command failed'));
                    }
                } catch (error) {
                    reject(error);
                }
            }
        });
    }

    /**
     * @description Formats order data into email content
     * @param {Object} orderData - The order data to format
     * @returns {string} Formatted email body
     * @private
     */
    formatOrderEmail(orderData) {
        let emailBody = `New Order Details:\n\n`;
        
        // Customer information
        emailBody += `Customer Information:\n`;
        emailBody += `Name: ${orderData.customer.name}\n`;
        emailBody += `Email: ${orderData.customer.email}\n\n`;
        
        // Address information
        emailBody += `Shipping Address:\n`;
        emailBody += `Street: ${orderData.customer.address.street}\n`;
        emailBody += `City: ${orderData.customer.address.city}\n`;
        emailBody += `Postal Code: ${orderData.customer.address.postal}\n`;
        emailBody += `Country: ${orderData.customer.address.country}\n\n`;
        
        // Order items
        emailBody += `Order Items:\n`;
        orderData.items.forEach((item, index) => {
            const itemTotal = item.price ? (item.price * item.quantity).toFixed(2) : 'N/A';
            emailBody += `${index + 1}. ${item.name}\n`;
            emailBody += `   Quantity: ${item.quantity}\n`;
            emailBody += `   Price: €${item.price ? item.price.toFixed(2) : 'N/A'}\n`;
            emailBody += `   Total: €${itemTotal}\n\n`;
        });
        
        // Order total
        emailBody += `Order Total: €${orderData.total.toFixed(2)}\n\n`;
        
        // Timestamp
        emailBody += `Order Date: ${new Date(orderData.timestamp).toLocaleString()}\n\n`;
        
        emailBody += `Please process this order and contact the customer for payment and delivery arrangements.\n`;
        
        return emailBody;
    }

    createDefaultCustomerInfo() {
        return {
            name: '', email: '', acceptedTos: false,
            address: { street: '', city: '', postal: '', country: '' }
        };
    }
}

// Initialize cart when DOM is loaded
const cartInit = () => {
    window.cart = new ShoppingCart();
    document.removeEventListener('DOMContentLoaded', cartInit);
};
document.addEventListener('DOMContentLoaded', cartInit);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShoppingCart };
}