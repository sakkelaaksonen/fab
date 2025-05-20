const products = [
    {
        name: "Product 1",
        price: 100,
        id: 1,
        description: "This is the first product",
        image: "product1.jpg"
    },
    {
        name: "Product 2",
        price: 200,
        id: 2,
        description: "This is the second product",
        image: "product2.jpg"
    },
    {
        name: "Product 3",
        price: 300,
        id: 3,
        description: "This is the third product",
        image: "product3.jpg"
    },
    {
        name: "Product 4",
        price: 400,
        id: 4,
        description: "This is the fourth product",
        image: "product4.jpg"
    },
    {
        name: "Product 5",
        id: 5,
        description: "This is the fifth product",
        image: "product5.jpg"
    },
    {
        name: "Product 6",
        id: 6,
        image: "product6.jpg"
    },
    
]

function start() {
    const productTemplate = document.getElementById('productTemplate').innerHTML;  
    const productContainer = document.getElementById('js-products');
    productContainer.innerHTML = Mustache.render(productTemplate, { products });
}

document.addEventListener('DOMContentLoaded', start);