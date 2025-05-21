/**
 * @jest-environment jsdom
 */

// Mock Mustache
jest.mock('mustache');

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock clipboard API
global.navigator.clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined)
};

// Mock Mustache globally
global.Mustache = require('mustache');

// Import ShoppingCart class
const { ShoppingCart } = require('../cart.js');

describe('ShoppingCart', () => {
    let cart;
    let domElements;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Clear localStorage
        localStorage.clear();
        
        // Setup DOM
        document.body.innerHTML = `
            <div id="cart-panel" class="translate-x-full"></div>
            <button id="cart-button"></button>
            <button id="cart-button-mobile"></button>
            <button id="close-cart"></button>
            <button id="clear-cart"></button>
            <button id="checkout-btn"></button>
            <span id="cart-count">0</span>
            <span id="cart-count-mobile">0</span>
            <div id="cart-items"></div>
            <span id="cart-total">€0.00</span>
            <script id="cartItemTemplate" type="x-tmpl-mustache">
                {{#items}}
                <div class="cart-item">
                    <h3>{{name}}</h3>
                    <p>{{quantity}}</p>
                    {{#price}}<p>€{{total}}</p>{{/price}}
                </div>
                {{/items}}
            </script>
        `;

        // Store DOM elements for testing
        domElements = {
            cartCount: document.getElementById('cart-count'),
            cartCountMobile: document.getElementById('cart-count-mobile'),
            cartTotal: document.getElementById('cart-total'),
            cartItems: document.getElementById('cart-items')
        };

        // Reset Mustache mock
        Mustache.render.mockClear();

        // Create new cart instance with clean state
        cart = new ShoppingCart();
        
        // Clear any items that might have been loaded from localStorage
        cart.clearCart();
    });

    test('initializes with empty cart', () => {
        expect(cart.items).toHaveLength(0);
        expect(cart.total).toBe(0);
        expect(cart.count).toBe(0);
        expect(domElements.cartCount.textContent).toBe('0');
        expect(domElements.cartTotal.textContent).toBe('€0.00');
    });

    test('adds item to cart', () => {
        const product = {
            id: '1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg'
        };

        cart.addItem(product);

        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity).toBe(1);
        expect(cart.total).toBe(100);
        expect(cart.count).toBe(1);
        expect(domElements.cartCount.textContent).toBe('1');
        expect(domElements.cartTotal.textContent).toBe('€100.00');
    });

    test('increases quantity by one when adding same item again', () => {
        const product = {
            id: '1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg'
        };

        cart.addItem(product); // quantity = 1
        cart.addItem(product); // quantity should increase to 2

        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity).toBe(2);
        expect(cart.total).toBe(200);
        expect(cart.count).toBe(2);
        expect(domElements.cartCount.textContent).toBe('2');
        expect(domElements.cartTotal.textContent).toBe('€200.00');
    });

    test('updates quantity by specified amount', () => {
        const product = {
            id: '1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg'
        };

        cart.addItem(product); // Start with quantity = 1
        cart.updateQuantity('1', cart.items[0].quantity, 2); // Add 2 more, total should be 3

        expect(cart.items[0].quantity).toBe(3);
        expect(cart.total).toBe(300);
        expect(cart.count).toBe(3);
        expect(domElements.cartCount.textContent).toBe('3');
        expect(domElements.cartTotal.textContent).toBe('€300.00');
    });

    test('removes item from cart', () => {
        const product = {
            id: '1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg'
        };

        cart.addItem(product);
        cart.removeItem('1');

        expect(cart.items).toHaveLength(0);
        expect(cart.total).toBe(0);
        expect(cart.count).toBe(0);
        expect(domElements.cartCount.textContent).toBe('0');
        expect(domElements.cartTotal.textContent).toBe('€0.00');
    });

    test('removes item when quantity updated to 0', () => {
        const product = {
            id: '1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg'
        };

        cart.addItem(product);
        cart.updateQuantity('1', 1, -1);

        expect(cart.items).toHaveLength(0);
        expect(cart.total).toBe(0);
        expect(cart.count).toBe(0);
        expect(domElements.cartCount.textContent).toBe('0');
        expect(domElements.cartTotal.textContent).toBe('€0.00');
    });

    test('clears cart', () => {
        const product = {
            id: '1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg'
        };

        cart.addItem(product);
        cart.clearCart();

        expect(cart.items).toHaveLength(0);
        expect(cart.total).toBe(0);
        expect(cart.count).toBe(0);
        expect(domElements.cartCount.textContent).toBe('0');
        expect(domElements.cartTotal.textContent).toBe('€0.00');
    });

    test('handles items without price', () => {
        const product = {
            id: '1',
            name: 'Test Product',
            image: 'test.jpg'
        };

        cart.addItem(product);

        expect(cart.items).toHaveLength(1);
        expect(cart.total).toBe(0);
        expect(cart.count).toBe(1);
        expect(domElements.cartCount.textContent).toBe('1');
        expect(domElements.cartTotal.textContent).toBe('€0.00');
    });

    test('validates product data before adding', () => {
        const invalidProduct = {
            id: '1'
        };

        cart.addItem(invalidProduct);

        expect(cart.items).toHaveLength(0);
        expect(cart.total).toBe(0);
        expect(cart.count).toBe(0);
    });
}); 