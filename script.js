// Constants
const API_URL = 'https://fakestoreapi.com/products';

// State
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];

// DOM Elements
const productList = document.getElementById('product-list');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPriceElement = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const clearCartBtn = document.getElementById('clear-cart');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const ordersList = document.getElementById('orders-list');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount(); // Initialize badge count

    if (productList) {
        fetchProducts();
    }
    if (cartItemsContainer) {
        renderCart();
        setupCartListeners();
    }
    if (ordersList) {
        renderOrders();
    }
});

// --- Helper Functions ---
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.innerText = count;
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// --- Products Page Logic ---
async function fetchProducts() {
    try {
        productList.innerHTML = `
            <div class="text-center w-100 py-5">
                <div class="spinner-border loading-spinner" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading products...</p>
            </div>
        `;
        const response = await fetch(API_URL);
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        productList.innerHTML = '<div class="text-center text-danger w-100">Failed to load products. Please try again later.</div>';
    }
}

function renderProducts(products) {
    productList.innerHTML = '';
    products.forEach(product => {
        // Escape quotes to prevent HTML attribute breakage
        const safeTitle = product.title.replace(/"/g, '&quot;').replace(/'/g, "&#39;");

        const productCard = document.createElement('div');
        productCard.classList.add('col-md-4', 'col-lg-3', 'mb-4');

        productCard.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${product.image}" class="card-img-top p-3" alt="${safeTitle}" style="height: 200px; object-fit: contain;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title" title="${safeTitle}">${product.title}</h5>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="card-text fw-bold text-success fs-5">$${product.price.toFixed(2)}</span>
                    </div>
                    <button class="btn btn-success mt-3 w-100 add-to-cart-btn" 
                        data-id="${product.id}" 
                        data-title="${safeTitle}" 
                        data-price="${product.price}" 
                        data-image="${product.image}">
                        <i class="fa-solid fa-cart-shopping me-2"></i>Add to Cart
                    </button>
                </div>
            </div>
        `;

        productList.appendChild(productCard);
    });

    // Add Event Listeners for "Add to Cart" buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', addToCart);
    });
}

function addToCart(e) {
    const btn = e.target.closest('button');
    const id = parseInt(btn.dataset.id);
    const title = btn.dataset.title;
    const price = parseFloat(btn.dataset.price);
    const image = btn.dataset.image;

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, title, price, image, quantity: 1 });
    }

    saveCart();
    alert(`${title} added to cart!`);
}

// --- Cart Page Logic ---
function renderCart() {
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '';
        if (emptyCartMsg) emptyCartMsg.classList.remove('d-none');
        if (document.querySelector('.table-responsive')) document.querySelector('.table-responsive').classList.add('d-none');
        if (cartTotalPriceElement) cartTotalPriceElement.innerText = '$0.00';
        return;
    }

    if (emptyCartMsg) emptyCartMsg.classList.add('d-none');
    if (document.querySelector('.table-responsive')) document.querySelector('.table-responsive').classList.remove('d-none');

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const row = document.createElement('tr');

        cartItemsContainer.appendChild(row);
    });

    if (cartTotalPriceElement) cartTotalPriceElement.innerText = `$${total.toFixed(2)}`;
}

function setupCartListeners() {
    if (!cartItemsContainer) return;

    cartItemsContainer.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('button')?.dataset.id);
        if (!id) return;

        if (e.target.closest('.increase-qty')) {
            updateQuantity(id, 1);
        } else if (e.target.closest('.decrease-qty')) {
            updateQuantity(id, -1);
        } else if (e.target.closest('.remove-item')) {
            removeItem(id);
        }
    });

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your cart?')) {
                cart = [];
                saveCart();
                renderCart();
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        // Prevent quantity from going below 1 via buttons, user must use remove button
        // Or we allow 0 to remove? Standard UI usually keeps it at 1 or removes.
        // My previous logic removed it if <= 0. That's fine.
        item.quantity += change;
        if (item.quantity <= 0) {
            removeItem(id);
        } else {
            saveCart();
            renderCart();
        }
    }
}

function removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
}

function handleCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const order = {
        id: new Date().getTime(),
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    cart = [];
    saveCart();

    alert('Order placed successfully! Redirecting to orders page...');
    window.location.href = 'order.html';
}

// --- Order Page Logic ---
function renderOrders() {
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="text-center">No past orders found.</div>';
        return;
    }

    ordersList.innerHTML = '';
    orders.reverse().forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('card', 'mb-3');

        let itemsHtml = '<ul class="list-group list-group-flush">';
        order.items.forEach(item => {
            itemsHtml
        });
        itemsHtml += '</ul>';


        ordersList.appendChild(orderCard);
    });
}
