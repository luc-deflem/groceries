class GroceryApp {
    constructor() {
        // Check if localStorage is working
        this.checkStorageHealth();
        
        this.currentTab = 'shopping';
        this.currentEditingItem = null;
        this.currentHighlightIndex = -1;
        
        // Load data directly from localStorage (with sample data for new users)
        this.shoppingItems = this.loadShoppingItems();
        this.standardItems = this.loadStandardItems();
        this.categories = this.loadCategories();
        this.allProducts = this.loadAllProducts();
        this.recipes = this.loadRecipes();
        this.mealPlans = this.loadMealPlans();
        
        // Initialize current week (start of current week)
        this.currentWeekStart = this.getWeekStart(new Date());
        
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
        console.log(`📊 Data loaded: ${this.shoppingItems.length} shopping items, ${this.standardItems.length} pantry items, ${this.categories.length} categories, ${this.allProducts.length} products, ${this.recipes.length} recipes`);
        console.log(`📱 Device: ${this.getDeviceInfo()}`);
    }

    initializeDefaultCategories() {
        if (this.categories.length === 0) {
            this.categories = [
                {id: 'cat_001', name: 'produce', emoji: '🥬', order: 0, isDefault: true},
                {id: 'cat_002', name: 'dairy', emoji: '🥛', order: 1, isDefault: true},
                {id: 'cat_003', name: 'meat', emoji: '🥩', order: 2, isDefault: true},
                {id: 'cat_004', name: 'pantry', emoji: '🥫', order: 3, isDefault: true},
                {id: 'cat_005', name: 'frozen', emoji: '🧊', order: 4, isDefault: true},
                {id: 'cat_006', name: 'bakery', emoji: '🍞', order: 5, isDefault: true},
                {id: 'cat_007', name: 'other', emoji: '📦', order: 6, isDefault: true}
            ];
            this.saveCategories();
        } else {
            // Migration: Fix existing categories that have name-based IDs
            this.migrateCategoryIds();
        }
    }

    migrateCategoryIds() {
        console.log('🔄 Checking for category ID migration...');
        let needsMigration = false;
        const idMapping = {};
        
        this.categories.forEach((cat, index) => {
            if (cat.id === cat.name) {
                const oldId = cat.id;
                const newId = `cat_${String(index + 1).padStart(3, '0')}`;
                cat.id = newId;
                idMapping[oldId] = newId;
                needsMigration = true;
                console.log(`📝 Migrating category "${oldId}" -> "${newId}"`);
            }
        });
        
        if (needsMigration) {
            console.log('🔄 Migrating category references in all data...');
            
            // Update shopping items
            this.shoppingItems.forEach(item => {
                if (idMapping[item.category]) {
                    item.category = idMapping[item.category];
                }
            });
            
            // Update pantry items
            this.standardItems.forEach(item => {
                if (idMapping[item.category]) {
                    item.category = idMapping[item.category];
                }
            });
            
            // Update all products
            this.allProducts.forEach(product => {
                if (idMapping[product.category]) {
                    product.category = idMapping[product.category];
                }
            });
            
            // Save all updated data
            this.saveCategories();
            this.saveShoppingItems();
            this.saveStandardItems();
            this.saveAllProducts();
            
            console.log('✅ Category migration completed!');
        }
    }

    findOrphanedProducts() {
        const validCategoryIds = new Set(this.categories.map(cat => cat.id));
        return this.allProducts.filter(product => !validCategoryIds.has(product.category));
    }

    fixOrphanedProduct(productId, newCategoryId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (product) {
            console.log(`🔧 Fixing orphaned product "${product.name}": ${product.category} -> ${newCategoryId}`);
            product.category = newCategoryId;
            this.saveAllProducts();
            this.render();
        }
    }

    deleteOrphanedProduct(productId) {
        if (confirm('Are you sure you want to delete this orphaned product? This cannot be undone.')) {
            this.allProducts = this.allProducts.filter(p => p.id !== productId);
            this.saveAllProducts();
            this.render();
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
        
        // Orphaned products elements
        this.orphanedProductsSection = document.getElementById('orphanedProductsSection');
        this.orphanedProductsList = document.getElementById('orphanedProductsList');

        // Recipe elements
        this.recipeNameInput = document.getElementById('recipeNameInput');
        this.addRecipeBtn = document.getElementById('addRecipeBtn');
        this.recipesList = document.getElementById('recipesList');
        this.recipeCount = document.getElementById('recipeCount');

        // Meal planning elements
        this.prevWeekBtn = document.getElementById('prevWeekBtn');
        this.nextWeekBtn = document.getElementById('nextWeekBtn');
        this.currentWeekRange = document.getElementById('currentWeekRange');
        this.mealCalendar = document.getElementById('mealCalendar');
        this.generateShoppingListBtn = document.getElementById('generateShoppingListBtn');
        this.clearWeekBtn = document.getElementById('clearWeekBtn');

        // Simple meal modal elements
        this.simpleMealModal = document.getElementById('simpleMealModal');
        this.simpleMealName = document.getElementById('simpleMealName');
        this.simpleMealSearch = document.getElementById('simpleMealSearch');
        this.clearSimpleMealSearchBtn = document.getElementById('clearSimpleMealSearch');
        this.simpleMealCategories = document.getElementById('simpleMealCategories');
        this.selectedProducts = document.getElementById('selectedProducts');
        this.saveSimpleMealBtn = document.getElementById('saveSimpleMeal');
        this.cancelSimpleMealBtn = document.getElementById('cancelSimpleMeal');
        this.closeSimpleMealModalBtn = document.getElementById('closeSimpleMealModal');

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

        // Recipe edit modal elements
        this.recipeEditModal = document.getElementById('recipeEditModal');
        this.editRecipeName = document.getElementById('editRecipeName');
        this.editRecipeDescription = document.getElementById('editRecipeDescription');
        this.editRecipePreparation = document.getElementById('editRecipePreparation');
        this.maximizeRecipeModalBtn = document.getElementById('maximizeRecipeModal');
        this.ingredientProductSearch = document.getElementById('ingredientProductSearch');
        this.ingredientProductResults = document.getElementById('ingredientProductResults');
        this.selectedProductId = document.getElementById('selectedProductId');
        this.ingredientQuantity = document.getElementById('ingredientQuantity');
        this.ingredientUnit = document.getElementById('ingredientUnit');
        this.addIngredientBtn = document.getElementById('addIngredientBtn');
        this.ingredientsList = document.getElementById('ingredientsList');
        this.closeRecipeModalBtn = document.getElementById('closeRecipeModal');
        this.cancelRecipeEditBtn = document.getElementById('cancelRecipeEdit');
        this.confirmRecipeEditBtn = document.getElementById('confirmRecipeEdit');
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

        // Recipe events
        this.addRecipeBtn.addEventListener('click', () => this.addRecipe());
        this.recipeNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addRecipe();
        });

        // Meal planning events
        this.prevWeekBtn.addEventListener('click', () => this.navigateWeek(-1));
        this.nextWeekBtn.addEventListener('click', () => this.navigateWeek(1));
        this.generateShoppingListBtn.addEventListener('click', () => this.generateShoppingListFromMeals());
        this.clearWeekBtn.addEventListener('click', () => this.clearCurrentWeek());

        // Simple meal modal events
        this.saveSimpleMealBtn.addEventListener('click', () => this.saveSimpleMeal());
        this.cancelSimpleMealBtn.addEventListener('click', () => this.closeSimpleMealModal());
        this.closeSimpleMealModalBtn.addEventListener('click', () => this.closeSimpleMealModal());
        this.simpleMealSearch.addEventListener('input', () => this.filterSimpleMealProducts());
        this.clearSimpleMealSearchBtn.addEventListener('click', () => this.clearSimpleMealSearch());
        this.simpleMealModal.addEventListener('click', (e) => {
            if (e.target === this.simpleMealModal) {
                this.closeSimpleMealModal();
            }
        });

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

        // Recipe edit modal events
        this.closeRecipeModalBtn.addEventListener('click', () => this.closeRecipeEditModal());
        this.cancelRecipeEditBtn.addEventListener('click', () => this.closeRecipeEditModal());
        this.confirmRecipeEditBtn.addEventListener('click', () => this.confirmRecipeEdit());
        this.maximizeRecipeModalBtn.addEventListener('click', () => this.toggleMaximizeRecipeModal());
        this.addIngredientBtn.addEventListener('click', () => this.addIngredientToRecipe());
        
        // Ingredient search events
        this.ingredientProductSearch.addEventListener('input', (e) => this.searchProducts(e.target.value));
        this.ingredientProductSearch.addEventListener('focus', () => this.showSearchResults());
        this.ingredientProductSearch.addEventListener('blur', () => {
            // Delay hiding to allow clicks on results
            setTimeout(() => this.hideSearchResults(), 150);
        });
        this.ingredientProductSearch.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
        
        // Event delegation for search results (including create option)
        this.ingredientProductResults.addEventListener('click', (e) => {
            alert(`🖱️ CLICK DETECTED on: ${e.target.tagName} ${e.target.className}`);
            console.log('🖱️ Click detected on search results area:', e.target);
            console.log('🔍 Current search results innerHTML:', this.ingredientProductResults.innerHTML);
            
            // Handle create product option clicks
            if (e.target.closest('.create-product-option')) {
                alert('✅ CREATE OPTION FOUND - about to call function');
                e.preventDefault();
                e.stopPropagation();
                const createOption = e.target.closest('.create-product-option');
                const productName = createOption.dataset.productName;
                console.log('🖱️ Create option clicked via delegation, productName:', productName);
                console.log('🔧 About to call createNewProductFromSearch...');
                
                // Extra debugging
                console.log('📊 Pre-creation state check:', {
                    functionsExists: typeof this.createNewProductFromSearch === 'function',
                    modalExists: !!document.getElementById('productEditModal'),
                    currentProducts: this.allProducts.length
                });
                
                this.createNewProductFromSearch(productName);
                return;
            } else {
                alert('❌ CREATE OPTION NOT FOUND in clicked element');
            }
            
            // Handle regular product selection clicks
            if (e.target.closest('.search-result-item')) {
                e.preventDefault();
                e.stopPropagation();
                const resultItem = e.target.closest('.search-result-item');
                const productId = resultItem.dataset.productId;
                console.log('🖱️ Product selected via delegation, productId:', productId);
                this.selectProduct(productId);
            }
        });
        
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

        this.recipeEditModal.addEventListener('click', (e) => {
            if (e.target === this.recipeEditModal) {
                this.closeRecipeEditModal();
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

        // Generate stable ID that doesn't depend on the name
        const maxId = Math.max(...this.categories.map(cat => {
            const match = cat.id.match(/cat_(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }), 0);
        const nextId = `cat_${String(maxId + 1).padStart(3, '0')}`;
        
        const newCategory = {
            id: nextId,
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
                // FIXED: Don't change the ID - only update the display name and emoji
                category.name = trimmedName;
                category.emoji = newEmoji.trim() || category.emoji;
                
                // No need to update item references since ID stays the same
                this.saveCategories();
                this.updateCategorySelects();
                this.render();
            }
        }
    }

    editCategoryEmoji(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category) return;

        const newEmoji = prompt(`Enter new emoji for "${category.name}":`, category.emoji);
        if (newEmoji !== null && newEmoji.trim() !== category.emoji) {
            category.emoji = newEmoji.trim() || category.emoji;
            this.saveCategories();
            this.updateCategorySelects();
            this.render();
        }
    }

    editShoppingItem(itemId) {
        // Find the corresponding product in the master list
        let product = this.allProducts.find(product => product.id === itemId);
        
        if (!product) {
            // Fallback: find by shopping item details if direct ID match fails
            const shoppingItem = this.shoppingItems.find(item => item.id === itemId);
            if (shoppingItem) {
                console.warn('Product not found by ID, searching by name/category:', shoppingItem.name);
                product = this.allProducts.find(p => 
                    p.name.toLowerCase() === shoppingItem.name.toLowerCase() && 
                    p.category === shoppingItem.category
                );
            }
        }
        
        if (!product) {
            console.error('Cannot edit: Product not found in master list for ID:', itemId);
            alert('Error: Cannot edit this item. Please try refreshing the page.');
            return;
        }
        
        // Use the comprehensive product edit modal
        this.openProductEditModal(product);
    }

    editStandardItem(itemId) {
        // Find the corresponding product in the master list
        let product = this.allProducts.find(product => product.id === itemId);
        
        if (!product) {
            // Fallback: find by pantry item details if direct ID match fails
            const pantryItem = this.standardItems.find(item => item.id === itemId);
            if (pantryItem) {
                console.warn('Product not found by ID, searching by name/category:', pantryItem.name);
                product = this.allProducts.find(p => 
                    p.name.toLowerCase() === pantryItem.name.toLowerCase() && 
                    p.category === pantryItem.category
                );
            }
        }
        
        if (!product) {
            console.error('Cannot edit: Product not found in master list for ID:', itemId);
            alert('Error: Cannot edit this item. Please try refreshing the page.');
            return;
        }
        
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

    // Recipe Methods
    addRecipe() {
        const recipeName = this.recipeNameInput.value.trim();
        
        if (!recipeName) {
            this.recipeNameInput.focus();
            return;
        }

        // Check if recipe already exists
        const existingRecipe = this.recipes.find(recipe => 
            recipe.name.toLowerCase() === recipeName.toLowerCase()
        );

        if (existingRecipe) {
            alert('A recipe with this name already exists!');
            this.recipeNameInput.value = '';
            return;
        }

        const newRecipe = {
            id: Date.now(),
            name: recipeName,
            description: '',
            preparation: '',
            ingredients: [],
            dateCreated: new Date().toISOString()
        };

        this.recipes.push(newRecipe);
        this.recipeNameInput.value = '';
        this.recipeNameInput.focus();
        this.saveRecipes();
        this.render();
        
        // Open edit modal to add description and ingredients
        this.openRecipeEditModal(newRecipe);
    }

    editRecipe(recipeId) {
        const recipe = this.recipes.find(recipe => recipe.id === recipeId);
        if (!recipe) return;
        
        this.openRecipeEditModal(recipe);
    }

    deleteRecipe(recipeId) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            this.recipes = this.recipes.filter(recipe => recipe.id !== recipeId);
            this.saveRecipes();
            this.render();
        }
    }

    openRecipeEditModal(recipe) {
        this.currentEditingRecipe = recipe;
        
        // Populate modal fields
        this.editRecipeName.value = recipe.name;
        this.editRecipeDescription.value = recipe.description || '';
        this.editRecipePreparation.value = recipe.preparation || '';
        
        // Reset maximize state
        this.recipeEditModal.classList.remove('maximized');
        this.maximizeRecipeModalBtn.innerHTML = '⛶';
        this.maximizeRecipeModalBtn.title = 'Maximize';
        
        // Clear search form and reset all state
        this.clearProductSearch();
        this.resetRecipeCreationState();
        
        // Clear and populate ingredients list
        this.currentRecipeIngredients = [...recipe.ingredients];
        this.renderIngredientsInModal();
        
        this.recipeEditModal.style.display = 'block';
    }

    closeRecipeEditModal() {
        this.recipeEditModal.style.display = 'none';
        this.recipeEditModal.classList.remove('maximized');
        this.currentEditingRecipe = null;
        this.currentRecipeIngredients = [];
    }

    toggleMaximizeRecipeModal() {
        const modal = this.recipeEditModal;
        const isMaximized = modal.classList.contains('maximized');
        
        if (isMaximized) {
            modal.classList.remove('maximized');
            this.maximizeRecipeModalBtn.innerHTML = '⛶';
            this.maximizeRecipeModalBtn.title = 'Maximize';
        } else {
            modal.classList.add('maximized');
            this.maximizeRecipeModalBtn.innerHTML = '🗗';
            this.maximizeRecipeModalBtn.title = 'Restore';
        }
    }

    confirmRecipeEdit() {
        if (!this.currentEditingRecipe) return;

        const recipe = this.currentEditingRecipe;
        const newName = this.editRecipeName.value.trim();
        const newDescription = this.editRecipeDescription.value.trim();
        const newPreparation = this.editRecipePreparation.value.trim();

        if (!newName) {
            alert('Recipe name cannot be empty');
            return;
        }

        // Check for duplicate names (excluding current recipe)
        const duplicateRecipe = this.recipes.find(r => 
            r.id !== recipe.id && r.name.toLowerCase() === newName.toLowerCase()
        );

        if (duplicateRecipe) {
            alert('A recipe with this name already exists');
            return;
        }

        // Update recipe
        recipe.name = newName;
        recipe.description = newDescription;
        recipe.preparation = newPreparation;
        recipe.ingredients = [...this.currentRecipeIngredients];

        this.saveRecipes();
        this.closeRecipeEditModal();
        this.render();
    }


    addIngredientToRecipe() {
        const productId = this.selectedProductId.value;
        const quantity = parseFloat(this.ingredientQuantity.value);
        const unit = this.ingredientUnit.value;

        if (!productId || !quantity || quantity <= 0) {
            alert('Please search for a product and enter a valid quantity');
            return;
        }

        // Check if ingredient already exists (use loose equality for flexibility)
        const existingIngredient = this.currentRecipeIngredients.find(ing => ing.productId == productId);
        if (existingIngredient) {
            alert('This ingredient is already in the recipe');
            return;
        }

        const ingredient = {
            productId: productId,
            quantity: quantity,
            unit: unit
        };

        this.currentRecipeIngredients.push(ingredient);
        
        // Clear form
        this.clearProductSearch();
        this.ingredientQuantity.value = '';
        this.ingredientUnit.value = 'g';
        
        this.renderIngredientsInModal();
    }

    removeIngredientFromRecipe(productId) {
        // Use loose equality to match both string and number IDs
        this.currentRecipeIngredients = this.currentRecipeIngredients.filter(ing => ing.productId != productId);
        this.renderIngredientsInModal();
    }

    renderIngredientsInModal() {
        if (!this.ingredientsList || !this.currentRecipeIngredients) return;

        if (this.currentRecipeIngredients.length === 0) {
            this.ingredientsList.innerHTML = '<p style="color: #7f8c8d; text-align: center; margin: 10px 0;">No ingredients added yet</p>';
            return;
        }

        const html = this.currentRecipeIngredients.map(ingredient => {
            // Simple and robust product lookup
            const product = this.allProducts.find(p => p.id == ingredient.productId); // Use == for loose equality
            const productName = product ? product.name : `Unknown Product (ID: ${ingredient.productId})`;
            
            return `
                <div class="ingredient-item">
                    <div class="ingredient-info">
                        <div class="ingredient-name">${this.escapeHtml(productName)}</div>
                        <div class="ingredient-amount">${ingredient.quantity} ${ingredient.unit}</div>
                    </div>
                    <button class="ingredient-remove" onclick="app.removeIngredientFromRecipe('${ingredient.productId}')" title="Remove ingredient">×</button>
                </div>
            `;
        }).join('');

        this.ingredientsList.innerHTML = html;
    }

    // Product search methods for ingredient selection
    searchProducts(query) {
        console.log('🔍 Searching products for query:', query);
        
        if (!query || query.length < 1) {
            this.hideSearchResults();
            return;
        }

        const searchTerm = query.toLowerCase();
        const matchingProducts = this.allProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        ).slice(0, 10); // Limit to 10 results

        console.log('📊 Search results:', {
            query: searchTerm,
            totalProducts: this.allProducts.length,
            matchingProducts: matchingProducts.length,
            productNames: matchingProducts.map(p => p.name)
        });

        this.displaySearchResults(matchingProducts);
    }

    displaySearchResults(products) {
        console.log('🔍 displaySearchResults called with:', {
            productsCount: products.length,
            searchTerm: this.ingredientProductSearch?.value?.trim(),
            resultsContainerExists: !!this.ingredientProductResults
        });
        
        if (!this.ingredientProductResults) {
            console.error('❌ ingredientProductResults element not found!');
            return;
        }
        
        const searchTerm = this.ingredientProductSearch.value.trim();

        if (products.length === 0 && searchTerm) {
            console.log('🔍 No products found, showing create option for:', searchTerm);
            
            const createOptionHTML = `
                <div class="no-results-container">
                    <div class="no-results">No products found for "${this.escapeHtml(searchTerm)}"</div>
                    <div class="create-product-option" data-product-name="${this.escapeHtml(searchTerm)}">
                        <span class="create-icon">➕</span>
                        <span class="create-text">Create "${this.escapeHtml(searchTerm)}" as new product</span>
                    </div>
                </div>
            `;
            
            this.ingredientProductResults.innerHTML = createOptionHTML;
            console.log('✅ Create option HTML set:', createOptionHTML);
            
            // Note: Click handling is done through event delegation in attachEventListeners()
        } else {
            const html = products.map((product, index) => {
                const categoryData = this.categories.find(cat => cat.id === product.category);
                const categoryName = categoryData ? categoryData.name : product.category;
                const categoryEmoji = categoryData ? categoryData.emoji : '📦';
                
                return `
                    <div class="search-result-item" data-product-id="${product.id}" data-index="${index}">
                        <span class="product-name">${this.escapeHtml(product.name)}</span>
                        <span class="product-category">${categoryEmoji} ${categoryName}</span>
                    </div>
                `;
            }).join('');
            
            this.ingredientProductResults.innerHTML = html;
        }

        this.showSearchResults();
        this.currentHighlightIndex = -1;
    }

    selectProduct(productId) {
        const product = this.allProducts.find(p => p.id == productId);
        if (product) {
            this.ingredientProductSearch.value = product.name;
            this.selectedProductId.value = productId;
            this.hideSearchResults();
            this.ingredientQuantity.focus();
        }
    }

    showSearchResults() {
        if (this.ingredientProductResults && this.ingredientProductResults.innerHTML.trim()) {
            this.ingredientProductResults.classList.add('show');
        }
    }

    hideSearchResults() {
        if (this.ingredientProductResults) {
            this.ingredientProductResults.classList.remove('show');
        }
    }

    clearProductSearch() {
        console.log('🧹 Clearing product search');
        this.ingredientProductSearch.value = '';
        this.selectedProductId.value = '';
        this.hideSearchResults();
        this.currentHighlightIndex = -1;
    }

    resetRecipeCreationState() {
        console.log('🔄 Fully resetting recipe creation state');
        this.creatingProductForRecipe = false;
        this.pendingIngredientName = null;
        this.currentEditingProduct = null;
        this.isCreatingNewProduct = false;
        console.log('✅ Recipe creation state fully reset');
    }

    handleSearchKeydown(e) {
        const results = this.ingredientProductResults.querySelectorAll('.search-result-item');
        const createOption = this.ingredientProductResults.querySelector('.create-product-option');
        const totalOptions = results.length + (createOption ? 1 : 0);
        
        if (totalOptions === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.currentHighlightIndex = Math.min(this.currentHighlightIndex + 1, totalOptions - 1);
                this.updateHighlightWithCreate(results, createOption);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.currentHighlightIndex = Math.max(this.currentHighlightIndex - 1, -1);
                this.updateHighlightWithCreate(results, createOption);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.currentHighlightIndex >= 0) {
                    if (this.currentHighlightIndex < results.length) {
                        // Select existing product
                        const selectedItem = results[this.currentHighlightIndex];
                        this.selectProduct(selectedItem.dataset.productId);
                    } else if (createOption && this.currentHighlightIndex === results.length) {
                        // Create new product
                        const searchTerm = this.ingredientProductSearch.value.trim();
                        this.createNewProductFromSearch(searchTerm);
                    }
                }
                break;
                
            case 'Escape':
                this.hideSearchResults();
                break;
        }
    }

    updateHighlight(results) {
        results.forEach((item, index) => {
            item.classList.toggle('highlighted', index === this.currentHighlightIndex);
        });
    }

    updateHighlightWithCreate(results, createOption) {
        // Highlight regular results
        results.forEach((item, index) => {
            item.classList.toggle('highlighted', index === this.currentHighlightIndex);
        });
        
        // Highlight create option if it exists
        if (createOption) {
            const isCreateHighlighted = this.currentHighlightIndex === results.length;
            createOption.classList.toggle('highlighted', isCreateHighlighted);
        }
    }

    createNewProductFromSearch(productName) {
        alert(`🆕 FUNCTION CALLED: createNewProductFromSearch for ${productName}`);
        console.log('🆕 createNewProductFromSearch called for:', productName);
        console.log('📊 Current state before creation:', {
            creatingProductForRecipe: this.creatingProductForRecipe,
            pendingIngredientName: this.pendingIngredientName,
            currentEditingProduct: this.currentEditingProduct,
            isCreatingNewProduct: this.isCreatingNewProduct,
            productModalDisplay: this.productEditModal?.style.display,
            recipeModalDisplay: this.recipeEditModal?.style.display
        });
        
        // Store the search context for after product creation
        this.pendingIngredientName = productName;
        this.creatingProductForRecipe = true;
        
        // Create a new product template
        const newProduct = {
            id: Date.now(),
            name: productName,
            category: 'other', // Default category
            inShopping: false,
            inPantry: false,
            inStock: false,
            inSeason: true,
            completed: false,
            dateAdded: new Date().toISOString()
        };
        
        console.log('📝 New product template:', newProduct);
        
        // Hide search results
        this.hideSearchResults();
        
        // Open product edit modal for the new product
        console.log('🚀 About to open product edit modal...');
        this.openProductEditModal(newProduct, true); // true = isNewProduct
        
        // Verify modal opened
        setTimeout(() => {
            const isVisible = this.productEditModal.style.display === 'block';
            console.log('⏱️ Modal visibility check:', isVisible ? 'VISIBLE' : 'NOT VISIBLE');
            if (!isVisible) {
                console.error('❌ Modal failed to open! Debugging info:', {
                    modalElement: !!this.productEditModal,
                    modalClasses: this.productEditModal?.className,
                    modalStyle: this.productEditModal?.style.cssText
                });
            }
        }, 100);
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

    openProductEditModal(product, isNewProduct = false) {
        console.log('🔧 Opening product edit modal:', { product, isNewProduct });
        
        // Re-fetch modal element to ensure it's still available
        const modalElement = document.getElementById('productEditModal');
        if (!modalElement) {
            console.error('❌ productEditModal element not found in DOM!');
            return;
        }
        
        // Update the reference in case it was lost
        this.productEditModal = modalElement;
        
        this.currentEditingProduct = product;
        this.isCreatingNewProduct = isNewProduct;
        
        // Update modal title based on context
        const modalTitle = this.productEditModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = isNewProduct ? 'Create New Product' : 'Edit Product';
        }
        
        // Ensure form elements are still available
        this.editProductName = document.getElementById('editProductName');
        this.editProductCategory = document.getElementById('editProductCategory');
        this.editInShopping = document.getElementById('editInShopping');
        this.editInPantry = document.getElementById('editInPantry');
        this.editInStock = document.getElementById('editInStock');
        this.editInSeason = document.getElementById('editInSeason');
        
        if (!this.editProductName || !this.editProductCategory) {
            console.error('❌ Form elements not found in DOM!');
            return;
        }
        
        // Populate modal fields with current product data
        this.editProductName.value = product.name;
        this.editProductCategory.value = product.category;
        this.editInShopping.checked = product.inShopping || false;
        this.editInPantry.checked = product.inPantry || false;
        this.editInStock.checked = product.inStock || false;
        this.editInSeason.checked = product.inSeason !== false; // Default to true if not set
        
        // Clear all modal styles and classes to start fresh
        this.productEditModal.removeAttribute('class');
        this.productEditModal.removeAttribute('style');
        this.productEditModal.className = 'modal';
        
        // Force modal to be visible with aggressive styles
        this.productEditModal.style.setProperty('display', 'block', 'important');
        this.productEditModal.style.setProperty('position', 'fixed', 'important');
        this.productEditModal.style.setProperty('top', '0', 'important');
        this.productEditModal.style.setProperty('left', '0', 'important');
        this.productEditModal.style.setProperty('width', '100%', 'important');
        this.productEditModal.style.setProperty('height', '100%', 'important');
        this.productEditModal.style.setProperty('z-index', '999999', 'important');
        this.productEditModal.style.setProperty('background-color', 'rgba(0,0,0,0.7)', 'important');
        this.productEditModal.style.setProperty('opacity', '1', 'important');
        this.productEditModal.style.setProperty('visibility', 'visible', 'important');
        
        // Add a special class when opened from recipe context
        if (this.creatingProductForRecipe) {
            this.productEditModal.classList.add('product-from-recipe');
            this.productEditModal.style.setProperty('z-index', '9999999', 'important');
        }
        
        // Force the modal to the front of the stacking context
        document.body.appendChild(this.productEditModal);
        
        console.log('📋 Product modal forced visible:', {
            display: this.productEditModal.style.display,
            zIndex: this.productEditModal.style.zIndex,
            classList: this.productEditModal.classList.toString(),
            elementExists: !!this.productEditModal,
            isConnected: this.productEditModal.isConnected
        });
    }

    closeProductEditModal() {
        console.log('🚪 Closing product edit modal');
        console.log('📊 State before close:', {
            creatingProductForRecipe: this.creatingProductForRecipe,
            pendingIngredientName: this.pendingIngredientName,
            currentEditingProduct: this.currentEditingProduct,
            isCreatingNewProduct: this.isCreatingNewProduct
        });
        
        this.productEditModal.style.display = 'none';
        this.productEditModal.classList.remove('product-from-recipe');
        this.currentEditingProduct = null;
        this.isCreatingNewProduct = false;
        
        // Reset recipe creation state if canceled
        this.resetRecipeCreationState();
        
        console.log('✅ Product modal closed, state reset');
    }

    selectProductForRecipe(product) {
        console.log('🎯 Selecting product for recipe:', product);
        
        // Auto-select the newly created product in the recipe search
        this.ingredientProductSearch.value = product.name;
        this.selectedProductId.value = product.id;
        
        // Reset the creation state
        this.resetRecipeCreationState();
        
        console.log('📊 State after reset:', {
            creatingProductForRecipe: this.creatingProductForRecipe,
            pendingIngredientName: this.pendingIngredientName,
            selectedProduct: { name: product.name, id: product.id }
        });
        
        // Focus on quantity field for smooth workflow
        setTimeout(() => {
            if (this.ingredientQuantity) {
                this.ingredientQuantity.focus();
            }
        }, 100);
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

        // Check for duplicate names (excluding current product if editing)
        const existingProduct = this.allProducts.find(p => 
            p.id !== product.id && p.name.toLowerCase() === newName.toLowerCase()
        );
        
        if (existingProduct) {
            alert('A product with this name already exists');
            return;
        }

        // Update product with new values
        product.name = newName;
        product.category = newCategory;
        product.inShopping = newInShopping;
        product.inPantry = newInPantry;
        product.inStock = newInStock;
        product.inSeason = newInSeason;

        // If this is a new product, add it to the products list
        if (this.isCreatingNewProduct) {
            this.allProducts.push(product);
        }

        // Update shopping and pantry lists to sync with product changes
        this.syncListsFromProducts();
        
        this.saveAllProducts();
        this.saveShoppingItems();
        this.saveStandardItems();
        
        // If we're creating a product for a recipe, auto-select it
        if (this.creatingProductForRecipe && this.pendingIngredientName) {
            this.selectProductForRecipe(product);
        } else {
            // Clean up state if not for recipe
            this.resetRecipeCreationState();
        }
        
        this.closeProductEditModal();
        this.render();
    }

    // Meal Planning Methods
    loadMealPlans() {
        try {
            return JSON.parse(localStorage.getItem('mealPlans') || '{}');
        } catch (e) {
            console.error('Error loading meal plans:', e);
            return {};
        }
    }

    saveMealPlans() {
        localStorage.setItem('mealPlans', JSON.stringify(this.mealPlans));
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        // Saturday = 6, so we want to find the most recent Saturday
        // If today is Saturday (6), diff = 0. Otherwise, go back to previous Saturday
        const diff = d.getDate() - ((day + 1) % 7); // Saturday = 0 in our system
        return new Date(d.setDate(diff));
    }

    getWeekKey(weekStart) {
        return weekStart.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    navigateWeek(direction) {
        const newWeekStart = new Date(this.currentWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
        this.currentWeekStart = newWeekStart;
        this.renderMealCalendar();
    }

    generateShoppingListFromMeals() {
        // Get current week only (for fresh products)
        const currentWeekKey = this.getWeekKey(this.currentWeekStart);
        const currentWeekMeals = this.mealPlans[currentWeekKey] || {};
        
        let ingredients = [];
        
        // Collect all ingredients/products from meals in current week only
        Object.values(currentWeekMeals).forEach(dayMeals => {
            ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
                const mealData = dayMeals[mealType];
                if (mealData) {
                    if (typeof mealData === 'object' && mealData.type) {
                        if (mealData.type === 'recipe') {
                            const recipe = this.recipes.find(r => r.id === mealData.id);
                            if (recipe && recipe.ingredients) {
                                ingredients = ingredients.concat(recipe.ingredients);
                            }
                        } else if (mealData.type === 'simple') {
                            // Convert simple meal products to ingredient format
                            const simpleIngredients = mealData.products.map(productId => ({
                                productId: productId,
                                quantity: 1,
                                unit: 'portion'
                            }));
                            ingredients = ingredients.concat(simpleIngredients);
                        }
                    } else if (typeof mealData === 'number') {
                        // Legacy format - recipe ID
                        const recipe = this.recipes.find(r => r.id === mealData);
                        if (recipe && recipe.ingredients) {
                            ingredients = ingredients.concat(recipe.ingredients);
                        }
                    }
                }
            });
        });
        
        // Add unique ingredients to shopping list
        const addedProducts = new Set();
        ingredients.forEach(ingredient => {
            if (!addedProducts.has(ingredient.productId)) {
                const product = this.allProducts.find(p => p.id === ingredient.productId);
                if (product && !product.inShopping) {
                    product.inShopping = true;
                    product.completed = false;
                    addedProducts.add(ingredient.productId);
                }
            }
        });
        
        if (addedProducts.size > 0) {
            this.saveAllProducts();
            this.syncListsFromProducts();
            alert(`Added ${addedProducts.size} ingredients from this week's meals to your shopping list!`);
            this.render();
        } else {
            alert('No new ingredients to add to shopping list. All meal ingredients are already in your list.');
        }
    }

    clearCurrentWeek() {
        if (confirm('Are you sure you want to clear all meals for this week?')) {
            const weekKey = this.getWeekKey(this.currentWeekStart);
            delete this.mealPlans[weekKey];
            this.saveMealPlans();
            this.renderMealCalendar();
        }
    }

    assignMealToSlot(dayIndex, mealType) {
        // Ask user to choose between recipe or simple meal
        const mealTypeChoice = prompt(`Choose meal type for ${mealType}:\n\n1. Recipe (full recipe with instructions)\n2. Simple Meal (combine individual products)\n\nEnter 1 or 2:`);
        
        if (mealTypeChoice === '1') {
            this.assignRecipeToSlot(dayIndex, mealType);
        } else if (mealTypeChoice === '2') {
            this.assignSimpleMealToSlot(dayIndex, mealType);
        }
    }

    assignRecipeToSlot(dayIndex, mealType) {
        if (this.recipes.length === 0) {
            alert('No recipes available. Add some recipes first!');
            return;
        }
        
        const recipeOptions = this.recipes.map((recipe, index) => 
            `${index + 1}. ${recipe.name}`
        ).join('\n');
        
        const selection = prompt(`Choose a recipe for ${mealType}:\n\n${recipeOptions}\n\nEnter the number (1-${this.recipes.length}):`);
        
        if (selection) {
            const recipeIndex = parseInt(selection) - 1;
            if (recipeIndex >= 0 && recipeIndex < this.recipes.length) {
                const selectedRecipe = this.recipes[recipeIndex];
                this.setMeal(dayIndex, mealType, { type: 'recipe', id: selectedRecipe.id });
            } else {
                alert('Invalid selection. Please try again.');
            }
        }
    }

    assignSimpleMealToSlot(dayIndex, mealType) {
        if (this.allProducts.length === 0) {
            alert('No products available. Add some products first!');
            return;
        }
        
        // Group products by category for easier selection
        const validCategoryIds = new Set(this.categories.map(cat => cat.id));
        const validProducts = this.allProducts.filter(product => validCategoryIds.has(product.category));
        
        if (validProducts.length === 0) {
            alert('No valid products available. Fix orphaned products first!');
            return;
        }
        
        this.openSimpleMealBuilder(dayIndex, mealType);
    }

    openSimpleMealBuilder(dayIndex, mealType) {
        this.currentMealSlot = { dayIndex, mealType };
        this.selectedMealProducts = new Set();
        
        this.simpleMealName.value = '';
        this.simpleMealSearch.value = '';
        this.renderProductCategories();
        this.updateSelectedProductsDisplay();
        
        this.simpleMealModal.style.display = 'block';
    }

    closeSimpleMealModal() {
        this.simpleMealModal.style.display = 'none';
        this.currentMealSlot = null;
        this.selectedMealProducts = new Set();
    }

    renderProductCategories(searchTerm = '') {
        if (!this.simpleMealCategories) return;
        
        const validCategoryIds = new Set(this.categories.map(cat => cat.id));
        let validProducts = this.allProducts.filter(product => validCategoryIds.has(product.category));
        
        // Apply search filter if provided
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            validProducts = validProducts.filter(product =>
                product.name.toLowerCase().includes(lowerSearchTerm)
            );
        }
        
        // Group products by category
        const groupedProducts = this.groupItemsByCategory(validProducts);
        const categoryOrder = this.getCategoryOrder();
        
        let html = '';
        categoryOrder.forEach(categoryKey => {
            const products = groupedProducts[categoryKey];
            if (products && products.length > 0) {
                const categoryData = this.categories.find(cat => cat.id === categoryKey);
                const categoryName = categoryData ? categoryData.name.charAt(0).toUpperCase() + categoryData.name.slice(1) : categoryKey;
                const categoryEmoji = categoryData ? categoryData.emoji : '📦';
                
                html += `
                    <div class="category-group">
                        <div class="category-group-header">
                            <span>${categoryEmoji}</span>
                            <span>${categoryName}</span>
                        </div>
                        <div class="category-products">
                            ${products.map(product => `
                                <label class="product-checkbox">
                                    <input type="checkbox" 
                                           value="${product.id}" 
                                           ${this.selectedMealProducts.has(product.id) ? 'checked' : ''}
                                           onchange="app.toggleProductSelection(${product.id}, this.checked)">
                                    <span>${product.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        if (html === '' && searchTerm) {
            html = `<div class="no-products-found">
                <p>No products found for "${this.escapeHtml(searchTerm)}"</p>
                <p style="font-size: 12px; color: #a0aec0;">Try a different search term or clear the search to see all products.</p>
            </div>`;
        }
        
        this.simpleMealCategories.innerHTML = html;
    }

    toggleProductSelection(productId, isSelected) {
        if (isSelected) {
            this.selectedMealProducts.add(productId);
        } else {
            this.selectedMealProducts.delete(productId);
        }
        this.updateSelectedProductsDisplay();
    }

    updateSelectedProductsDisplay() {
        if (!this.selectedProducts) return;
        
        if (this.selectedMealProducts.size === 0) {
            this.selectedProducts.innerHTML = '<div class="empty-selection">No products selected</div>';
            return;
        }
        
        const selectedProductsArray = Array.from(this.selectedMealProducts);
        const html = selectedProductsArray.map(productId => {
            const product = this.allProducts.find(p => p.id === productId);
            if (!product) return '';
            
            return `
                <div class="selected-product-item">
                    <span>${product.name}</span>
                    <button class="remove-selected-product" onclick="app.removeProductFromSelection(${productId})">×</button>
                </div>
            `;
        }).join('');
        
        this.selectedProducts.innerHTML = html;
    }

    removeProductFromSelection(productId) {
        this.selectedMealProducts.delete(productId);
        this.renderProductCategories(this.simpleMealSearch.value.trim()); // Re-render to uncheck the checkbox
        this.updateSelectedProductsDisplay();
    }

    filterSimpleMealProducts() {
        const searchTerm = this.simpleMealSearch.value.trim();
        this.renderProductCategories(searchTerm);
    }

    clearSimpleMealSearch() {
        this.simpleMealSearch.value = '';
        this.renderProductCategories();
        this.simpleMealSearch.focus();
    }

    saveSimpleMeal() {
        if (this.selectedMealProducts.size === 0) {
            alert('Please select at least one product for the meal.');
            return;
        }
        
        const mealName = this.simpleMealName.value.trim() || this.generateMealName();
        const selectedProductsArray = Array.from(this.selectedMealProducts);
        
        const simpleMeal = {
            type: 'simple',
            name: mealName,
            products: selectedProductsArray
        };
        
        this.setMeal(this.currentMealSlot.dayIndex, this.currentMealSlot.mealType, simpleMeal);
        this.closeSimpleMealModal();
    }

    generateMealName() {
        const selectedProductsArray = Array.from(this.selectedMealProducts);
        const productNames = selectedProductsArray.slice(0, 3).map(productId => {
            const product = this.allProducts.find(p => p.id === productId);
            return product ? product.name : '';
        }).filter(name => name);
        
        let mealName = productNames.join(' & ');
        if (selectedProductsArray.length > 3) {
            mealName += ' + more';
        }
        
        return mealName || 'Simple Meal';
    }

    setMeal(dayIndex, mealType, mealData) {
        const weekKey = this.getWeekKey(this.currentWeekStart);
        
        if (!this.mealPlans[weekKey]) {
            this.mealPlans[weekKey] = {};
        }
        
        if (!this.mealPlans[weekKey][dayIndex]) {
            this.mealPlans[weekKey][dayIndex] = {};
        }
        
        this.mealPlans[weekKey][dayIndex][mealType] = mealData;
        this.saveMealPlans();
        this.renderMealCalendar();
    }

    removeMeal(dayIndex, mealType) {
        const weekKey = this.getWeekKey(this.currentWeekStart);
        
        if (this.mealPlans[weekKey] && this.mealPlans[weekKey][dayIndex]) {
            delete this.mealPlans[weekKey][dayIndex][mealType];
            
            // Clean up empty objects
            if (Object.keys(this.mealPlans[weekKey][dayIndex]).length === 0) {
                delete this.mealPlans[weekKey][dayIndex];
            }
            if (Object.keys(this.mealPlans[weekKey]).length === 0) {
                delete this.mealPlans[weekKey];
            }
            
            this.saveMealPlans();
            this.renderMealCalendar();
        }
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
        
        if (tabName === 'recipes') {
            // Recipes tab activated
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
            // Find or create product in master list (should already exist since it's from pantry)
            let product = this.allProducts.find(p => p.id === standardItem.id);
            
            if (product) {
                // Update existing product to be in shopping list
                if (!product.inShopping) {
                    product.inShopping = true;
                    product.completed = false;
                    addedCount++;
                }
            } else {
                // This shouldn't happen if sync is working correctly, but handle it as fallback
                console.warn('Product not found in master list for pantry item:', standardItem.name);
                product = {
                    id: standardItem.id, // Use same ID as pantry item
                    name: standardItem.name,
                    category: standardItem.category,
                    inShopping: true,
                    inPantry: true,
                    inStock: false,
                    inSeason: standardItem.inSeason !== false,
                    completed: false,
                    dateAdded: standardItem.dateAdded || new Date().toISOString()
                };
                this.allProducts.push(product);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            // Save master products list and sync all lists
            this.saveAllProducts();
            this.syncListsFromProducts();
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
        } else if (this.currentTab === 'recipes') {
            this.renderRecipesList();
        } else if (this.currentTab === 'meals') {
            this.renderMealCalendar();
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
                <div class="category-info">
                    <div class="category-emoji" onclick="app.editCategoryEmoji('${category.id}')" style="cursor: pointer;" title="Click to change emoticon">${category.emoji}</div>
                    <div class="category-name" onclick="app.editCategory('${category.id}')" style="cursor: pointer;" title="Click to edit category">${category.name.charAt(0).toUpperCase() + category.name.slice(1)}</div>
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

    renderOrphanedProducts() {
        const orphanedProducts = this.findOrphanedProducts();
        
        if (!this.orphanedProductsSection || !this.orphanedProductsList) {
            return;
        }
        
        if (orphanedProducts.length === 0) {
            this.orphanedProductsSection.style.display = 'none';
            return;
        }
        
        console.log(`🚨 Found ${orphanedProducts.length} orphaned products`);
        this.orphanedProductsSection.style.display = 'block';
        
        const categoryOptions = this.categories
            .sort((a, b) => a.order - b.order)
            .map(cat => `<option value="${cat.id}">${cat.emoji} ${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</option>`)
            .join('');
        
        const orphanedHtml = orphanedProducts.map(product => `
            <div class="orphaned-product-item">
                <div class="orphaned-product-info">
                    <div class="orphaned-product-name">${this.escapeHtml(product.name)}</div>
                    <div class="orphaned-product-category">Invalid category: "${this.escapeHtml(product.category)}"</div>
                </div>
                <div class="orphaned-product-actions">
                    <select class="orphaned-category-select" id="orphanedSelect_${product.id}">
                        <option value="">Choose category...</option>
                        ${categoryOptions}
                    </select>
                    <button class="fix-product-btn" onclick="app.fixOrphanedProductFromSelect(${product.id})">Fix</button>
                    <button class="delete-orphaned-btn" onclick="app.deleteOrphanedProduct(${product.id})">Delete</button>
                </div>
            </div>
        `).join('');
        
        this.orphanedProductsList.innerHTML = orphanedHtml;
    }

    fixOrphanedProductFromSelect(productId) {
        const selectElement = document.getElementById(`orphanedSelect_${productId}`);
        const newCategoryId = selectElement.value;
        
        if (!newCategoryId) {
            alert('Please select a category first.');
            return;
        }
        
        this.fixOrphanedProduct(productId, newCategoryId);
    }

    renderProductsByCategory(products) {
        // Group products by category
        const groupedProducts = this.groupItemsByCategory(products);
        const categoryOrder = this.getCategoryOrder();
        
        let html = '';
        categoryOrder.forEach(categoryKey => {
            if (groupedProducts[categoryKey] && groupedProducts[categoryKey].length > 0) {
                html += this.renderProductCategorySection(categoryKey, groupedProducts[categoryKey]);
            }
        });
        
        return html;
    }

    renderProductsList() {
        console.log('🔍 Rendering products list, total products:', this.allProducts.length);
        
        // First, render orphaned products section
        this.renderOrphanedProducts();
        
        const searchTerm = this.productSearchInput ? this.productSearchInput.value.trim().toLowerCase() : '';
        
        // Filter out orphaned products from main list - they're shown in the recovery section
        const validCategoryIds = new Set(this.categories.map(cat => cat.id));
        let filteredProducts = this.allProducts.filter(product => validCategoryIds.has(product.category));

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product =>
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

        // Group by season status first, then by category within each season
        const inSeasonProducts = filteredProducts.filter(p => p.inSeason !== false);
        const outOfSeasonProducts = filteredProducts.filter(p => p.inSeason === false);
        
        let html = '';
        
        // Render in-season products with categories
        if (inSeasonProducts.length > 0) {
            html += `<div class="products-season-group">
                <div class="products-season-header in-season">
                    <span class="season-icon">🌱</span>
                    <span class="season-title">In Season</span>
                    <span class="season-count">(${inSeasonProducts.length})</span>
                </div>
                <div class="products-season-items">
                    ${this.renderProductsByCategory(inSeasonProducts)}
                </div>
            </div>`;
        }
        
        // Render out-of-season products with categories
        if (outOfSeasonProducts.length > 0) {
            html += `<div class="products-season-group">
                <div class="products-season-header out-of-season">
                    <span class="season-icon">❄️</span>
                    <span class="season-title">Out of Season</span>
                    <span class="season-count">(${outOfSeasonProducts.length})</span>
                </div>
                <div class="products-season-items">
                    ${this.renderProductsByCategory(outOfSeasonProducts)}
                </div>
            </div>`;
        }
        
        if (this.productsList) {
            this.productsList.innerHTML = html;
            console.log('✅ Products list rendered with', filteredProducts.length, 'products');
        } else {
            console.error('❌ Products list element not found!');
        }
    }

    renderRecipesList() {
        this.updateRecipeCount();
        
        if (this.recipes.length === 0) {
            if (this.recipesList) {
                this.recipesList.innerHTML = `
                    <div class="empty-state">
                        <span class="emoji">🍳</span>
                        <p>No recipes yet</p>
                        <p>Add your first recipe above to get started!</p>
                    </div>
                `;
            }
            return;
        }

        // Sort recipes alphabetically
        const sortedRecipes = [...this.recipes].sort((a, b) => a.name.localeCompare(b.name));
        
        const html = sortedRecipes.map(recipe => this.renderRecipe(recipe)).join('');
        
        if (this.recipesList) {
            this.recipesList.innerHTML = html;
        }
    }

    renderRecipe(recipe) {
        const ingredientCount = recipe.ingredients ? recipe.ingredients.length : 0;
        const description = recipe.description ? recipe.description : 'No description';
        
        return `
            <div class="recipe-item">
                <div class="recipe-content" onclick="app.editRecipe(${recipe.id})" style="cursor: pointer;" title="Click to edit recipe">
                    <div class="recipe-name">${this.escapeHtml(recipe.name)}</div>
                    <div class="recipe-description">${this.escapeHtml(description)}</div>
                    <div class="recipe-ingredients-count">${ingredientCount} ingredient${ingredientCount !== 1 ? 's' : ''}</div>
                </div>
                <div class="recipe-actions">
                    <button class="edit-category-btn" onclick="app.editRecipe(${recipe.id})" title="Edit recipe">✏️</button>
                    <button class="delete-btn" onclick="app.deleteRecipe(${recipe.id})" title="Delete recipe">×</button>
                </div>
            </div>
        `;
    }

    updateRecipeCount() {
        if (this.recipeCount) {
            this.recipeCount.textContent = `${this.recipes.length} recipe${this.recipes.length !== 1 ? 's' : ''}`;
        }
    }

    renderProductCategorySection(category, products) {
        const categoryData = this.categories.find(cat => cat.id === category);
        const categoryName = categoryData ? categoryData.name.charAt(0).toUpperCase() + categoryData.name.slice(1) : category;
        const categoryEmoji = categoryData ? categoryData.emoji : '📦';
        
        return `
            <div class="category-section">
                <div class="category-header">
                    <span class="category-emoji">${categoryEmoji}</span>
                    <span class="category-name">${categoryName}</span>
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
        
        // Get stock status from master products list
        const product = this.allProducts.find(p => p.id === item.id);
        let stockIndicator = '';
        
        if (product) {
            // Show stock status for all products
            const stockStatus = product.inStock ? 'InStock' : 'OutStock';
            stockIndicator = `<span class="stock-indicator stock-${stockStatus.toLowerCase()}">${stockStatus === 'InStock' ? '✅ InStock' : '❌ OutStock'}</span>`;
        }
        // If product doesn't exist in master list, no indicator (shouldn't happen with current sync)
        
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
                    <div class="item-meta">
                        ${showCategory ? `<span class="item-category-small">${categoryEmoji} ${item.category}</span>` : ''}
                        ${stockIndicator}
                    </div>
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

    renderMealCalendar() {
        if (!this.mealCalendar || !this.currentWeekRange) return;
        
        const weekKey = this.getWeekKey(this.currentWeekStart);
        const weekMeals = this.mealPlans[weekKey] || {};
        
        // Update week range display
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        this.currentWeekRange.textContent = `${this.formatDate(this.currentWeekStart)} - ${this.formatDate(weekEnd)}`;
        
        // Generate calendar
        const today = new Date();
        const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        let calendarHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(this.currentWeekStart);
            currentDay.setDate(currentDay.getDate() + i);
            
            const isToday = currentDay.toDateString() === today.toDateString();
            const dayMeals = weekMeals[i] || {};
            
            calendarHTML += `
                <div class="calendar-day">
                    <div class="day-header ${isToday ? 'today' : ''}">
                        ${days[i]} ${currentDay.getDate()}/${currentDay.getMonth() + 1}
                    </div>
                    ${this.renderMealSlot(i, 'breakfast', dayMeals.breakfast)}
                    ${this.renderMealSlot(i, 'lunch', dayMeals.lunch)}
                    ${this.renderMealSlot(i, 'dinner', dayMeals.dinner)}
                </div>
            `;
        }
        
        this.mealCalendar.innerHTML = calendarHTML;
    }

    renderMealSlot(dayIndex, mealType, mealData) {
        let mealDisplay = null;
        let hasMeal = false;
        
        if (mealData) {
            if (typeof mealData === 'object' && mealData.type) {
                // New format with type
                hasMeal = true;
                if (mealData.type === 'recipe') {
                    const recipe = this.recipes.find(r => r.id === mealData.id);
                    mealDisplay = {
                        name: recipe ? recipe.name : 'Unknown Recipe',
                        icon: '🍳',
                        type: 'recipe'
                    };
                } else if (mealData.type === 'simple') {
                    mealDisplay = {
                        name: mealData.name,
                        icon: '🍽️',
                        type: 'simple'
                    };
                }
            } else if (typeof mealData === 'number') {
                // Legacy format - just recipe ID
                const recipe = this.recipes.find(r => r.id === mealData);
                if (recipe) {
                    hasMeal = true;
                    mealDisplay = {
                        name: recipe.name,
                        icon: '🍳',
                        type: 'recipe'
                    };
                }
            }
        }
        
        return `
            <div class="meal-slot ${hasMeal ? 'has-meal' : ''}" 
                 onclick="app.assignMealToSlot(${dayIndex}, '${mealType}')">
                <div class="meal-type">${mealType}</div>
                ${hasMeal && mealDisplay ? `
                    <div class="meal-recipe">
                        <span class="meal-icon">${mealDisplay.icon}</span>
                        <span>${mealDisplay.name}</span>
                    </div>
                    <div class="meal-actions">
                        <button class="edit-meal-btn" onclick="event.stopPropagation(); app.assignMealToSlot(${dayIndex}, '${mealType}')">✏️</button>
                        <button class="remove-meal-btn" onclick="event.stopPropagation(); app.removeMeal(${dayIndex}, '${mealType}')">×</button>
                    </div>
                ` : `
                    <div style="color: #a0aec0; font-size: 11px; font-style: italic;">Click to add ${mealType}</div>
                `}
            </div>
        `;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

    // Debug utility to clear all data and start fresh
    clearAllData() {
        const keys = ['shoppingItems', 'standardItems', 'categories', 'allProducts', 'recipes'];
        keys.forEach(key => {
            localStorage.removeItem(key);
            localStorage.removeItem(key + '_backup');
            localStorage.removeItem(key + '_timestamp');
            localStorage.removeItem(key + '_initialized');
        });
        console.log('🧹 Cleared all localStorage data');
        window.location.reload();
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

    loadRecipes() {
        try {
            let saved = localStorage.getItem('recipes');
            
            // Try backup if main data is corrupted
            if (!saved || saved === 'null') {
                saved = localStorage.getItem('recipes_backup');
                console.log('Loaded recipes from localStorage backup');
            }
            
            let recipes = saved ? JSON.parse(saved) : [];
            
            // Provide sample data for new users
            if (recipes.length === 0 && !localStorage.getItem('recipes_initialized')) {
                recipes = this.getSampleRecipes();
                localStorage.setItem('recipes_initialized', 'true');
                console.log('📱 New user - loaded sample recipes');
            }
            
            console.log(`📦 Loaded ${recipes.length} recipes from localStorage`);
            return recipes;
        } catch (e) {
            console.error('Could not load recipes from localStorage:', e);
            return this.getSampleRecipes();
        }
    }

    saveRecipes() {
        try {
            const data = JSON.stringify(this.recipes);
            localStorage.setItem('recipes', data);
            localStorage.setItem('recipes_backup', data);
            localStorage.setItem('recipes_timestamp', new Date().toISOString());
            console.log(`💾 Saved ${this.recipes.length} recipes to localStorage`);
        } catch (e) {
            console.error('Could not save recipes to localStorage:', e);
            this.showPersistenceError('recipes');
        }
    }

    getSampleRecipes() {
        // Only create sample recipes if we have products to reference
        if (this.allProducts.length === 0) {
            return [];
        }

        // Find actual product IDs that exist
        const pastaProduct = this.allProducts.find(p => 
            p.name.toLowerCase().includes('pasta')
        );
        const tomatoProduct = this.allProducts.find(p => 
            p.name.toLowerCase().includes('tomato') || p.name.toLowerCase().includes('sauce')
        );

        // Only create recipe if we have valid products
        if (!pastaProduct || !tomatoProduct) {
            return [];
        }

        return [
            {
                id: Date.now(),
                name: "Simple Pasta",
                description: "Quick and easy pasta with tomato sauce",
                preparation: "1. Boil water in a large pot\n2. Add pasta and cook according to package instructions\n3. Heat tomato sauce in a separate pan\n4. Drain pasta and mix with sauce\n5. Serve hot",
                ingredients: [
                    { productId: pastaProduct.id, quantity: 100, unit: 'g' },
                    { productId: tomatoProduct.id, quantity: 200, unit: 'ml' }
                ],
                dateCreated: new Date().toISOString()
            }
        ];
    }

    findSampleProductId(productName) {
        const product = this.allProducts.find(p => 
            p.name.toLowerCase().includes(productName.toLowerCase())
        );
        return product ? product.id : null; // Return null instead of random number
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
                recipes: this.recipes,
                mealPlans: this.mealPlans,
                exportDate: new Date().toISOString(),
                exportTime: new Date().toLocaleString(),
                version: '1.3',
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
            if (data.recipes) this.recipes = data.recipes;
            if (data.mealPlans) this.mealPlans = data.mealPlans;
            
            // Save to localStorage
            this.saveShoppingItems();
            this.saveStandardItems();
            this.saveCategories();
            this.saveAllProducts();
            this.saveRecipes();
            this.saveMealPlans();
            
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
                  `🍳 Recipes: ${data.recipes?.length || 0}\n` +
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