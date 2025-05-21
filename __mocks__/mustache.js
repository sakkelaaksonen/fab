module.exports = {
    render: jest.fn().mockReturnValue(`
        <div class="product-card" data-product-id="1">
            <button class="add-to-cart-btn"></button>
        </div>
    `)
}; 