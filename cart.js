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
        document.getElementById('cart-button').onclick = () => this.togglePanel();
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
    }

    togglePanel() {
        document.getElementById('cart-panel').classList.toggle('translate-x-full');
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
        // Redirect to contact section
        window.location.href = '#contact';
        this.togglePanel();
    }

    updateCart() {
        // Update count
        this.count = this.items.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart-count').textContent = this.count;

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