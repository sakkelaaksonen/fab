/**
 * @typedef {Object} Product
 * @property {string} id - Unique identifier for the product
 * @property {string} name - Product name
 * @property {string} description - Product description
 * @property {number} price - Product price
 * @property {string} image - Product image URL
 */

class ProductCard {
    /**
     * @type {Product[]}
     */
    static products = [
        {
            name: "Product 1",
            price: 100,
            id: "1",
            description: "This is the first product",
            image: "product1.jpg"
        },
        {
            name: "Product 2",
            price: 200,
            id: "2",
            description: "This is the second product",
            image: "product2.jpg"
        },
        {
            name: "Product 3",
            price: 300,
            id: "3",
            description: "This is the third product",
            image: "product3.jpg"
        },
        {
            name: "Product 4",
            price: 400,
            id: "4",
            description: "This is the fourth product",
            image: "product4.jpg"
        },
        {
            name: "Product 5",
            id: "5",
            description: "This is the fifth product",
            image: "product5.jpg"
        },
        {
            name: "Product 6",
            id: "6",
            image: "product6.jpg"
        },
    ];

    /**
     * Find a product by its ID
     * @param {string} id - Product ID to find
     * @returns {Product|undefined} Found product or undefined
     */
    static findProductById(id) {
        return this.products.find(p => p.id === id);
    }

    /**
     * Normalize product data for cart
     * @param {Product} product - Product to normalize
     * @returns {Product} Normalized product copy
     */
    static normalizeProduct(product) {
        const normalized = JSON.parse(JSON.stringify(product));
        normalized.id = String(normalized.id);
        if (normalized.price) {
            normalized.price = parseFloat(normalized.price);
        }
        return normalized;
    }

    /**
     * Initialize product cards and bind event handlers
     */
    static init() {
        // Get all product cards
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const addToCartBtn = card.querySelector('.add-to-cart-btn');
            const productId = card.dataset.productId;
            
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => {
                    this.addToCart(productId);
                });
            }
        });
    }

    /**
     * Add product to cart by ID
     * @param {string} productId - Product ID to add to cart
     */
    static addToCart(productId) {
        const product = this.findProductById(productId);
        
        if (!product) {
            console.error(`Product with ID ${productId} not found`);
            return;
        }

        // Create a normalized copy of the product
        const productCopy = this.normalizeProduct(product);
        
        // Dispatch custom event with product copy
        const event = new CustomEvent('cart:add', {
            detail: { product: productCopy }
        });
        document.dispatchEvent(event);
    }
}

function start() {
    const productTemplate = document.getElementById('productTemplate').innerHTML;  
    const productContainer = document.getElementById('js-products');
    productContainer.innerHTML = Mustache.render(productTemplate, { products: ProductCard.products });
    ProductCard.init(); // Make sure to initialize after rendering
}

// Initialize product cards when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    start();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductCard, start };
}