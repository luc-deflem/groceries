class GroceryApp {
    constructor() {
        // Check if localStorage is working
        this.checkStorageHealth();
        
        this.currentTab = 'shopping';
        this.currentEditingItem = null;
        
        // Load data directly from localStorage (with sample data for new users)
        this.shoppingItems = this.loadShoppingItems();
        this.standardItems = this.loadStandardItems();
        this.categories = this.loadCategories();
        this.allProducts = this.loadAllProducts();
        
        this.initializeDefaultCategories();
        this.initializeElements();
        this.attachEventListeners();
        
        // Update category selects with current categories
        this.updateCategorySelects();
        
        // Sync products with shopping and pantry items
        this.syncProductsWithExistingItems();
        
        // Update lists from products (makes products the master list)
        this.syncListsFromProducts();
        
        this.render();
        this.updateDeviceInfo();
        
        console.log('🛒 Grocery Manager initialized with localStorage');
        console.log(`📊 Data loaded: ${this.shoppingItems.length} shopping items, ${this.standardItems.length} pantry items, ${this.categories.length} categories, ${this.allProducts.length} products`);
        console.log(`📱 Device: ${this.getDeviceInfo()}`);
    }

    initializeDefaultCategories() {
        if (this.categories.length === 0) {
            this.categories = [
                {id: 'produce', name: 'produce', emoji: '🥬', order: 0, isDefault: true},
                {id: 'dairy', name: 'dairy', emoji: '🥛', order: 1, isDefault: true},
                {id: 'meat', name: 'meat', emoji: '🥩', order: 2, isDefault: true},
                {id: 'pantry', name: 'pantry', emoji: '🥫', order: 3, isDefault: true},
                {id: 'frozen', name: 'frozen', emoji: '🧊', order: 4, isDefault: true},
                {id: 'bakery', name: 'bakery', emoji: '🍞', order: 5, isDefault: true},
                {id: 'other', name: 'other', emoji: '📦', order: 6, isDefault: true}
            ];
            this.saveCategories();
        }
    }

    initializeElements() {
        // Header elements
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Shopping tab elements
        this.itemInput = document.getElementById('itemInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.addBtn = document.getElementById('addBtn');
        this.groceryList = document.getElementById('groceryList');
        this.itemCount = document.getElementById('itemCount');
        this.clearCompletedBtn = document.getElementById('clearCompleted');

        // Pantry tab elements
        this.standardItemInput = document.getElementById('standardItemInput');
        this.standardCategorySelect = document.getElementById('standardCategorySelect');
        this.addStandardBtn = document.getElementById('addStandardBtn');
        this.standardList = document.getElementById('standardList');
        this.addAllUnstockedBtn = document.getElementById('addAllUnstocked');

        // Category tab elements
        this.categoryInput = document.getElementById('categoryInput');
        this.categoryEmojiInput = document.getElementById('categoryEmojiInput');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');
        this.categoriesList = document.getElementById('categoriesList');

        // Products elements
        this.productSearchInput = document.getElementById('productSearchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.productInput = document.getElementById('productInput');
        this.productCategorySelect = document.getElementById('productCategorySelect');
        this.addProductBtn = document.getElementById('addProductBtn');
        this.productsList = document.getElementById('productsList');
        this.productCount = document.getElementById('productCount');
        this.filteredCount = document.getElementById('filteredCount');

        // Sync elements
        this.exportDataBtn = document.getElementById('exportDataBtn');
        this.importDataBtn = document.getElementById('importDataBtn');
        this.importFileInput = document.getElementById('importFileInput');


        // Modal elements
        this.changeCategoryModal = document.getElementById('changeCategoryModal');
        this.itemNameSpan = document.getElementById('itemNameSpan');
        this.newCategorySelect = document.getElementById('newCategorySelect');
        this.cancelChangeCategoryBtn = document.getElementById('cancelChangeCategory');
        this.confirmChangeCategoryBtn = document.getElementById('confirmChangeCategory');
        this.closeModalBtn = document.querySelector('.close-modal');
        
        // Product edit modal elements
        this.productEditModal = document.getElementById('productEditModal');
        this.editProductName = document.getElementById('editProductName');
        this.editProductCategory = document.getElementById('editProductCategory');
        this.editInShopping = document.getElementById('editInShopping');
        this.editInPantry = document.getElementById('editInPantry');
        this.editInStock = document.getElementById('editInStock');
        this.editInSeason = document.getElementById('editInSeason');
        this.closeProductModalBtn = document.getElementById('closeProductModal');
        this.cancelProductEditBtn = document.getElementById('cancelProductEdit');
        this.confirmProductEditBtn = document.getElementById('confirmProductEdit');
    }

    attachEventListeners() {
        // Header events
        this.refreshBtn.addEventListener('click', () => this.hardRefresh());
        
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Shopping list events
        this.addBtn.addEventListener('click', () => this.addShoppingItem());
        this.itemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addShoppingItem();
        });
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Pantry events
        this.addStandardBtn.addEventListener('click', () => this.addStandardItem());
        this.standardItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addStandardItem();
        });
        this.addAllUnstockedBtn.addEventListener('click', () => this.addAllUnstockedToShopping());

        // Category events
        this.addCategoryBtn.addEventListener('click', () => this.addCategory());
        this.categoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });

        // Products events
        this.addProductBtn.addEventListener('click', () => this.addProduct());
        this.productInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addProduct();
        });
        this.productSearchInput.addEventListener('input', () => this.searchProducts());
        this.clearSearchBtn.addEventListener('click', () => this.clearProductSearch());

        // Sync events
        this.exportDataBtn.addEventListener('click', () => this.exportData());
        this.importDataBtn.addEventListener('click', () => this.importFileInput.click());
        this.importFileInput.addEventListener('change', (e) => this.handleFileImport(e));


        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelChangeCategoryBtn.addEventListener('click', () => this.closeModal());
        this.confirmChangeCategoryBtn.addEventListener('click', () => this.confirmCategoryChange());
        
        // Product edit modal events
        this.closeProductModalBtn.addEventListener('click', () => this.closeProductEditModal());
        this.cancelProductEditBtn.addEventListener('click', () => this.closeProductEditModal());
        this.confirmProductEditBtn.addEventListener('click', () => this.confirmProductEdit());
        
        // Close modal when clicking outside
        this.changeCategoryModal.addEventListener('click', (e) => {
            if (e.target === this.changeCategoryModal) {
                this.closeModal();
            }
        });
        
        this.productEditModal.addEventListener('click', (e) => {
            if (e.target === this.productEditModal) {
                this.closeProductEditModal();
            }
        });
    }

    // Category Management Methods
    addCategory() {
        const categoryName = this.categoryInput.value.trim().toLowerCase();
        const categoryEmoji = this.categoryEmojiInput.value.trim() || '🏷️';

        if (!categoryName) {
            this.categoryInput.focus();
            return;
        }

        // Check if category already exists
        const existingCategory = this.categories.find(cat => cat.name === categoryName);
        if (existingCategory) {
            alert('A category with this name already exists!');
            this.categoryInput.value = '';
            return;
        }

        const newCategory = {
            id: categoryName,
            name: categoryName,
            emoji: categoryEmoji,
            order: this.categories.length,
            isDefault: false
        };

        this.categories.push(newCategory);
        this.categoryInput.value = '';
        this.categoryEmojiInput.value = '';
        this.categoryInput.focus();
        this.saveCategories();
        this.updateCategorySelects();
        this.render();
    }

    deleteCategory(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        
        // Check if category is being used
        const usedInShopping = this.shoppingItems.some(item => item.category === categoryId);
        const usedInStandard = this.standardItems.some(item => item.category === categoryId);

        if (usedInShopping || usedInStandard) {
            alert('Cannot delete category that is being used by items. Move items to other categories first.');
            return;
        }

        if (confirm(`Are you sure you want to delete the "${category.name}" category?`)) {
            this.categories = this.categories.filter(cat => cat.id !== categoryId);
            this.saveCategories();
            this.updateCategorySelects();
            this.render();
        }
    }

    editCategory(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category) return;

        const newName = prompt('Enter new category name:', category.name);
        if (newName && newName.trim() && newName.trim() !== category.name) {
            const trimmedName = newName.trim().toLowerCase();
            
            // Check if name already exists (excluding current category)
            if (this.categories.some(cat => cat.id !== categoryId && cat.name === trimmedName)) {
                alert('A category with this name already exists!');
                return;
            }

            const newEmoji = prompt('Enter new emoji:', category.emoji);
            if (newEmoji !== null) {
                const oldId = category.id;
                const newId = trimmedName;
                
                // Update category
                category.name = trimmedName;
                category.id = newId;
                category.emoji = newEmoji.trim() || category.emoji;
                
                // Update all items that use this category
                this.shoppingItems.forEach(item => {
                    if (item.category === oldId) {
                        item.category = newId;
                    }
                });
                this.standardItems.forEach(item => {
                    if (item.category === oldId) {
                        item.category = newId;
                    }
                });
                
                this.saveCategories();
                this.saveShoppingItems();
                this.saveStandardItems();
                this.updateCategorySelects();
                this.render();
            }
        }
    }

    editShoppingItem(itemId) {
        // Find the corresponding product in the master list
        const product = this.allProducts.find(product => product.id === itemId);
        if (!product) return;
        
        // Use the comprehensive product edit modal
        this.openProductEditModal(product);
    }

    editStandardItem(itemId) {
        // Find the corresponding product in the master list
        const product = this.allProducts.find(product => product.id === itemId);
        if (!product) return;
        
        // Use the comprehensive product edit modal
        this.openProductEditModal(product);
    }

    // Products Methods
    addProduct() {
        console.log('📝 Adding product...');
        const productName = this.productInput.value.trim();
        const category = this.productCategorySelect.value;

        console.log('Product name:', productName, 'Category:', category);

        if (!productName) {
            this.productInput.focus();
            return;
        }

        // Check if product already exists
        const existingProduct = this.allProducts.find(product => 
            product.name.toLowerCase() === productName.toLowerCase()
        );

        if (existingProduct) {
            alert('This product already exists in your products list!');
            this.productInput.value = '';
            return;
        }

        const newProduct = {
            id: Date.now(),
            name: productName,
            category: category,
            inShopping: false,
            inPantry: false,
            inStock: false,
            inSeason: true,
            completed: false,
            dateAdded: new Date().toISOString()
        };

        this.allProducts.push(newProduct);
        this.productInput.value = '';
        this.productInput.focus();
        this.saveAllProducts();
        this.render();
    }

    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            // Remove from products master list
            this.allProducts = this.allProducts.filter(product => product.id !== productId);
            
            // Remove from shopping list (they use the same ID)
            this.shoppingItems = this.shoppingItems.filter(item => item.id !== productId);
            
            // Remove from pantry list (they use the same ID)
            this.standardItems = this.standardItems.filter(item => item.id !== productId);
            
            // Save all lists
            this.saveAllProducts();
            this.saveShoppingItems();
            this.saveStandardItems();
            
            this.render();
        }
    }

    editProduct(productId) {
        const product = this.allProducts.find(product => product.id === productId);
        if (!product) return;
        
        this.openProductEditModal(product);
    }

    addProductToShopping(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product) return;

        if (product.inShopping) {
            alert('This item is already in your shopping list!');
            return;
        }

        // Update product status
        product.inShopping = true;
        product.completed = false;
        
        this.saveAllProducts();
        this.syncListsFromProducts();
        this.switchTab('shopping');
    }

    toggleProductShopping(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product) return;

        product.inShopping = !product.inShopping;
        if (!product.inShopping) {
            product.completed = false;
        }
        
        this.saveAllProducts();
        this.syncListsFromProducts();
        this.render();
    }

    toggleProductPantry(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product) return;

        product.inPantry = !product.inPantry;
        if (!product.inPantry) {
            product.inStock = false;
            product.inSeason = true;
        } else {
            product.inStock = true;
            product.inSeason = true;
        }
        
        this.saveAllProducts();
        this.syncListsFromProducts();
        this.render();
    }

    toggleProductStock(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product || !product.inPantry) return;

        product.inStock = !product.inStock;
        
        this.saveAllProducts();
        this.syncListsFromProducts();
        this.render();
    }

    toggleProductSeason(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product || !product.inPantry) return;

        product.inSeason = !product.inSeason;
        if (!product.inSeason) {
            product.inStock = false;
        }
        
        this.saveAllProducts();
        this.syncListsFromProducts();
        this.render();
    }

    toggleProductCompleted(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product || !product.inShopping) return;

        product.completed = !product.completed;
        
        this.saveAllProducts();
        this.syncListsFromProducts();
        this.render();
    }

    searchProducts() {
        this.render();
    }

    clearProductSearch() {
        this.productSearchInput.value = '';
        this.render();
    }

    getProductStatus(product) {
        return {
            inShopping: product.inShopping || false,
            inPantry: product.inPantry || false,
            inStock: product.inStock || false,
            inSeason: product.inSeason !== false,
            completed: product.completed || false
        };
    }

    syncProductsWithExistingItems() {
        let hasChanges = false;

        // Add shopping items to products if they don't exist
        this.shoppingItems.forEach(shoppingItem => {
            const existingProduct = this.allProducts.find(product => 
                product.name.toLowerCase() === shoppingItem.name.toLowerCase() && 
                product.category === shoppingItem.category
            );

            if (!existingProduct) {
                const newProduct = {
                    id: Date.now() + Math.random(),
                    name: shoppingItem.name,
                    category: shoppingItem.category,
                    inShopping: true,
                    inPantry: shoppingItem.fromStandard || false,
                    inStock: false,
                    inSeason: true,
                    completed: shoppingItem.completed || false,
                    dateAdded: shoppingItem.dateAdded || new Date().toISOString()
                };
                this.allProducts.push(newProduct);
                hasChanges = true;
            } else {
                // Update existing product to reflect shopping status
                existingProduct.inShopping = true;
                existingProduct.completed = shoppingItem.completed || false;
                if (shoppingItem.fromStandard) {
                    existingProduct.inPantry = true;
                }
                hasChanges = true;
            }
        });

        // Add pantry items to products if they don't exist
        this.standardItems.forEach(standardItem => {
            const existingProduct = this.allProducts.find(product => 
                product.name.toLowerCase() === standardItem.name.toLowerCase() && 
                product.category === standardItem.category
            );

            if (!existingProduct) {
                const newProduct = {
                    id: Date.now() + Math.random(),
                    name: standardItem.name,
                    category: standardItem.category,
                    inShopping: false,
                    inPantry: true,
                    inStock: standardItem.inStock !== undefined ? standardItem.inStock : true,
                    inSeason: standardItem.inSeason !== undefined ? standardItem.inSeason : true,
                    completed: false,
                    dateAdded: standardItem.dateAdded || new Date().toISOString()
                };
                this.allProducts.push(newProduct);
                hasChanges = true;
            } else {
                // Update existing product to reflect pantry status
                existingProduct.inPantry = true;
                existingProduct.inStock = standardItem.inStock !== undefined ? standardItem.inStock : true;
                existingProduct.inSeason = standardItem.inSeason !== undefined ? standardItem.inSeason : true;
                hasChanges = true;
            }
        });

        if (hasChanges) {
            this.saveAllProducts();
            console.log('🔄 Synced products with existing shopping and pantry items');
        }
    }

    syncListsFromProducts() {
        // Update shopping list from products
        this.shoppingItems = this.allProducts
            .filter(product => product.inShopping)
            .map(product => ({
                id: product.id,
                name: product.name,
                category: product.category,
                completed: product.completed || false,
                dateAdded: product.dateAdded,
                fromStandard: product.inPantry || false
            }));

        // Update pantry list from products
        this.standardItems = this.allProducts
            .filter(product => product.inPantry)
            .map(product => ({
                id: product.id,
                name: product.name,
                category: product.category,
                inStock: product.inStock || false,
                inSeason: product.inSeason !== false,
                dateAdded: product.dateAdded
            }));

        this.saveShoppingItems();
        this.saveStandardItems();
        console.log('🔄 Synced shopping and pantry lists from products');
    }

    moveCategory(fromIndex, toIndex) {
        const category = this.categories.splice(fromIndex, 1)[0];
        this.categories.splice(toIndex, 0, category);
        
        // Update order property
        this.categories.forEach((cat, index) => {
            cat.order = index;
        });
        
        this.saveCategories();
        this.render();
    }

    getCategoryOrder() {
        return this.categories.sort((a, b) => a.order - b.order).map(cat => cat.id);
    }

    updateCategorySelects() {
        const sortedCategories = this.categories.sort((a, b) => a.order - b.order);
        const options = sortedCategories.map(cat => 
            `<option value="${cat.id}">${cat.emoji} ${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</option>`
        ).join('');

        this.categorySelect.innerHTML = options;
        this.standardCategorySelect.innerHTML = options;
        this.newCategorySelect.innerHTML = options;
        
        // Update product category selects
        if (this.productCategorySelect) {
            this.productCategorySelect.innerHTML = options;
        }
        if (this.editProductCategory) {
            this.editProductCategory.innerHTML = options;
        }
    }

    // Item Category Change Methods
    openCategoryChangeModal(itemId, itemType) {
        const item = itemType === 'shopping' 
            ? this.shoppingItems.find(i => i.id === itemId)
            : this.standardItems.find(i => i.id === itemId);
        
        if (!item) return;

        this.currentEditingItem = {id: itemId, type: itemType, item: item};
        this.itemNameSpan.textContent = item.name;
        this.newCategorySelect.value = item.category;
        this.changeCategoryModal.style.display = 'block';
    }

    closeModal() {
        this.changeCategoryModal.style.display = 'none';
        this.currentEditingItem = null;
    }

    confirmCategoryChange() {
        if (!this.currentEditingItem) return;

        const newCategory = this.newCategorySelect.value;
        const {id, type, item} = this.currentEditingItem;

        item.category = newCategory;

        if (type === 'shopping') {
            this.saveShoppingItems();
        } else {
            this.saveStandardItems();
        }

        this.closeModal();
        this.render();
    }

    openProductEditModal(product) {
        this.currentEditingProduct = product;
        
        // Populate modal fields with current product data
        this.editProductName.value = product.name;
        this.editProductCategory.value = product.category;
        this.editInShopping.checked = product.inShopping || false;
        this.editInPantry.checked = product.inPantry || false;
        this.editInStock.checked = product.inStock || false;
        this.editInSeason.checked = product.inSeason !== false; // Default to true if not set
        
        this.productEditModal.style.display = 'block';
    }

    closeProductEditModal() {
        this.productEditModal.style.display = 'none';
        this.currentEditingProduct = null;
    }

    confirmProductEdit() {
        if (!this.currentEditingProduct) return;

        const product = this.currentEditingProduct;
        const newName = this.editProductName.value.trim();
        const newCategory = this.editProductCategory.value;
        const newInShopping = this.editInShopping.checked;
        const newInPantry = this.editInPantry.checked;
        const newInStock = this.editInStock.checked;
        const newInSeason = this.editInSeason.checked;

        if (!newName) {
            alert('Product name cannot be empty');
            return;
        }

        // Update product with new values
        product.name = newName;
        product.category = newCategory;
        product.inShopping = newInShopping;
        product.inPantry = newInPantry;
        product.inStock = newInStock;
        product.inSeason = newInSeason;

        // Update shopping and pantry lists to sync with product changes
        this.syncListsFromProducts();
        
        this.saveAllProducts();
        this.saveShoppingItems();
        this.saveStandardItems();
        
        this.closeProductEditModal();
        this.render();
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        if (tabName === 'categories') {
            this.updateCategorySelects();
        }
        
        if (tabName === 'products') {
            this.updateCategorySelects();
        }

        this.render();
    }

    // Shopping List Methods
    addShoppingItem() {
        const itemName = this.itemInput.value.trim();
        const category = this.categorySelect.value;

        if (!itemName) {
            this.itemInput.focus();
            return;
        }

        // Find or create product in master list
        let product = this.allProducts.find(p => 
            p.name.toLowerCase() === itemName.toLowerCase() && 
            p.category === category
        );

        if (product) {
            // Update existing product
            product.inShopping = true;
            product.completed = false;
        } else {
            // Create new product
            product = {
                id: Date.now(),
                name: itemName,
                category: category,
                inShopping: true,
                inPantry: false,
                inStock: false,
                inSeason: true,
                completed: false,
                dateAdded: new Date().toISOString()
            };
            this.allProducts.push(product);
        }

        this.itemInput.value = '';
        this.itemInput.focus();
        this.saveAllProducts();
        this.syncListsFromProducts();
        this.render();
    }

    toggleShoppingItem(id) {
        // Update in products master list
        const product = this.allProducts.find(p => p.id === id);
        if (product) {
            const wasCompleted = product.completed;
            product.completed = !product.completed;
            
            // If marking as completed and it's a pantry item, mark as in stock
            if (product.completed && product.inPantry) {
                product.inStock = true;
                console.log(`✅ Marked ${product.name} as completed and back in stock`);
            }
            // If unmarking as completed and it's a pantry item, mark as out of stock
            else if (!product.completed && wasCompleted && product.inPantry) {
                product.inStock = false;
                console.log(`❌ Unmarked ${product.name} as completed, now out of stock`);
            }
            
            this.saveAllProducts();
            this.syncListsFromProducts();
            this.render();
        }
    }

    deleteShoppingItem(id) {
        // Update in products master list
        const product = this.allProducts.find(p => p.id === id);
        if (product) {
            product.inShopping = false;
            product.completed = false;
            this.saveAllProducts();
            this.syncListsFromProducts();
            this.render();
        }
    }

    markAsInStock(id) {
        const item = this.shoppingItems.find(item => item.id === id);
        if (item && item.fromStandard) {
            // Find the corresponding standard item and mark it as in stock
            const standardItem = this.standardItems.find(std => 
                std.name.toLowerCase() === item.name.toLowerCase() && 
                std.category === item.category
            );
            if (standardItem) {
                standardItem.inStock = true;
                this.saveStandardItems();
            }
        }
        // Remove from shopping list
        this.deleteShoppingItem(id);
    }

    clearCompleted() {
        // Update products master list - remove completed items from shopping
        this.allProducts.forEach(product => {
            if (product.completed && product.inShopping) {
                product.inShopping = false;
                product.completed = false;
                
                // If it was a pantry item that was completed, keep it in stock
                if (product.inPantry) {
                    product.inStock = true;
                    console.log(`🧹 Cleared completed ${product.name}, kept in pantry stock`);
                }
            }
        });
        
        this.saveAllProducts();
        this.syncListsFromProducts();
        this.render();
    }

    // Standard Items (Pantry) Methods
    addStandardItem() {
        const itemName = this.standardItemInput.value.trim();
        const category = this.standardCategorySelect.value;

        if (!itemName) {
            this.standardItemInput.focus();
            return;
        }

        // Find or create product in master list
        let product = this.allProducts.find(p => 
            p.name.toLowerCase() === itemName.toLowerCase() && 
            p.category === category
        );

        if (product) {
            // Update existing product
            product.inPantry = true;
            product.inStock = true;
            product.inSeason = true;
        } else {
            // Create new product
            product = {
                id: Date.now(),
                name: itemName,
                category: category,
                inShopping: false,
                inPantry: true,
                inStock: true,
                inSeason: true,
                completed: false,
                dateAdded: new Date().toISOString()
            };
            this.allProducts.push(product);
        }

        this.standardItemInput.value = '';
        this.standardItemInput.focus();
        this.saveAllProducts();
        this.syncListsFromProducts();
        this.render();
    }

    toggleStandardItemStock(id) {
        // Update in products master list
        const product = this.allProducts.find(p => p.id === id);
        if (product && product.inPantry) {
            product.inStock = !product.inStock;
            
            // Only add to shopping list if item is in season
            if (!product.inStock && product.inSeason !== false) {
                product.inShopping = true;
            } else if (product.inStock) {
                // If marking as in stock, remove from shopping list
                product.inShopping = false;
                product.completed = false;
            }
            
            this.saveAllProducts();
            this.syncListsFromProducts();
            this.render();
        }
    }

    toggleStandardItemSeason(id) {
        // Update in products master list
        const product = this.allProducts.find(p => p.id === id);
        if (product && product.inPantry) {
            product.inSeason = !product.inSeason;
            // If moving out of season, automatically mark as not in stock
            if (!product.inSeason) {
                product.inStock = false;
                product.inShopping = false;
                product.completed = false;
            }
            
            this.saveAllProducts();
            this.syncListsFromProducts();
            this.render();
        }
    }

    deleteStandardItem(id) {
        // Update in products master list
        const product = this.allProducts.find(p => p.id === id);
        if (product) {
            product.inPantry = false;
            product.inStock = false;
            product.inSeason = true;
            this.saveAllProducts();
            this.syncListsFromProducts();
            this.render();
        }
    }

    addToShoppingFromStandard(standardItem) {
        // Check if already in shopping list
        const existsInShopping = this.shoppingItems.find(item => 
            item.name.toLowerCase() === standardItem.name.toLowerCase() && 
            item.category === standardItem.category
        );

        if (!existsInShopping) {
            const shoppingItem = {
                id: Date.now(),
                name: standardItem.name,
                category: standardItem.category,
                completed: false,
                dateAdded: new Date().toISOString(),
                fromStandard: true
            };
            this.shoppingItems.unshift(shoppingItem);
            this.saveShoppingItems();
        }
    }

    removeFromShoppingIfExists(standardItem) {
        this.shoppingItems = this.shoppingItems.filter(item => 
            !(item.name.toLowerCase() === standardItem.name.toLowerCase() && 
              item.category === standardItem.category && 
              item.fromStandard)
        );
        this.saveShoppingItems();
    }

    addAllUnstockedToShopping() {
        const unstockedItems = this.standardItems.filter(item => !item.inStock && item.inSeason !== false);
        let addedCount = 0;

        unstockedItems.forEach(standardItem => {
            const existsInShopping = this.shoppingItems.find(item => 
                item.name.toLowerCase() === standardItem.name.toLowerCase() && 
                item.category === standardItem.category
            );

            if (!existsInShopping) {
                const shoppingItem = {
                    id: Date.now() + Math.random(),
                    name: standardItem.name,
                    category: standardItem.category,
                    completed: false,
                    dateAdded: new Date().toISOString(),
                    fromStandard: true
                };
                this.shoppingItems.unshift(shoppingItem);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.saveShoppingItems();
            this.switchTab('shopping');
        }
    }

    // Rendering Methods
    render() {
        if (this.currentTab === 'shopping') {
            this.renderShoppingList();
        } else if (this.currentTab === 'pantry') {
            this.renderStandardList();
        } else if (this.currentTab === 'products') {
            this.renderProductsList();
        } else if (this.currentTab === 'categories') {
            this.renderCategoriesList();
        } else if (this.currentTab === 'sync') {
            // Sync tab doesn't need dynamic rendering
        }
    }

    renderShoppingList() {
        this.updateItemCount();
        
        if (this.shoppingItems.length === 0) {
            this.groceryList.innerHTML = `
                <div class="empty-state">
                    <span class="emoji">🛒</span>
                    <p>Your shopping list is empty</p>
                    <p>Add items above or check your pantry stock!</p>
                </div>
            `;
            return;
        }

        const activeItems = this.shoppingItems.filter(item => !item.completed);
        const completedItems = this.shoppingItems.filter(item => item.completed);
        
        let html = '';
        
        // Group active items by category
        if (activeItems.length > 0) {
            const groupedItems = this.groupItemsByCategory(activeItems);
            const categoryOrder = this.getCategoryOrder();
            
            categoryOrder.forEach(categoryKey => {
                if (groupedItems[categoryKey] && groupedItems[categoryKey].length > 0) {
                    html += this.renderCategorySection(categoryKey, groupedItems[categoryKey]);
                }
            });
        }
        
        // Add bought section if there are completed items (ordered by category)
        if (completedItems.length > 0) {
            const sortedCompletedItems = this.sortItemsByCategory(completedItems);
            html += this.renderBoughtSection(sortedCompletedItems);
        }
        
        this.groceryList.innerHTML = html;
    }

    renderStandardList() {
        if (this.standardItems.length === 0) {
            this.standardList.innerHTML = `
                <div class="empty-state">
                    <span class="emoji">🏠</span>
                    <p>Your pantry list is empty</p>
                    <p>Add standard grocery items you usually keep in stock!</p>
                </div>
            `;
            return;
        }

        // Separate in-season and out-of-season items
        const inSeasonItems = this.standardItems.filter(item => item.inSeason !== false);
        const outOfSeasonItems = this.standardItems.filter(item => item.inSeason === false);

        let html = '';

        // Render in-season items by category
        if (inSeasonItems.length > 0) {
            const groupedItems = this.groupItemsByCategory(inSeasonItems);
            const categoryOrder = this.getCategoryOrder();
            
            categoryOrder.forEach(categoryKey => {
                if (groupedItems[categoryKey] && groupedItems[categoryKey].length > 0) {
                    html += this.renderStandardCategorySection(categoryKey, groupedItems[categoryKey]);
                }
            });
        }

        // Render out-of-season section at the bottom
        if (outOfSeasonItems.length > 0) {
            html += this.renderOutOfSeasonSection(outOfSeasonItems);
        }
        
        this.standardList.innerHTML = html;
    }

    renderCategoriesList() {
        const sortedCategories = this.categories.sort((a, b) => a.order - b.order);
        
        if (sortedCategories.length === 0) {
            this.categoriesList.innerHTML = `
                <div class="empty-state">
                    <span class="emoji">⚙️</span>
                    <p>No categories found</p>
                </div>
            `;
            return;
        }

        this.categoriesList.innerHTML = sortedCategories.map((category, index) => `
            <div class="category-item" data-category-id="${category.id}" data-index="${index}">
                <div class="category-drag-handle">⋮⋮</div>
                <div class="category-info" onclick="app.editCategory('${category.id}')" style="cursor: pointer;" title="Click to edit">
                    <div class="category-emoji">${category.emoji}</div>
                    <div class="category-name">${category.name.charAt(0).toUpperCase() + category.name.slice(1)}</div>
                </div>
                <div class="category-actions">
                    <button class="edit-category-btn" onclick="app.editCategory('${category.id}')" title="Edit category">✏️</button>
                    <button class="delete-btn" onclick="app.deleteCategory('${category.id}')" title="Delete category">×</button>
                </div>
            </div>
        `).join('');

        // Add drag and drop functionality
        this.initializeDragAndDrop();
    }

    initializeDragAndDrop() {
        const categoryItems = this.categoriesList.querySelectorAll('.category-item');
        
        categoryItems.forEach((item, index) => {
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                item.classList.add('dragging');
                e.dataTransfer.setData('text/plain', index);
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = parseInt(item.dataset.index);
                
                if (fromIndex !== toIndex) {
                    this.moveCategory(fromIndex, toIndex);
                }
            });
        });
    }

    renderStandardCategorySection(category, items) {
        const categoryData = this.categories.find(cat => cat.id === category);
        const categoryName = categoryData ? categoryData.name.charAt(0).toUpperCase() + categoryData.name.slice(1) : category;
        const categoryEmoji = categoryData ? categoryData.emoji : '📦';
        const inStockCount = items.filter(item => item.inStock).length;
        
        return `
            <div class="category-section">
                <div class="category-header">
                    <span class="category-title">${categoryEmoji} ${categoryName}</span>
                    <span class="category-count">${inStockCount}/${items.length} in stock</span>
                </div>
                <div class="category-items">
                    ${items.map(item => this.renderStandardItem(item)).join('')}
                </div>
            </div>
        `;
    }

    renderStandardItem(item) {
        // Default to in season for backward compatibility
        const inSeason = item.inSeason !== undefined ? item.inSeason : true;
        
        return `
            <div class="stock-item ${item.inStock ? '' : 'out-of-stock'} ${!inSeason ? 'out-of-season' : ''}" data-id="${item.id}">
                <input 
                    type="checkbox" 
                    class="stock-checkbox" 
                    ${item.inStock ? 'checked' : ''}
                    onchange="app.toggleStandardItemStock(${item.id})"
                    title="In stock"
                >
                <div class="stock-content" onclick="app.editStandardItem(${item.id})" style="cursor: pointer;" title="Click to edit item name">
                    <div class="stock-name">${this.escapeHtml(item.name)}</div>
                    <div class="stock-status ${item.inStock ? 'in-stock' : 'out-of-stock'}">
                        ${item.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                    </div>
                </div>
                <div class="stock-actions">
                    <input 
                        type="checkbox" 
                        class="season-checkbox" 
                        ${inSeason ? 'checked' : ''}
                        onchange="app.toggleStandardItemSeason(${item.id})"
                        title="In season"
                    >
                    ${!item.inStock && inSeason ? `<button class="add-to-list-btn" onclick="app.addToShoppingFromStandard({id: ${item.id}, name: '${item.name}', category: '${item.category}'})" title="Add to shopping list">+</button>` : ''}
                    <button class="edit-category-btn" onclick="app.openCategoryChangeModal(${item.id}, 'standard')" title="Change category">✏️</button>
                    <button class="delete-btn" onclick="app.deleteStandardItem(${item.id})">×</button>
                </div>
            </div>
        `;
    }

    groupItemsByCategory(items) {
        const groups = items.reduce((groups, item) => {
            if (!groups[item.category]) {
                groups[item.category] = [];
            }
            groups[item.category].push(item);
            return groups;
        }, {});
        
        // Sort items alphabetically within each category
        Object.keys(groups).forEach(category => {
            groups[category].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        });
        
        return groups;
    }

    renderCategorySection(category, items) {
        const categoryData = this.categories.find(cat => cat.id === category);
        const categoryName = categoryData ? categoryData.name.charAt(0).toUpperCase() + categoryData.name.slice(1) : category;
        const categoryEmoji = categoryData ? categoryData.emoji : '📦';
        
        return `
            <div class="category-section">
                <div class="category-header">
                    <span class="category-title">${categoryEmoji} ${categoryName}</span>
                    <span class="category-count">${items.length}</span>
                </div>
                <div class="category-items">
                    ${items.map(item => this.renderShoppingItem(item, false)).join('')}
                </div>
            </div>
        `;
    }

    renderBoughtSection(items) {
        return `
            <div class="bought-section">
                <div class="bought-header">
                    <span class="bought-title">✅ Bought</span>
                    <span class="bought-count">${items.length}</span>
                </div>
                <div class="bought-items">
                    ${items.map(item => this.renderShoppingItem(item, true)).join('')}
                </div>
            </div>
        `;
    }

    renderOutOfSeasonSection(items) {
        return `
            <div class="out-of-season-section">
                <div class="out-of-season-header">
                    <span class="out-of-season-title">🌐 Out of Season</span>
                    <span class="out-of-season-count">${items.length}</span>
                </div>
                <div class="out-of-season-items">
                    ${items.map(item => this.renderStandardItem(item)).join('')}
                </div>
            </div>
        `;
    }

    renderProductsList() {
        console.log('🔍 Rendering products list, total products:', this.allProducts.length);
        
        const searchTerm = this.productSearchInput ? this.productSearchInput.value.trim().toLowerCase() : '';
        let filteredProducts = this.allProducts;

        if (searchTerm) {
            filteredProducts = this.allProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
        }

        this.updateProductCount(filteredProducts.length);

        if (this.allProducts.length === 0) {
            if (this.productsList) {
                this.productsList.innerHTML = `
                    <div class="empty-state">
                        <span class="emoji">📋</span>
                        <p>Your products list is empty</p>
                        <p>Add products that you might need for recipes and menus!</p>
                    </div>
                `;
            }
            return;
        }

        if (filteredProducts.length === 0) {
            if (this.productsList) {
                this.productsList.innerHTML = `
                    <div class="empty-state">
                        <span class="emoji">🔍</span>
                        <p>No products found</p>
                        <p>Try a different search term</p>
                    </div>
                `;
            }
            return;
        }

        // Group by category and render
        const groupedProducts = this.groupItemsByCategory(filteredProducts);
        const categoryOrder = this.getCategoryOrder();
        
        let html = '';
        categoryOrder.forEach(categoryKey => {
            if (groupedProducts[categoryKey] && groupedProducts[categoryKey].length > 0) {
                html += this.renderProductCategorySection(categoryKey, groupedProducts[categoryKey]);
            }
        });
        
        if (this.productsList) {
            this.productsList.innerHTML = html;
            console.log('✅ Products list rendered with', filteredProducts.length, 'products');
        } else {
            console.error('❌ Products list element not found!');
        }
    }

    renderProductCategorySection(category, products) {
        const categoryData = this.categories.find(cat => cat.id === category);
        const categoryName = categoryData ? categoryData.name.charAt(0).toUpperCase() + categoryData.name.slice(1) : category;
        const categoryEmoji = categoryData ? categoryData.emoji : '📦';
        
        return `
            <div class="category-section">
                <div class="category-header">
                    <span class="category-title">${categoryEmoji} ${categoryName}</span>
                    <span class="category-count">${products.length}</span>
                </div>
                <div class="category-items">
                    ${products.map(product => this.renderProduct(product)).join('')}
                </div>
            </div>
        `;
    }

    renderProduct(product) {
        const status = this.getProductStatus(product);
        const statusIndicators = [];
        
        if (status.inShopping) statusIndicators.push('🛒 Shopping');
        if (status.inPantry) statusIndicators.push('🏠 Pantry');
        if (status.inStock) statusIndicators.push('✅ Stock');
        if (status.inPantry && !status.inStock) statusIndicators.push('<span class="status-nostock">❌ NoStock</span>');
        if (status.inSeason) statusIndicators.push('🌱 Season');
        if (!status.inSeason) statusIndicators.push('<span class="status-notseason">🚫 NotSeason</span>');
        
        const statusText = statusIndicators.length > 0 ? statusIndicators.join(' • ') : '📋 Available';
        
        return `
            <div class="product-item ${status.inShopping ? 'in-shopping' : ''} ${status.inPantry ? 'in-pantry' : ''}" data-id="${product.id}">
                <div class="product-checkboxes">
                    <label class="product-checkbox-label" title="Add to shopping list">
                        <input 
                            type="checkbox" 
                            class="product-checkbox shopping-checkbox" 
                            ${status.inShopping ? 'checked' : ''}
                            onchange="app.toggleProductShopping(${product.id})"
                        >
                        <span class="checkbox-text">🛒</span>
                    </label>
                    <label class="product-checkbox-label" title="Add to pantry">
                        <input 
                            type="checkbox" 
                            class="product-checkbox pantry-checkbox" 
                            ${status.inPantry ? 'checked' : ''}
                            onchange="app.toggleProductPantry(${product.id})"
                        >
                        <span class="checkbox-text">🏠</span>
                    </label>
                </div>
                <div class="product-content" onclick="app.editProduct(${product.id})" style="cursor: pointer;" title="Click to edit product name">
                    <div class="product-name">${this.escapeHtml(product.name)}</div>
                    <div class="product-status">${statusText}</div>
                </div>
                <div class="product-actions">
                    <button class="edit-category-btn" onclick="app.openCategoryChangeModal(${product.id}, 'product')" title="Change category">✏️</button>
                    <button class="delete-btn" onclick="app.deleteProduct(${product.id})" title="Delete product">×</button>
                </div>
            </div>
        `;
    }

    updateProductCount(filteredCount = null) {
        if (this.productCount) {
            this.productCount.textContent = `${this.allProducts.length} products`;
        }
        
        if (this.filteredCount) {
            if (filteredCount !== null && filteredCount !== this.allProducts.length) {
                this.filteredCount.textContent = `${filteredCount} shown`;
                this.filteredCount.style.display = 'inline';
            } else {
                this.filteredCount.style.display = 'none';
            }
        }
    }

    renderShoppingItem(item, showCategory = false) {
        const categoryData = this.categories.find(cat => cat.id === item.category);
        const categoryEmoji = categoryData ? categoryData.emoji : '📦';
        
        return `
            <div class="grocery-item category-${item.category} ${item.completed ? 'completed' : ''}" data-id="${item.id}">
                <input 
                    type="checkbox" 
                    class="item-checkbox" 
                    ${item.completed ? 'checked' : ''}
                    onchange="app.toggleShoppingItem(${item.id})"
                >
                <div class="item-content" onclick="app.editShoppingItem(${item.id})" style="cursor: pointer;" title="Click to edit item name">
                    <div class="item-name">${this.escapeHtml(item.name)}</div>
                    ${showCategory ? `<div class="item-category-small">${categoryEmoji} ${item.category}</div>` : ''}
                </div>
                <div class="item-actions">
                    ${item.fromStandard ? `<button class="stock-btn" onclick="app.markAsInStock(${item.id})" title="Mark as in stock">📦</button>` : ''}
                    <button class="edit-category-btn" onclick="app.openCategoryChangeModal(${item.id}, 'shopping')" title="Change category">✏️</button>
                    <button class="delete-btn" onclick="app.deleteShoppingItem(${item.id})">×</button>
                </div>
            </div>
        `;
    }

    sortItemsByCategory(items) {
        const categoryOrder = this.getCategoryOrder();
        return items.sort((a, b) => {
            const aIndex = categoryOrder.indexOf(a.category);
            const bIndex = categoryOrder.indexOf(b.category);
            
            // If same category, sort alphabetically by name
            if (aIndex === bIndex) {
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            }
            
            // Otherwise sort by category order
            return aIndex - bIndex;
        });
    }

    updateItemCount() {
        const total = this.shoppingItems.length;
        const completed = this.shoppingItems.filter(item => item.completed).length;
        const remaining = total - completed;
        
        if (total === 0) {
            this.itemCount.textContent = '0 items';
        } else {
            this.itemCount.textContent = `${remaining} of ${total} items remaining`;
        }
    }

    getCategoryEmoji(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.emoji : '📦';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getDeviceInfo() {
        const userAgent = navigator.userAgent;
        
        // Detect device type
        if (/iPad/.test(userAgent)) {
            return 'iPad';
        } else if (/iPhone/.test(userAgent)) {
            return 'iPhone';
        } else if (/Macintosh/.test(userAgent)) {
            return 'Mac';
        } else if (/Android/.test(userAgent)) {
            return /Mobile/.test(userAgent) ? 'Android Phone' : 'Android Tablet';
        } else if (/Mobile/.test(userAgent)) {
            return 'Mobile';
        } else {
            return 'Desktop';
        }
    }

    isLargeScreen() {
        // Consider Mac and iPad as large screens for future recipe/menu management
        const deviceInfo = this.getDeviceInfo();
        return deviceInfo === 'Mac' || deviceInfo === 'iPad' || deviceInfo === 'Desktop';
    }

    isMobileDevice() {
        const deviceInfo = this.getDeviceInfo();
        return deviceInfo === 'iPhone' || deviceInfo === 'Android Phone' || deviceInfo === 'Mobile';
    }

    updateDeviceInfo() {
        const deviceInfo = this.getDeviceInfo();
        const header = document.querySelector('header h1');
        
        if (header) {
            const deviceEmoji = {
                'iPhone': '📱',
                'iPad': '📱', 
                'Mac': '💻',
                'Android Phone': '📱',
                'Android Tablet': '📱',
                'Desktop': '💻',
                'Mobile': '📱'
            };
            
            header.innerHTML = `${deviceEmoji[deviceInfo] || '🛒'} Grocery Manager`;
            
            // Add device class to body for CSS targeting
            document.body.className = `device-${deviceInfo.toLowerCase().replace(' ', '-')}`;
        }
    }

    hardRefresh() {
        console.log('🔄 Performing hard refresh (Cmd+Shift+R equivalent)');
        // Clear all caches and reload
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        // Force reload bypassing cache
        window.location.reload(true);
    }

    // Storage Methods - Pure localStorage with Sample Data for New Users
    loadShoppingItems() {
        try {
            let saved = localStorage.getItem('shoppingItems');
            
            // Try backup if main data is corrupted
            if (!saved || saved === 'null') {
                saved = localStorage.getItem('shoppingItems_backup');
                console.log('Loaded shopping items from localStorage backup');
            }
            
            let items = saved ? JSON.parse(saved) : [];
            
            // Provide sample data for new users
            if (items.length === 0 && !localStorage.getItem('shoppingItems_initialized')) {
                items = this.getSampleShoppingItems();
                localStorage.setItem('shoppingItems_initialized', 'true');
                console.log('📱 New user - loaded sample shopping items');
            }
            
            console.log(`📦 Loaded ${items.length} shopping items from localStorage`);
            return items;
        } catch (e) {
            console.error('Could not load shopping items from localStorage:', e);
            return this.getSampleShoppingItems();
        }
    }

    loadStandardItems() {
        try {
            let saved = localStorage.getItem('standardItems');
            
            // Try backup if main data is corrupted
            if (!saved || saved === 'null') {
                saved = localStorage.getItem('standardItems_backup');
                console.log('Loaded pantry items from localStorage backup');
            }
            
            let items = saved ? JSON.parse(saved) : [];
            
            // Provide sample data for new users
            if (items.length === 0 && !localStorage.getItem('standardItems_initialized')) {
                items = this.getSamplePantryItems();
                localStorage.setItem('standardItems_initialized', 'true');
                console.log('📱 New user - loaded sample pantry items');
            } else if (items.length > 0) {
                // Ensure backward compatibility - add inSeason property if missing
                items = items.map(item => ({
                    ...item,
                    inSeason: item.inSeason !== undefined ? item.inSeason : true
                }));
            }
            
            console.log(`📦 Loaded ${items.length} pantry items from localStorage`);
            return items;
        } catch (e) {
            console.error('Could not load standard items from localStorage:', e);
            return this.getSamplePantryItems();
        }
    }

    loadCategories() {
        try {
            let saved = localStorage.getItem('categories');
            
            // Try backup if main data is corrupted
            if (!saved || saved === 'null') {
                saved = localStorage.getItem('categories_backup');
                console.log('Loaded categories from localStorage backup');
            }
            
            const categories = saved ? JSON.parse(saved) : [];
            console.log(`📦 Loaded ${categories.length} categories from localStorage`);
            return categories;
        } catch (e) {
            console.error('Could not load categories from localStorage:', e);
            return [];
        }
    }

    loadAllProducts() {
        try {
            let saved = localStorage.getItem('allProducts');
            
            // Try backup if main data is corrupted
            if (!saved || saved === 'null') {
                saved = localStorage.getItem('allProducts_backup');
                console.log('Loaded products from localStorage backup');
            }
            
            let products = saved ? JSON.parse(saved) : [];
            
            // Provide sample data for new users
            if (products.length === 0 && !localStorage.getItem('allProducts_initialized')) {
                products = this.getSampleProducts();
                localStorage.setItem('allProducts_initialized', 'true');
                console.log('📱 New user - loaded sample products:', products.length);
                // Save sample products immediately
                try {
                    const data = JSON.stringify(products);
                    localStorage.setItem('allProducts', data);
                    localStorage.setItem('allProducts_backup', data);
                } catch (e) {
                    console.error('Could not save sample products:', e);
                }
            }
            
            console.log(`📋 Loaded ${products.length} products from localStorage`);
            return products;
        } catch (e) {
            console.error('Could not load products from localStorage:', e);
            return this.getSampleProducts();
        }
    }

    saveShoppingItems() {
        try {
            const data = JSON.stringify(this.shoppingItems);
            localStorage.setItem('shoppingItems', data);
            localStorage.setItem('shoppingItems_backup', data);
            localStorage.setItem('shoppingItems_timestamp', new Date().toISOString());
            console.log(`💾 Saved ${this.shoppingItems.length} shopping items to localStorage`);
        } catch (e) {
            console.error('Could not save shopping items to localStorage:', e);
            this.showPersistenceError('shopping items');
        }
    }

    saveStandardItems() {
        try {
            const data = JSON.stringify(this.standardItems);
            localStorage.setItem('standardItems', data);
            localStorage.setItem('standardItems_backup', data);
            localStorage.setItem('standardItems_timestamp', new Date().toISOString());
            console.log(`💾 Saved ${this.standardItems.length} pantry items to localStorage`);
        } catch (e) {
            console.error('Could not save standard items to localStorage:', e);
            this.showPersistenceError('pantry items');
        }
    }

    saveAllProducts() {
        try {
            const data = JSON.stringify(this.allProducts);
            localStorage.setItem('allProducts', data);
            localStorage.setItem('allProducts_backup', data);
            localStorage.setItem('allProducts_timestamp', new Date().toISOString());
            console.log(`💾 Saved ${this.allProducts.length} products to localStorage`);
        } catch (e) {
            console.error('Could not save products to localStorage:', e);
            this.showPersistenceError('products');
        }
    }

    saveCategories() {
        try {
            const data = JSON.stringify(this.categories);
            localStorage.setItem('categories', data);
            localStorage.setItem('categories_backup', data);
            localStorage.setItem('categories_timestamp', new Date().toISOString());
            console.log(`💾 Saved ${this.categories.length} categories to localStorage`);
        } catch (e) {
            console.error('Could not save categories to localStorage:', e);
            this.showPersistenceError('categories');
        }
    }

    getSampleShoppingItems() {
        return [
            {
                id: Date.now(),
                name: "Bananas",
                category: "produce",
                completed: false,
                dateAdded: new Date().toISOString(),
                fromStandard: false
            },
            {
                id: Date.now() + 1,
                name: "Milk",
                category: "dairy",
                completed: false,
                dateAdded: new Date().toISOString(),
                fromStandard: true
            },
            {
                id: Date.now() + 2,
                name: "Bread",
                category: "bakery",
                completed: true,
                dateAdded: new Date().toISOString(),
                fromStandard: false
            }
        ];
    }

    getSamplePantryItems() {
        return [
            {
                id: Date.now() + 100,
                name: "Rice",
                category: "pantry",
                inStock: true,
                inSeason: true,
                dateAdded: new Date().toISOString()
            },
            {
                id: Date.now() + 101,
                name: "Milk",
                category: "dairy",
                inStock: false,
                inSeason: true,
                dateAdded: new Date().toISOString()
            },
            {
                id: Date.now() + 102,
                name: "Apples",
                category: "produce",
                inStock: true,
                inSeason: true,
                dateAdded: new Date().toISOString()
            },
            {
                id: Date.now() + 103,
                name: "Chicken Breast",
                category: "meat",
                inStock: false,
                inSeason: true,
                dateAdded: new Date().toISOString()
            },
            {
                id: Date.now() + 104,
                name: "Strawberries",
                category: "produce",
                inStock: false,
                inSeason: false,
                dateAdded: new Date().toISOString()
            }
        ];
    }

    getSampleProducts() {
        const baseProduct = {
            inShopping: false,
            inPantry: false,
            inStock: false,
            inSeason: true,
            completed: false,
            dateAdded: new Date().toISOString()
        };

        return [
            // Common produce
            {id: Date.now() + 200, name: "Onions", category: "produce", ...baseProduct},
            {id: Date.now() + 201, name: "Garlic", category: "produce", ...baseProduct},
            {id: Date.now() + 202, name: "Carrots", category: "produce", ...baseProduct},
            {id: Date.now() + 203, name: "Celery", category: "produce", ...baseProduct},
            {id: Date.now() + 204, name: "Potatoes", category: "produce", ...baseProduct},
            {id: Date.now() + 205, name: "Tomatoes", category: "produce", ...baseProduct},
            {id: Date.now() + 206, name: "Bell Peppers", category: "produce", ...baseProduct},
            {id: Date.now() + 207, name: "Mushrooms", category: "produce", ...baseProduct},
            {id: Date.now() + 208, name: "Lemons", category: "produce", ...baseProduct},
            {id: Date.now() + 209, name: "Fresh Herbs", category: "produce", ...baseProduct},
            
            // Pantry staples
            {id: Date.now() + 210, name: "Olive Oil", category: "pantry", ...baseProduct},
            {id: Date.now() + 211, name: "Salt", category: "pantry", ...baseProduct},
            {id: Date.now() + 212, name: "Black Pepper", category: "pantry", ...baseProduct},
            {id: Date.now() + 213, name: "Flour", category: "pantry", ...baseProduct},
            {id: Date.now() + 214, name: "Sugar", category: "pantry", ...baseProduct},
            {id: Date.now() + 215, name: "Pasta", category: "pantry", ...baseProduct},
            {id: Date.now() + 216, name: "Canned Tomatoes", category: "pantry", ...baseProduct},
            {id: Date.now() + 217, name: "Stock/Broth", category: "pantry", ...baseProduct},
            {id: Date.now() + 218, name: "Vinegar", category: "pantry", ...baseProduct},
            {id: Date.now() + 219, name: "Spices Mix", category: "pantry", ...baseProduct},
            
            // Dairy & proteins
            {id: Date.now() + 220, name: "Eggs", category: "dairy", ...baseProduct},
            {id: Date.now() + 221, name: "Butter", category: "dairy", ...baseProduct},
            {id: Date.now() + 222, name: "Cheese", category: "dairy", ...baseProduct},
            {id: Date.now() + 223, name: "Ground Beef", category: "meat", ...baseProduct},
            {id: Date.now() + 224, name: "Chicken Thighs", category: "meat", ...baseProduct},
            {id: Date.now() + 225, name: "Fish Fillets", category: "meat", ...baseProduct},
            
            // Bakery
            {id: Date.now() + 226, name: "Sandwich Bread", category: "bakery", ...baseProduct},
            {id: Date.now() + 227, name: "Dinner Rolls", category: "bakery", ...baseProduct},
            
            // Frozen
            {id: Date.now() + 228, name: "Frozen Vegetables", category: "frozen", ...baseProduct},
            {id: Date.now() + 229, name: "Ice Cream", category: "frozen", ...baseProduct}
        ];
    }

    showPersistenceError(dataType) {
        console.warn(`Storage error for ${dataType}. Your data might not be saved.`);
        // Could add user notification here if needed
    }

    // Device Sync Methods
    exportData() {
        try {
            this.exportDataBtn.disabled = true;
            this.exportDataBtn.textContent = '📤 Exporting...';
            
            const exportData = {
                shoppingItems: this.shoppingItems,
                standardItems: this.standardItems,
                categories: this.categories,
                allProducts: this.allProducts,
                exportDate: new Date().toISOString(),
                exportTime: new Date().toLocaleString(),
                version: '1.1',
                deviceInfo: this.getDeviceInfo()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            // Standard filename for easy sync
            const filename = 'grocery-data.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', filename);
            linkElement.click();
            
            console.log('📤 Data exported successfully');
            
            // Reset button after short delay
            setTimeout(() => {
                this.exportDataBtn.disabled = false;
                this.exportDataBtn.textContent = '📤 Export to "grocery-data.json"';
            }, 1000);
            
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
            this.exportDataBtn.disabled = false;
            this.exportDataBtn.textContent = '📤 Export to "grocery-data.json"';
        }
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.importDataBtn.disabled = true;
        this.importDataBtn.textContent = '📥 Importing...';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.importData(e.target.result);
            } catch (error) {
                console.error('Import failed:', error);
                alert('Import failed. Please check the file format.');
            } finally {
                // Reset button and file input
                this.importDataBtn.disabled = false;
                this.importDataBtn.textContent = '📥 Import from "grocery-data.json"';
                this.importFileInput.value = '';
            }
        };
        
        reader.readAsText(file);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.version || !data.exportDate) {
                throw new Error('Invalid grocery data file');
            }
            
            // Backup current data
            const backup = {
                shoppingItems: [...this.shoppingItems],
                standardItems: [...this.standardItems], 
                categories: [...this.categories]
            };
            
            // Import data
            if (data.shoppingItems) this.shoppingItems = data.shoppingItems;
            if (data.standardItems) this.standardItems = data.standardItems;
            if (data.categories) this.categories = data.categories;
            if (data.allProducts) this.allProducts = data.allProducts;
            
            // Save to localStorage
            this.saveShoppingItems();
            this.saveStandardItems();
            this.saveCategories();
            this.saveAllProducts();
            
            // Update UI
            this.updateCategorySelects();
            this.render();
            
            // Success message with details
            const importInfo = data.exportTime ? `from ${data.exportTime}` : 'successfully';
            const deviceInfo = data.deviceInfo ? ` (${data.deviceInfo})` : '';
            alert(`Data imported ${importInfo}${deviceInfo}!\n\n` +
                  `📦 Shopping items: ${data.shoppingItems?.length || 0}\n` +
                  `🏠 Pantry items: ${data.standardItems?.length || 0}\n` +
                  `📋 Products: ${data.allProducts?.length || 0}\n` +
                  `📂 Categories: ${data.categories?.length || 0}`);
            
            console.log('📥 Data imported successfully:', data);
            
        } catch (e) {
            console.error('Import error:', e);
            alert('Invalid data format. Please make sure you selected the correct "grocery-data.json" file.');
            throw e;
        }
    }

    // Check storage health
    checkStorageHealth() {
        try {
            const testKey = 'storage_test';
            const testValue = 'test';
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            if (retrieved !== testValue) {
                throw new Error('Storage read/write mismatch');
            }
            
            console.log('✅ localStorage is working correctly');
            return true;
        } catch (e) {
            console.error('❌ localStorage is not working:', e);
            return false;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GroceryApp();
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}