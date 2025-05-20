class ShoppingCart {
    constructor() {
        this.items = [];
        this.total = 0;
        this.count = 0;
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Update cart button click handlers for both desktop and mobile
        document.getElementById('cart-button').onclick = () => this.togglePanel();
        document.getElementById('cart-button-mobile').onclick = () => this.togglePanel();
        document.getElementById('close-cart').onclick = () => this.togglePanel();
        document.getElementById('clear-cart').onclick = () => this.clearCart();
        document.getElementById('checkout-btn').onclick = () => this.checkout();

        // Listen for add to cart clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-add-to-cart]')) {
                const productCard = e.target.closest('.product-card');
                this.addItem({
                    id: productCard.dataset.id,
                    name: productCard.querySelector('h3').textContent,
                    price: parseFloat(productCard.dataset.price),
                    image: productCard.querySelector('img').src
                });
            }
        });

        // Close cart on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('cart-panel').classList.contains('translate-x-full')) {
                this.togglePanel();
            }
        });
    }

    togglePanel() {
        const panel = document.getElementById('cart-panel');
        const buttonContainer = document.getElementById('cart-button-container');
        
        panel.classList.toggle('translate-x-full');
        
        // Toggle cart button visibility
        if (panel.classList.contains('translate-x-full')) {
            buttonContainer.classList.remove('opacity-0');
            buttonContainer.classList.remove('pointer-events-none');
        } else {
            buttonContainer.classList.add('opacity-0');
            buttonContainer.classList.add('pointer-events-none');
        }
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.updateCart();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.updateCart();
    }

    updateQuantity(productId, currentQty, change) {
        const newQty = currentQty + change;
        if (newQty <= 0) {
            this.removeItem(productId);
        } else {
            const item = this.items.find(item => item.id === productId);
            if (item) {
                item.quantity = newQty;
                this.updateCart();
            }
        }
    }

    clearCart() {
        this.items = [];
        this.updateCart();
    }

    checkout() {
        if (this.items.length === 0) {
            alert('Your cart is empty');
            return;
        }

        // Create email content
        const subject = encodeURIComponent('Order');
        
        // Build the body text with explicit line breaks
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

        // Create mailto link with encoded components
        const mailtoLink = `mailto:contact@example.com?subject=${subject}&body=${bodyText}`;
        
        // For debugging
        console.log('Mailto link:', mailtoLink);
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Close cart panel
        this.togglePanel();
    }

    updateCart() {
        // Update count for both desktop and mobile
        this.count = this.items.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart-count').textContent = this.count;
        document.getElementById('cart-count-mobile').textContent = this.count;

        // Update items display using template from HTML
        const cartItems = document.getElementById('cart-items');
        const template = document.getElementById('cartItemTemplate').innerHTML;
        cartItems.innerHTML = Mustache.render(template, { items: this.items });

        // Update total
        this.total = this.items.reduce((sum, item) => {
            return sum + (item.price ? item.price * item.quantity : 0);
        }, 0);
        document.getElementById('cart-total').textContent = `€${this.total.toFixed(2)}`;

        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    loadCart() {
        const saved = localStorage.getItem('cart');
        if (saved) {
            this.items = JSON.parse(saved);
            this.updateCart();
        }
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
});