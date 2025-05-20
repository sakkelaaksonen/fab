const products = [
    {
        name: "Product 1",
        price: 100,
        image: "product1.jpg"
    },
    {
        name: "Product 2",
        price: 200,
        image: "product2.jpg"
    },
    {
        name: "Product 3",
        price: 300,
        image: "product3.jpg"
    },
    {
        name: "Product 4",
        price: 400,
        image: "product4.jpg"
    },
    {
        name: "Product 5",
        price: 500,
        image: "product5.jpg"
    },
    {
        name: "Product 6",
        price: 600,
        image: "product6.jpg"
    },
    
]

function start() {
    const productTemplate = document.getElementById('productTemplate').innerHTML;  
    const productContainer = document.getElementById('js-products');
    productContainer.innerHTML = Mustache.render(productTemplate, { products });
}

document.addEventListener('DOMContentLoaded', start);