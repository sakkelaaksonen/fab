create a static Webshop html file Fine Arts Benin (FAB)

Mobile first layout
Use Tailwind CSS
Use WGAC AAA accessibility guidelines

Sections
- Hero
    - 1 image
    - 1 headline
    - 1 subheadline
    - 1 cta button
- About
    - 1 image
    - 1 headline
    - 1 subheadline
- Products
    - 6 image cards with text and price
- Contact
    - instructions for purchase
    - email, phone, address, bank account
- Footer
    - social media links
    - copyright 





# Shopping Cart
Create a simple shopping cart component using vanilla javascrit.
Features:
- Add a product to the cart
- Remove a product from the cart
- View the cart
- Checkout
- Clear the cart
- Update the cart
- Calculate the total price
- Display the cart items
- Display the number of items in the cart
- Display the total price

Top bar has a cart icon with the number of items in the cart
Opens a side panel to display the cart items
Use Mustache.js to render the cart items
Use Tailwind CSS for styling



# Cart refactoring
 - Bind event handlers for product cards in in products.js, not in html template.
 - ProductCard.AddToCart should add an item to the cart using only ID reference. Correct item is placed in the cart from as a copy of the product object.
 - 