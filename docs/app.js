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
        
        this.initializeDefaultCategories();
        this.initializeElements();
        this.attachEventListeners();
        this.render();
        
        console.log('🛒 Grocery Manager initialized with localStorage');
        console.log(`📊 Data loaded: ${this.shoppingItems.length} shopping items, ${this.standardItems.length} pantry items, ${this.categories.length} categories`);
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

        // Sync events
        this.exportDataBtn.addEventListener('click', () => this.exportData());
        this.importDataBtn.addEventListener('click', () => this.importFileInput.click());
        this.importFileInput.addEventListener('change', (e) => this.handleFileImport(e));


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
            },
            {
                id: Date.now() + 103,
                name: "Chicken Breast",
                category: "meat",
                inStock: false,
                dateAdded: new Date().toISOString()
            }
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
                exportDate: new Date().toISOString(),
                exportTime: new Date().toLocaleString(),
                version: '1.0',
                deviceInfo: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
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
        
        // Check filename
        if (file.name !== 'grocery-data.json') {
            alert('Please select the "grocery-data.json" file exported from another device.');
            return;
        }
        
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
            
            // Save to localStorage
            this.saveShoppingItems();
            this.saveStandardItems();
            this.saveCategories();
            
            // Update UI
            this.updateCategorySelects();
            this.render();
            
            // Success message with details
            const importInfo = data.exportTime ? `from ${data.exportTime}` : 'successfully';
            const deviceInfo = data.deviceInfo ? ` (${data.deviceInfo})` : '';
            alert(`Data imported ${importInfo}${deviceInfo}!\n\n` +
                  `📦 Shopping items: ${data.shoppingItems?.length || 0}\n` +
                  `🏠 Pantry items: ${data.standardItems?.length || 0}\n` +
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