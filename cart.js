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
        CART_TEMPLATE: 'cartItemTemplate'
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
        document.getElementById(CART_CONFIG.ELEMENTS.CHECKOUT_BUTTON).onclick = () => this.checkout();

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
     * @description Removes all items from the cart
     * @public
     */
    clearCart() {
        this.items = [];
        this.updateCart();
    }

    /**
     * @description Processes the checkout by copying cart contents to clipboard and opening email client
     * @public
     */
    checkout() {
        if (this.items.length === 0) {
            alert('Your cart is empty');
            return;
        }

        // Build the text content
        let orderText = 'Order Details:\n\n';
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
        const subject = encodeURIComponent('Order');
        let bodyText = 'Order Details:%0D%0A%0D%0A';
        this.items.forEach(item => {
            bodyText += encodeURIComponent('- ' + item.name) + '%0D%0A';
            bodyText += encodeURIComponent('  Quantity: ' + item.quantity) + '%0D%0A';
            if (item.price) {
                bodyText += encodeURIComponent('  Price: €' + (item.price * item.quantity).toFixed(2)) + '%0D%0A';
            }
            bodyText += '%0D%0A';
        });
        bodyText += encodeURIComponent('Total: €' + this.total.toFixed(2));

        // Copy to clipboard first
        navigator.clipboard.writeText(orderText)
            .then(() => {
                alert("Thanks for shopping! I've copied your order to your clipboard - just paste it anywhere to send it to me. Can't wait to get started on it!");
                
                // Create and open mailto link
                const mailtoLink = `mailto:contact@example.com?subject=${subject}&body=${bodyText}`;
                window.location.href = mailtoLink;
                
                this.togglePanel();
            })
            .catch(err => {
                console.error('Failed to copy cart contents:', err);
                alert("Oops! Something went wrong while trying to copy your order. Opening email client instead!");
                
                // Fallback to just email if clipboard fails
                const mailtoLink = `mailto:contact@example.com?subject=${subject}&body=${bodyText}`;
                window.location.href = mailtoLink;
                
                this.togglePanel();
            });
    }

    /**
     * @private
     * @description Updates cart state and triggers UI update
     */
    updateCart() {
        // Update UI elements
        document.getElementById(CART_CONFIG.ELEMENTS.CART_COUNT).textContent = this.count;
        document.getElementById(CART_CONFIG.ELEMENTS.CART_COUNT_MOBILE).textContent = this.count;
        document.getElementById(CART_CONFIG.ELEMENTS.CART_TOTAL).textContent = 
            `${CART_CONFIG.CURRENCY.SYMBOL}${this.total.toFixed(CART_CONFIG.CURRENCY.DECIMALS)}`;

        // Render items
        const cartItems = document.getElementById(CART_CONFIG.ELEMENTS.CART_ITEMS);
        const template = document.getElementById(CART_CONFIG.ELEMENTS.CART_TEMPLATE).innerHTML;
        const itemsWithTotals = this.items.map(item => ({
            ...item,
            total: item.price ? (item.price * item.quantity).toFixed(2) : undefined
        }));
        cartItems.innerHTML = Mustache.render(template, { items: itemsWithTotals });

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