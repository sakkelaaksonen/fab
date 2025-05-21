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
        const product = this.products.find(p => p.id === productId);
        
        if (!product) {
            console.error(`Product with ID ${productId} not found`);
            return;
        }

        // Create a deep copy of the product object
        const productCopy = JSON.parse(JSON.stringify(product));
        
        // Ensure price is a number
        if (productCopy.price) {
            productCopy.price = parseFloat(productCopy.price);
        }
        
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