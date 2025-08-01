class GroceryApp {
    constructor() {
        // Check if localStorage is working
        this.checkStorageHealth();
        
        this.currentTab = 'shopping';
        this.currentEditingItem = null;
        this.dataLoaded = false;
        
        this.initializeElements();
        this.attachEventListeners();
        
        // Load data from JSON files first, then fallback to localStorage
        this.loadAllData().then(() => {
            this.dataLoaded = true;
            this.initializeDefaultCategories();
            this.updateCategorySelects();
            this.render();
            console.log('🛒 Grocery Manager initialized with file-based storage');
            console.log(`📊 Data loaded: ${this.shoppingItems.length} shopping items, ${this.standardItems.length} pantry items, ${this.categories.length} categories`);
        });
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


        // Modal elements
        this.changeCategoryModal = document.getElementById('changeCategoryModal');
        this.itemNameSpan = document.getElementById('itemNameSpan');
        this.newCategorySelect = document.getElementById('newCategorySelect');
        this.cancelChangeCategoryBtn = document.getElementById('cancelChangeCategory');
        this.confirmChangeCategoryBtn = document.getElementById('confirmChangeCategory');
        this.closeModalBtn = document.querySelector('.close-modal');
    }

    attachEventListeners() {
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


        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelChangeCategoryBtn.addEventListener('click', () => this.closeModal());
        this.confirmChangeCategoryBtn.addEventListener('click', () => this.confirmCategoryChange());
        
        // Close modal when clicking outside
        this.changeCategoryModal.addEventListener('click', (e) => {
            if (e.target === this.changeCategoryModal) {
                this.closeModal();
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
        if (category && category.isDefault) {
            alert('Cannot delete default categories!');
            return;
        }

        // Check if category is being used
        const usedInShopping = this.shoppingItems.some(item => item.category === categoryId);
        const usedInStandard = this.standardItems.some(item => item.category === categoryId);

        if (usedInShopping || usedInStandard) {
            alert('Cannot delete category that is being used by items. Move items to other categories first.');
            return;
        }

        this.categories = this.categories.filter(cat => cat.id !== categoryId);
        this.saveCategories();
        this.updateCategorySelects();
        this.render();
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

        const newItem = {
            id: Date.now(),
            name: itemName,
            category: category,
            completed: false,
            dateAdded: new Date().toISOString(),
            fromStandard: false
        };

        this.shoppingItems.unshift(newItem);
        this.itemInput.value = '';
        this.itemInput.focus();
        this.saveShoppingItems();
        this.render();
    }

    toggleShoppingItem(id) {
        const item = this.shoppingItems.find(item => item.id === id);
        if (item) {
            item.completed = !item.completed;
            this.saveShoppingItems();
            this.render();
        }
    }

    deleteShoppingItem(id) {
        this.shoppingItems = this.shoppingItems.filter(item => item.id !== id);
        this.saveShoppingItems();
        this.render();
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
        this.shoppingItems = this.shoppingItems.filter(item => !item.completed);
        this.saveShoppingItems();
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

        // Check if item already exists
        const existingItem = this.standardItems.find(item => 
            item.name.toLowerCase() === itemName.toLowerCase() && 
            item.category === category
        );

        if (existingItem) {
            alert('This item already exists in your pantry list!');
            this.standardItemInput.value = '';
            return;
        }

        const newItem = {
            id: Date.now(),
            name: itemName,
            category: category,
            inStock: true,
            dateAdded: new Date().toISOString()
        };

        this.standardItems.push(newItem);
        this.standardItemInput.value = '';
        this.standardItemInput.focus();
        this.saveStandardItems();
        this.render();
    }

    toggleStandardItemStock(id) {
        const item = this.standardItems.find(item => item.id === id);
        if (item) {
            item.inStock = !item.inStock;
            
            // If marking as out of stock, add to shopping list
            if (!item.inStock) {
                this.addToShoppingFromStandard(item);
            } else {
                // If marking as in stock, remove from shopping list if it exists
                this.removeFromShoppingIfExists(item);
            }
            
            this.saveStandardItems();
            this.render();
        }
    }

    deleteStandardItem(id) {
        this.standardItems = this.standardItems.filter(item => item.id !== id);
        this.saveStandardItems();
        this.render();
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
        const unstockedItems = this.standardItems.filter(item => !item.inStock);
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
        } else if (this.currentTab === 'categories') {
            this.renderCategoriesList();
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

        // Group by category and render
        const groupedItems = this.groupItemsByCategory(this.standardItems);
        const categoryOrder = this.getCategoryOrder();
        
        let html = '';
        categoryOrder.forEach(categoryKey => {
            if (groupedItems[categoryKey] && groupedItems[categoryKey].length > 0) {
                html += this.renderStandardCategorySection(categoryKey, groupedItems[categoryKey]);
            }
        });
        
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
            <div class="category-item ${category.isDefault ? 'default' : ''}" data-category-id="${category.id}" data-index="${index}">
                <div class="category-drag-handle">⋮⋮</div>
                <div class="category-info">
                    <div class="category-emoji">${category.emoji}</div>
                    <div class="category-name">${category.name.charAt(0).toUpperCase() + category.name.slice(1)}</div>
                </div>
                <div class="category-actions">
                    <button class="delete-btn" onclick="app.deleteCategory('${category.id}')" ${category.isDefault ? 'disabled' : ''}>×</button>
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
        return `
            <div class="stock-item ${item.inStock ? '' : 'out-of-stock'}" data-id="${item.id}">
                <input 
                    type="checkbox" 
                    class="stock-checkbox" 
                    ${item.inStock ? 'checked' : ''}
                    onchange="app.toggleStandardItemStock(${item.id})"
                >
                <div class="stock-content">
                    <div class="stock-name">${this.escapeHtml(item.name)}</div>
                    <div class="stock-status ${item.inStock ? 'in-stock' : 'out-of-stock'}">
                        ${item.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                    </div>
                </div>
                <div class="stock-actions">
                    ${!item.inStock ? `<button class="add-to-list-btn" onclick="app.addToShoppingFromStandard({id: ${item.id}, name: '${item.name}', category: '${item.category}'})" title="Add to shopping list">+</button>` : ''}
                    <button class="edit-category-btn" onclick="app.openCategoryChangeModal(${item.id}, 'standard')" title="Change category">✏️</button>
                    <button class="delete-btn" onclick="app.deleteStandardItem(${item.id})">×</button>
                </div>
            </div>
        `;
    }

    groupItemsByCategory(items) {
        return items.reduce((groups, item) => {
            if (!groups[item.category]) {
                groups[item.category] = [];
            }
            groups[item.category].push(item);
            return groups;
        }, {});
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
                <div class="item-content">
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

    // Data Loading Methods (JSON Files + localStorage Fallback)
    async loadAllData() {
        try {
            console.log('📁 Loading data from JSON files...');
            
            // Load all data files in parallel
            const [shoppingData, pantryData, categoriesData] = await Promise.all([
                this.loadJsonFile('shopping-items.json'),
                this.loadJsonFile('pantry-items.json'), 
                this.loadJsonFile('categories.json')
            ]);

            this.shoppingItems = shoppingData || [];
            this.standardItems = pantryData || [];
            this.categories = categoriesData || [];

            console.log('✅ Data loaded from JSON files successfully');
        } catch (error) {
            console.warn('📁 JSON files not accessible (likely mobile/file:// restriction), loading from localStorage...', error);
            
            // Fallback to localStorage
            this.shoppingItems = this.loadShoppingItemsFromStorage();
            this.standardItems = this.loadStandardItemsFromStorage();
            this.categories = this.loadCategoriesFromStorage();
            
            // If localStorage is also empty, provide some sample data for mobile
            if (this.shoppingItems.length === 0 && this.standardItems.length === 0) {
                console.log('📱 Mobile detected with no data - loading sample data');
                this.loadSampleData();
            }
            
            console.log('✅ Data loaded from localStorage fallback');
        }
    }

    async loadJsonFile(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`📄 Loaded ${filename}: ${data.length} items`);
            return data;
        } catch (error) {
            console.warn(`⚠️ Could not load ${filename}:`, error.message);
            throw error;
        }
    }

    loadSampleData() {
        // Sample shopping items
        this.shoppingItems = [
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
            }
        ];

        // Sample pantry items
        this.standardItems = [
            {
                id: Date.now() + 100,
                name: "Rice",
                category: "pantry",
                inStock: true,
                dateAdded: new Date().toISOString()
            },
            {
                id: Date.now() + 101,
                name: "Milk",
                category: "dairy",
                inStock: false,
                dateAdded: new Date().toISOString()
            },
            {
                id: Date.now() + 102,
                name: "Apples",
                category: "produce",
                inStock: true,
                dateAdded: new Date().toISOString()
            }
        ];

        console.log('📱 Sample data loaded for mobile use');
    }

    // Enhanced save methods - save to localStorage and optionally generate JSON
    saveShoppingItems() {
        if (!this.dataLoaded) return; // Don't save during initial load
        
        try {
            const data = JSON.stringify(this.shoppingItems);
            localStorage.setItem('shoppingItems', data);
            localStorage.setItem('shoppingItems_backup', data);
            localStorage.setItem('shoppingItems_timestamp', new Date().toISOString());
            console.log(`💾 Saved ${this.shoppingItems.length} shopping items to localStorage`);
            
            // Optionally log JSON for manual file update
            if (this.shoppingItems.length > 0) {
                console.log('📄 Updated shopping items JSON:', JSON.stringify(this.shoppingItems, null, 2));
            }
        } catch (e) {
            console.error('Could not save shopping items to localStorage:', e);
            this.showPersistenceError('shopping items');
        }
    }

    saveStandardItems() {
        if (!this.dataLoaded) return; // Don't save during initial load
        
        try {
            const data = JSON.stringify(this.standardItems);
            localStorage.setItem('standardItems', data);
            localStorage.setItem('standardItems_backup', data);
            localStorage.setItem('standardItems_timestamp', new Date().toISOString());
            console.log(`💾 Saved ${this.standardItems.length} pantry items to localStorage`);
            
            // Optionally log JSON for manual file update
            if (this.standardItems.length > 0) {
                console.log('📄 Updated pantry items JSON:', JSON.stringify(this.standardItems, null, 2));
            }
        } catch (e) {
            console.error('Could not save standard items to localStorage:', e);
            this.showPersistenceError('pantry items');
        }
    }

    saveCategories() {
        if (!this.dataLoaded) return; // Don't save during initial load
        
        try {
            const data = JSON.stringify(this.categories);
            localStorage.setItem('categories', data);
            localStorage.setItem('categories_backup', data);
            localStorage.setItem('categories_timestamp', new Date().toISOString());
            console.log(`💾 Saved ${this.categories.length} categories to localStorage`);
            
            // Optionally log JSON for manual file update
            if (this.categories.length > 0) {
                console.log('📄 Updated categories JSON:', JSON.stringify(this.categories, null, 2));
            }
        } catch (e) {
            console.error('Could not save categories to localStorage:', e);
            this.showPersistenceError('categories');
        }
    }


    // localStorage Fallback Methods  
    loadShoppingItemsFromStorage() {
        try {
            let saved = localStorage.getItem('shoppingItems');
            
            // Try backup if main data is corrupted
            if (!saved || saved === 'null') {
                saved = localStorage.getItem('shoppingItems_backup');
                console.log('Loaded shopping items from localStorage backup');
            }
            
            const items = saved ? JSON.parse(saved) : [];
            console.log(`📦 Loaded ${items.length} shopping items from localStorage`);
            return items;
        } catch (e) {
            console.error('Could not load shopping items from localStorage:', e);
            try {
                // Try backup
                const backup = localStorage.getItem('shoppingItems_backup');
                if (backup) {
                    console.log('Recovering shopping items from localStorage backup');
                    return JSON.parse(backup);
                }
            } catch (backupError) {
                console.error('localStorage backup also corrupted:', backupError);
            }
            return [];
        }
    }

    loadStandardItemsFromStorage() {
        try {
            let saved = localStorage.getItem('standardItems');
            
            // Try backup if main data is corrupted
            if (!saved || saved === 'null') {
                saved = localStorage.getItem('standardItems_backup');
                console.log('Loaded pantry items from localStorage backup');
            }
            
            const items = saved ? JSON.parse(saved) : [];
            console.log(`📦 Loaded ${items.length} pantry items from localStorage`);
            return items;
        } catch (e) {
            console.error('Could not load standard items from localStorage:', e);
            try {
                // Try backup
                const backup = localStorage.getItem('standardItems_backup');
                if (backup) {
                    console.log('Recovering pantry items from localStorage backup');
                    return JSON.parse(backup);
                }
            } catch (backupError) {
                console.error('localStorage backup also corrupted:', backupError);
            }
            return [];
        }
    }

    loadCategoriesFromStorage() {
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
            try {
                // Try backup
                const backup = localStorage.getItem('categories_backup');
                if (backup) {
                    console.log('Recovering categories from localStorage backup');
                    return JSON.parse(backup);
                }
            } catch (backupError) {
                console.error('localStorage backup also corrupted:', backupError);
            }
            return [];
        }
    }

    showPersistenceError(dataType) {
        console.warn(`Storage error for ${dataType}. Your data might not be saved.`);
        // Could add user notification here if needed
    }

    // Data Export/Import Methods
    exportData() {
        const exportData = {
            shoppingItems: this.shoppingItems,
            standardItems: this.standardItems,
            categories: this.categories,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `grocery-data-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.shoppingItems) this.shoppingItems = data.shoppingItems;
            if (data.standardItems) this.standardItems = data.standardItems;
            if (data.categories) this.categories = data.categories;
            
            this.saveShoppingItems();
            this.saveStandardItems();
            this.saveCategories();
            this.updateCategorySelects();
            this.render();
            
            alert('Data imported successfully!');
        } catch (e) {
            alert('Invalid data format. Please check your file.');
            console.error('Import error:', e);
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